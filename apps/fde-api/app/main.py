from __future__ import annotations

import hashlib
import hmac
import os
import time
from typing import Annotated, Any
from uuid import UUID, uuid4

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel, ConfigDict, Field

VALID_DOMAINS = {
    "cybersecurity",
    "finance",
    "healthtech",
    "logistics",
    "legal",
    "revops",
}

app = FastAPI(
    title="Tinlance FDE API",
    version="0.4.0",
    docs_url=(
        "/docs"
        if os.getenv("FDE_ENABLE_DOCS", "false").lower() == "true"
        else None
    ),
    redoc_url=None,
)

allowed_hosts = [
    host.strip()
    for host in os.getenv(
        "FDE_ALLOWED_HOSTS",
        "localhost,127.0.0.1,testserver",
    ).split(",")
    if host.strip()
]
app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)


class ExecutionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tenant_id: str = Field(
        min_length=1,
        max_length=100,
        pattern=r"^[a-z0-9-]+$",
    )
    payload: dict[str, Any] = Field(min_length=1)


class ExecutionResponse(BaseModel):
    request_id: str
    status: str
    upstream_status: int | None = None
    result: dict | None = None


def require_service_token(
    authorization: Annotated[str | None, Header()] = None,
) -> None:
    """Authenticate callers within the Tinlance service trust boundary."""
    expected = os.getenv("FDE_SERVICE_TOKEN")
    if not expected:
        raise HTTPException(
            status_code=503,
            detail="FDE service authentication is not configured",
        )
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
        )

    provided = authorization.removeprefix("Bearer ").strip()
    expected_digest = hashlib.sha256(expected.encode()).digest()
    provided_digest = hashlib.sha256(provided.encode()).digest()
    if not hmac.compare_digest(provided_digest, expected_digest):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
        )


_cached_token: str | None = None
_cached_token_expires_at: float = 0.0


def static_token_allowed() -> bool:
    return os.getenv("FDE_ENV", "production").strip().lower() in {
        "development",
        "test",
    }


async def get_upstream_token() -> str | None:
    """Resolve the bearer token used to call FDE Mastery."""
    global _cached_token, _cached_token_expires_at

    token_url = os.getenv("FDE_OAUTH_TOKEN_URL")
    client_id = os.getenv("FDE_OAUTH_CLIENT_ID")
    client_secret = os.getenv("FDE_OAUTH_CLIENT_SECRET")
    audience = os.getenv("FDE_OAUTH_AUDIENCE")

    if token_url and client_id and client_secret:
        if _cached_token and time.monotonic() < _cached_token_expires_at:
            return _cached_token

        form: dict[str, str] = {
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret,
        }
        if audience:
            form["audience"] = audience

        async with httpx.AsyncClient(
            timeout=httpx.Timeout(10.0, connect=5.0)
        ) as client:
            try:
                response = await client.post(token_url, data=form)
                response.raise_for_status()
                token_payload = response.json()
            except (httpx.HTTPError, ValueError) as exc:
                raise HTTPException(
                    status_code=503,
                    detail="Unable to obtain upstream credentials",
                ) from exc

        access_token = token_payload.get("access_token")
        try:
            expires_in = int(token_payload.get("expires_in", 60))
        except (TypeError, ValueError) as exc:
            raise HTTPException(
                status_code=503,
                detail="Upstream token response was malformed",
            ) from exc
        if not isinstance(access_token, str) or not access_token:
            raise HTTPException(
                status_code=503,
                detail="Upstream token response was malformed",
            )

        _cached_token = access_token
        _cached_token_expires_at = time.monotonic() + max(expires_in - 30, 5)
        return _cached_token

    if static_token_allowed():
        return os.getenv("FDE_MASTER_UPSTREAM_TOKEN")

    return None


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "api_version": "0.4.0"}


@app.get("/ready")
async def ready() -> dict[str, str]:
    has_oauth = bool(
        os.getenv("FDE_OAUTH_TOKEN_URL")
        and os.getenv("FDE_OAUTH_CLIENT_ID")
        and os.getenv("FDE_OAUTH_CLIENT_SECRET")
    )
    has_static_auth = static_token_allowed() and bool(
        os.getenv("FDE_MASTER_UPSTREAM_TOKEN")
    )
    if not os.getenv("FDE_SERVICE_TOKEN") or not os.getenv("FDE_MASTER_UPSTREAM_URL"):
        raise HTTPException(
            status_code=503,
            detail="FDE gateway is not configured",
        )
    if not (has_static_auth or has_oauth):
        raise HTTPException(
            status_code=503,
            detail="Production OAuth upstream authentication is required",
        )
    return {"status": "ready"}


@app.post(
    "/v1/{domain}/execute",
    response_model=ExecutionResponse,
    dependencies=[Depends(require_service_token)],
)
async def execute(
    domain: str,
    payload: ExecutionRequest,
    request: Request,
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
) -> ExecutionResponse:
    raw_request_id = request.headers.get("x-request-id")
    try:
        request_id = str(UUID(raw_request_id)) if raw_request_id else str(uuid4())
    except (ValueError, AttributeError):
        request_id = str(uuid4())

    if not idempotency_key or not idempotency_key.strip():
        raise HTTPException(
            status_code=400,
            detail="Idempotency-Key is required",
        )
    idempotency_key = idempotency_key.strip()
    if len(idempotency_key) > 255:
        raise HTTPException(
            status_code=400,
            detail="Idempotency-Key is too long",
        )

    normalized_domain = domain.strip().lower()
    if normalized_domain not in VALID_DOMAINS:
        raise HTTPException(status_code=422, detail="Unknown domain")

    upstream = os.getenv("FDE_MASTER_UPSTREAM_URL")
    if not upstream:
        raise HTTPException(
            status_code=503,
            detail="FDE upstream is not configured",
        )

    token = await get_upstream_token()
    if not token:
        raise HTTPException(
            status_code=503,
            detail="Production OAuth upstream authentication is required",
        )

    headers = {
        "x-request-id": request_id,
        "Idempotency-Key": idempotency_key,
        "authorization": f"Bearer {token}",
    }

    upstream_payload = {
        "tenant_id": payload.tenant_id,
        "payload": payload.payload,
    }

    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(30.0, connect=5.0)
        ) as client:
            response = await client.post(
                upstream.rstrip("/") + f"/v1/{normalized_domain}/execute",
                json=upstream_payload,
                headers=headers,
            )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=503,
            detail="FDE upstream unavailable",
        ) from exc

    if response.status_code >= 500:
        raise HTTPException(
            status_code=503,
            detail="FDE upstream unavailable",
        )
    if response.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail="FDE upstream rejected the request",
        )

    try:
        result = response.json()
    except ValueError as exc:
        raise HTTPException(
            status_code=502,
            detail="FDE upstream returned malformed data",
        ) from exc

    if not isinstance(result, dict):
        raise HTTPException(
            status_code=502,
            detail="FDE upstream returned malformed data",
        )

    return ExecutionResponse(
        request_id=request_id,
        status="completed",
        upstream_status=response.status_code,
        result=result,
    )
