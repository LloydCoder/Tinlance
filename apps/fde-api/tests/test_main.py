import json

import respx
from fastapi.testclient import TestClient
from httpx import Response

from app.main import app

client = TestClient(app)
AUTH_HEADERS = {
    "Authorization": "Bearer secret",
    "Idempotency-Key": "test-idempotency-key",
}


def test_health_is_public(monkeypatch):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "api_version": "0.3.0"}


def test_execute_requires_authentication(monkeypatch):
    monkeypatch.setenv("FDE_SERVICE_TOKEN", "secret")
    response = client.post(
        "/v1/execute",
        headers={"Idempotency-Key": "test-idempotency-key"},
        json={"task": "test", "domain": "cybersecurity", "organization_id": "org123"},
    )
    assert response.status_code == 401


def test_execute_requires_idempotency_key(monkeypatch):
    monkeypatch.setenv("FDE_SERVICE_TOKEN", "secret")
    response = client.post(
        "/v1/execute",
        headers={"Authorization": "Bearer secret"},
        json={"task": "test", "domain": "cybersecurity", "organization_id": "org123"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Idempotency-Key is required"


def test_execute_requires_upstream(monkeypatch):
    monkeypatch.setenv("FDE_SERVICE_TOKEN", "secret")
    monkeypatch.delenv("FDE_MASTER_UPSTREAM_URL", raising=False)
    response = client.post(
        "/v1/execute",
        headers=AUTH_HEADERS,
        json={"task": "test", "domain": "cybersecurity", "organization_id": "org123"},
    )
    assert response.status_code == 503


def test_execute_rejects_unknown_domain(monkeypatch):
    monkeypatch.setenv("FDE_SERVICE_TOKEN", "secret")
    monkeypatch.setenv("FDE_MASTER_UPSTREAM_URL", "https://fde-mastery.internal")
    monkeypatch.setenv("FDE_MASTER_UPSTREAM_TOKEN", "static-token")
    response = client.post(
        "/v1/execute",
        headers=AUTH_HEADERS,
        json={"task": "test", "domain": "not-a-real-domain", "organization_id": "org123"},
    )
    assert response.status_code == 422


@respx.mock
def test_execute_calls_canonical_v1_upstream_route_and_shape(monkeypatch):
    monkeypatch.setenv("FDE_SERVICE_TOKEN", "secret")
    monkeypatch.setenv("FDE_MASTER_UPSTREAM_URL", "https://fde-mastery.internal")
    monkeypatch.setenv("FDE_MASTER_UPSTREAM_TOKEN", "static-token")

    route = respx.post("https://fde-mastery.internal/v1/triage/org123/cybersecurity").mock(
        return_value=Response(200, json={"triaged": True})
    )

    response = client.post(
        "/v1/execute",
        headers={**AUTH_HEADERS, "X-Request-ID": "12345678-1234-4234-8234-123456789012"},
        json={
            "task": "triage this alert",
            "domain": "cybersecurity",
            "organization_id": "org123",
            "metadata": {"source": "test"},
        },
    )

    assert response.status_code == 200
    assert route.called
    parsed = json.loads(route.calls.last.request.content)
    assert parsed["task"] == "triage this alert"
    assert parsed["metadata"] == {"source": "test"}
    assert parsed["source"] == "tinlance"
    assert route.calls.last.request.headers["authorization"] == "Bearer static-token"
    assert route.calls.last.request.headers["idempotency-key"] == "test-idempotency-key"
    assert route.calls.last.request.headers["x-request-id"] == "12345678-1234-4234-8234-123456789012"
    assert response.json()["request_id"] == "12345678-1234-4234-8234-123456789012"


@respx.mock
def test_execute_rejects_invalid_organization_id(monkeypatch):
    monkeypatch.setenv("FDE_SERVICE_TOKEN", "secret")
    monkeypatch.setenv("FDE_MASTER_UPSTREAM_URL", "https://fde-mastery.internal")
    monkeypatch.setenv("FDE_MASTER_UPSTREAM_TOKEN", "static-token")
    response = client.post(
        "/v1/execute",
        headers=AUTH_HEADERS,
        json={"task": "test", "domain": "cybersecurity", "organization_id": "ORG_BAD"},
    )
    assert response.status_code == 422


@respx.mock
def test_execute_caches_oauth_token_across_requests(monkeypatch):
    monkeypatch.setenv("FDE_SERVICE_TOKEN", "secret")
    monkeypatch.setenv("FDE_MASTER_UPSTREAM_URL", "https://fde-mastery.internal")
    monkeypatch.delenv("FDE_MASTER_UPSTREAM_TOKEN", raising=False)
    monkeypatch.setenv("FDE_OAUTH_TOKEN_URL", "https://idp.internal/oauth/token")
    monkeypatch.setenv("FDE_OAUTH_CLIENT_ID", "fde-api")
    monkeypatch.setenv("FDE_OAUTH_CLIENT_SECRET", "shh")

    import app.main as main_module

    main_module._cached_token = None
    main_module._cached_token_expires_at = 0.0

    token_route = respx.post("https://idp.internal/oauth/token").mock(
        return_value=Response(200, json={"access_token": "minted-token", "expires_in": 300})
    )
    upstream_route = respx.post("https://fde-mastery.internal/v1/triage/org123/finance").mock(
        return_value=Response(200, json={"ok": True})
    )

    for index in range(2):
        response = client.post(
            "/v1/execute",
            headers={
                "Authorization": "Bearer secret",
                "Idempotency-Key": f"oauth-test-{index}",
            },
            json={"task": "check", "domain": "finance", "organization_id": "org123"},
        )
        assert response.status_code == 200

    assert token_route.call_count == 1
    assert upstream_route.call_count == 2
    assert upstream_route.calls.last.request.headers["authorization"] == "Bearer minted-token"
