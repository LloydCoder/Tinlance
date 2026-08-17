from __future__ import annotations

import hashlib
import hmac
import os
from typing import Annotated
from uuid import uuid4

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from pydantic import BaseModel, ConfigDict, Field

app = FastAPI(
    title="Tinlance FDE API",
    version="0.1.0",
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


def require_service_token(authorization: Annotated[str | None, Header()] = None) -> None:
    expected = os.getenv("FDE_SERVICE_TOKEN")
    if not expected:
        raise HTTPException(status_code=503, detail="FDE service authentication is not configured")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    provided = authorization.removeprefix("Bearer ").strip()
    if not hmac.compare_digest(hashlib.sha256(provided.encode()).digest(), hashlib.sha256(expected.encode()).digest()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/ready")
async def ready() -> dict[str, str]:
    if not os.getenv("FDE_SERVICE_TOKEN") or not os.getenv("FDE_MASTER_UPSTREAM_URL"):
        raise HTTPException(status_code=503, detail="FDE gateway is not configured")
    return {"status": "ready"}


@app.post("/v1/execute", response_model=ExecutionResponse, dependencies=[Depends(require_service_token)])
async def execute(payload: ExecutionRequest, request: Request) -> ExecutionResponse:
    request_id = request.headers.get("x-request-id") or str(uuid4())
    upstream = os.getenv("FDE_MASTER_UPSTREAM_URL")
    if not upstream:
        raise HTTPException(status_code=503, detail="FDE upstream is not configured")

    token = os.getenv("FDE_MASTER_UPSTREAM_TOKEN")
    headers = {"x-request-id": request_id}
    if token:
        headers["authorization"] = f"Bearer {token}"

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=5.0)) as client:
            response = await client.post(
                upstream.rstrip("/") + "/v1/execute",
                json=payload.model_dump(),
                headers=headers,
            )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="FDE upstream unavailable") from exc

    if response.status_code >= 500:
        raise HTTPException(status_code=503, detail="FDE upstream unavailable")
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="FDE upstream rejected the request")

    return ExecutionResponse(
        request_id=request_id,
        status="completed",
        upstream_status=response.status_code,
        result=response.json(),
    )
