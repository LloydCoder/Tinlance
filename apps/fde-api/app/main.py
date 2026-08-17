from __future__ import annotations

import hashlib
import hmac
import os
import time
from typing import Annotated
from uuid import uuid4

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
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
    version="0.2.0",
    docs_url="/docs" if os.getenv("FDE_ENABLE_DOCS", "false").lower() == "true" else None,
    redoc_url=None,
)


class ExecutionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    task: str = Field(min_length=1, max_length=20_000)
    domain: str = Field(min_length=1, max_length=100)
    organization_id: str | None = Field(default=None, max_length=128)
    metadata: dict[str, str] = Field(default_factory=dict)


class ExecutionResponse(BaseModel):
    request_id: str
    status: str
    upstream_status: int | None = None
    result: dict | None = None


def require_service_token(
    authorization: Annotated[str | None, Header()] = None,
) -> None:
    """Authenticate callers of this gateway within the Tinlance trust boundary."""
    expected = os.getenv("FDE_SERVICE_TOKEN")
    if not expected:
        raise HTTPException(
            status_code=503,
            detail="FDE service authentication is not configured",
        )
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    provided = authorization.removeprefix("Bearer ").strip()
    expected_digest = hashlib.sha256(expected.encode()).digest()
    provided_digest = hashlib.sha256(provided.encode()).digest()
    if not hmac.compare_digest(provided_digest, expected_digest):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")


_cached_token: str | None = None
_cached_token_expires_at: float = 0.0


async def get_upstream_token() -> str | None:
    """Resolve the bearer token used to call fde-mastery.

    Enterprise path: OAuth 2.0 client-credentials grant against a real
    authorization server. Tokens are cached until shortly before expiry.

    Dev/fallback path: a static FDE_MASTER_UPSTREAM_TOKEN may be supplied for
    local development or while an authorization server is not provisioned.
    """
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

        async with httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=5.0)) as client:
            try:
                response = await client.post(token_url, data=form)
                response.raise_for_status()
                payload = response.json()
            except (httpx.HTTPError, ValueError) as exc:
                raise HTTPException(status_code=503, detail="Unable to obtain upstream credentials") from exc

        access_token = payload.get("access_token")
        try:
            expires_in = int(payload.get("expires_in", 60))
        except (TypeError, ValueError) as exc:
            raise HTTPException(status_code=503, detail="Upstream token response was malformed") from exc
        if not isinstance(access_token, str) or not access_token:
            raise HTTPException(status_code=503, detail="Upstream token response was malformed")

        _cached_token = access_token
        _cached_token_expires_at = time.monotonic() + max(expires_in - 30, 5)
        return _cached_token

    return os.getenv("FDE_MASTER_UPSTREAM_TOKEN")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/ready")
async def ready() -> dict[str, str]:
    has_static_auth = bool(os.getenv("FDE_MASTER_UPSTREAM_TOKEN"))
    has_oauth = bool(
        os.getenv("FDE_OAUTH_TOKEN_URL")
        and os.getenv("FDE_OAUTH_CLIENT_ID")
        and os.getenv("FDE_OAUTH_CLIENT_SECRET")
    )
    if not os.getenv("FDE_SERVICE_TOKEN") or not os.getenv("FDE_MASTER_UPSTREAM_URL"):
        raise HTTPException(status_code=503, detail="FDE gateway is not configured")
    if not (has_static_auth or has_oauth):
        raise HTTPException(status_code=503, detail="No upstream credential source configured")
    return {"status": "ready"}


@app.post(
    "/v1/execute",
    response_model=ExecutionResponse,
    dependencies=[Depends(require_service_token)],
)
async def execute(payload: ExecutionRequest, request: Request) -> ExecutionResponse:
    request_id = request.headers.get("x-request-id") or str(uuid4())

    domain = payload.domain.strip().lower()
    if domain not in VALID_DOMAINS:
        raise HTTPException(status_code=422, detail=f"Unknown domain: {payload.domain}")

    upstream = os.getenv("FDE_MASTER_UPSTREAM_URL")
    if not upstream:
        raise HTTPException(status_code=503, detail="FDE upstream is not configured")

    tenant_id = os.getenv("FDE_TENANT_ID")
    if not tenant_id:
        raise HTTPException(status_code=503, detail="FDE_TENANT_ID is not configured")

    token = await get_upstream_token()
    headers = {"x-request-id": request_id}
    if token:
        headers["authorization"] = f"Bearer {token}"

    upstream_body = {
        "tenant_id": tenant_id,
        "payload": {
            "task": payload.task,
            "organization_id": payload.organization_id,
            "metadata": payload.metadata,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=5.0)) as client:
            response = await client.post(
                upstream.rstrip("/") + f"/v1/{domain}/execute",
                json=upstream_body,
                headers=headers,
            )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="FDE upstream unavailable") from exc

    if response.status_code >= 500:
        raise HTTPException(status_code=503, detail="FDE upstream unavailable")
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="FDE upstream rejected the request")

    try:
        result = response.json()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="FDE upstream returned malformed data") from exc

    if not isinstance(result, dict):
        raise HTTPException(status_code=502, detail="FDE upstream returned malformed data")

    return ExecutionResponse(
        request_id=request_id,
        status="completed",
        upstream_status=response.status_code,
        result=result,
    )
