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
BASE_PAYLOAD = {"synthetic": True, "case_id": "TEST-CASE"}


def configure_static_test_auth(monkeypatch):
    monkeypatch.setenv("FDE_ENV", "test")
    monkeypatch.setenv("FDE_SERVICE_TOKEN", "secret")
    monkeypatch.setenv("FDE_MASTER_UPSTREAM_URL", "https://fde-mastery.internal")
    monkeypatch.setenv("FDE_MASTER_UPSTREAM_TOKEN", "static-token")


def test_health_is_public(monkeypatch):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "api_version": "0.4.0"}


def test_execute_requires_authentication(monkeypatch):
    configure_static_test_auth(monkeypatch)
    response = client.post(
        "/v1/cybersecurity/execute",
        headers={"Idempotency-Key": "test-idempotency-key"},
        json={"tenant_id": "org123", "payload": BASE_PAYLOAD},
    )
    assert response.status_code == 401


def test_execute_requires_idempotency_key(monkeypatch):
    configure_static_test_auth(monkeypatch)
    response = client.post(
        "/v1/cybersecurity/execute",
        headers={"Authorization": "Bearer secret"},
        json={"tenant_id": "org123", "payload": BASE_PAYLOAD},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Idempotency-Key is required"


def test_execute_requires_upstream(monkeypatch):
    monkeypatch.setenv("FDE_ENV", "test")
    monkeypatch.setenv("FDE_SERVICE_TOKEN", "secret")
    monkeypatch.delenv("FDE_MASTER_UPSTREAM_URL", raising=False)
    monkeypatch.setenv("FDE_MASTER_UPSTREAM_TOKEN", "static-token")
    response = client.post(
        "/v1/cybersecurity/execute",
        headers=AUTH_HEADERS,
        json={"tenant_id": "org123", "payload": BASE_PAYLOAD},
    )
    assert response.status_code == 503


def test_production_rejects_static_upstream_auth(monkeypatch):
    monkeypatch.setenv("FDE_ENV", "production")
    monkeypatch.setenv("FDE_SERVICE_TOKEN", "secret")
    monkeypatch.setenv("FDE_MASTER_UPSTREAM_URL", "https://fde-mastery.internal")
    monkeypatch.setenv("FDE_MASTER_UPSTREAM_TOKEN", "static-token")
    monkeypatch.delenv("FDE_OAUTH_TOKEN_URL", raising=False)
    monkeypatch.delenv("FDE_OAUTH_CLIENT_ID", raising=False)
    monkeypatch.delenv("FDE_OAUTH_CLIENT_SECRET", raising=False)
    response = client.get("/ready")
    assert response.status_code == 503


def test_execute_rejects_unknown_domain(monkeypatch):
    configure_static_test_auth(monkeypatch)
    response = client.post(
        "/v1/not-a-real-domain/execute",
        headers=AUTH_HEADERS,
        json={"tenant_id": "org123", "payload": BASE_PAYLOAD},
    )
    assert response.status_code == 422


@respx.mock
def test_execute_calls_fde_mastery_canonical_route_and_envelope(monkeypatch):
    configure_static_test_auth(monkeypatch)

    route = respx.post("https://fde-mastery.internal/v1/cybersecurity/execute").mock(
        return_value=Response(200, json={"executed": True})
    )

    request_id = "12345678-1234-4234-8234-123456789012"
    response = client.post(
        "/v1/cybersecurity/execute",
        headers={**AUTH_HEADERS, "X-Request-ID": request_id},
        json={
            "tenant_id": "org123",
            "payload": {"case_id": "E2E-cybersecurity", "alert": "execute this"},
        },
    )

    assert response.status_code == 200
    assert route.called
    parsed = json.loads(route.calls.last.request.content)
    assert parsed == {
        "tenant_id": "org123",
        "payload": {"case_id": "E2E-cybersecurity", "alert": "execute this"},
    }
    assert route.calls.last.request.headers["authorization"] == "Bearer static-token"
    assert route.calls.last.request.headers["idempotency-key"] == "test-idempotency-key"
    assert route.calls.last.request.headers["x-request-id"] == request_id
    assert response.json()["request_id"] == request_id


@respx.mock
def test_execute_rejects_invalid_tenant_id(monkeypatch):
    configure_static_test_auth(monkeypatch)
    response = client.post(
        "/v1/cybersecurity/execute",
        headers=AUTH_HEADERS,
        json={"tenant_id": "ORG_BAD", "payload": BASE_PAYLOAD},
    )
    assert response.status_code == 422


@respx.mock
def test_execute_caches_oauth_token_across_requests(monkeypatch):
    monkeypatch.setenv("FDE_ENV", "production")
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
    upstream_route = respx.post("https://fde-mastery.internal/v1/finance/execute").mock(
        return_value=Response(200, json={"ok": True})
    )

    for index in range(2):
        response = client.post(
            "/v1/finance/execute",
            headers={
                "Authorization": "Bearer secret",
                "Idempotency-Key": f"oauth-test-{index}",
            },
            json={
                "tenant_id": "org123",
                "payload": {"case_id": f"OAUTH-{index}", "synthetic": True},
            },
        )
        assert response.status_code == 200

    assert token_route.call_count == 1
    assert upstream_route.call_count == 2
    assert upstream_route.calls.last.request.headers["authorization"] == "Bearer minted-token"
