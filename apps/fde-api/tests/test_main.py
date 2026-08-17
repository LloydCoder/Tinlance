import json

import respx
from fastapi.testclient import TestClient
from httpx import Response

from app.main import app

client = TestClient(app)


def test_health_is_public(monkeypatch):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_execute_requires_authentication(monkeypatch):
    monkeypatch.setenv("FDE_SERVICE_TOKEN", "secret")
    response = client.post(
        "/v1/execute",
        json={"task": "test", "domain": "cybersecurity"},
    )
    assert response.status_code == 401


def test_execute_requires_upstream(monkeypatch):
    monkeypatch.setenv("FDE_SERVICE_TOKEN", "secret")
    monkeypatch.setenv("FDE_TENANT_ID", "tinlance")
    monkeypatch.delenv("FDE_MASTER_UPSTREAM_URL", raising=False)
    response = client.post(
        "/v1/execute",
        headers={"Authorization": "Bearer secret"},
        json={"task": "test", "domain": "cybersecurity"},
    )
    assert response.status_code == 503


def test_execute_rejects_unknown_domain(monkeypatch):
    monkeypatch.setenv("FDE_SERVICE_TOKEN", "secret")
    monkeypatch.setenv("FDE_TENANT_ID", "tinlance")
    monkeypatch.setenv("FDE_MASTER_UPSTREAM_URL", "https://fde-mastery.internal")
    monkeypatch.setenv("FDE_MASTER_UPSTREAM_TOKEN", "static-token")
    response = client.post(
        "/v1/execute",
        headers={"Authorization": "Bearer secret"},
        json={"task": "test", "domain": "not-a-real-domain"},
    )
    assert response.status_code == 422


@respx.mock
def test_execute_calls_correct_upstream_route_and_shape(monkeypatch):
    monkeypatch.setenv("FDE_SERVICE_TOKEN", "secret")
    monkeypatch.setenv("FDE_TENANT_ID", "tinlance")
    monkeypatch.setenv("FDE_MASTER_UPSTREAM_URL", "https://fde-mastery.internal")
    monkeypatch.setenv("FDE_MASTER_UPSTREAM_TOKEN", "static-token")

    route = respx.post("https://fde-mastery.internal/v1/cybersecurity/execute").mock(
        return_value=Response(200, json={"triaged": True})
    )

    response = client.post(
        "/v1/execute",
        headers={"Authorization": "Bearer secret"},
        json={
            "task": "triage this alert",
            "domain": "cybersecurity",
            "organization_id": "org_123",
            "metadata": {"source": "test"},
        },
    )

    assert response.status_code == 200
    assert route.called
    parsed = json.loads(route.calls.last.request.content)
    assert parsed["tenant_id"] == "tinlance"
    assert parsed["payload"]["task"] == "triage this alert"
    assert parsed["payload"]["organization_id"] == "org_123"
    assert parsed["payload"]["metadata"] == {"source": "test"}
    assert route.calls.last.request.headers["authorization"] == "Bearer static-token"


@respx.mock
def test_execute_caches_oauth_token_across_requests(monkeypatch):
    monkeypatch.setenv("FDE_SERVICE_TOKEN", "secret")
    monkeypatch.setenv("FDE_TENANT_ID", "tinlance")
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
    upstream_route = respx.post("https://fde-mastery.internal/v1/finance/execute").mock(
        return_value=Response(200, json={"ok": True})
    )

    for _ in range(2):
        response = client.post(
            "/v1/execute",
            headers={"Authorization": "Bearer secret"},
            json={"task": "check", "domain": "finance"},
        )
        assert response.status_code == 200

    assert token_route.call_count == 1
    assert upstream_route.call_count == 2
    assert upstream_route.calls.last.request.headers["authorization"] == "Bearer minted-token"
