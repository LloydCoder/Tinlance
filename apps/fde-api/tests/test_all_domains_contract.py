import json

import respx
from fastapi.testclient import TestClient
from httpx import Response

from app.main import app

DOMAINS = (
    "cybersecurity",
    "finance",
    "healthtech",
    "logistics",
    "legal",
    "revops",
)

PAYLOADS = {
    domain: {"synthetic": True, "domain": domain, "case_id": f"E2E-{domain}"}
    for domain in DOMAINS
}


@respx.mock
def test_gateway_forwards_every_supported_domain(monkeypatch):
    monkeypatch.setenv("FDE_ENV", "test")
    monkeypatch.setenv("FDE_SERVICE_TOKEN", "secret")
    monkeypatch.setenv("FDE_MASTER_UPSTREAM_URL", "https://fde-mastery.internal")
    monkeypatch.setenv("FDE_MASTER_UPSTREAM_TOKEN", "static-token")

    routes = {
        domain: respx.post(
            f"https://fde-mastery.internal/v1/{domain}/execute"
        ).mock(return_value=Response(200, json={"domain": domain, "ok": True}))
        for domain in DOMAINS
    }

    client = TestClient(app)
    for index, domain in enumerate(DOMAINS):
        response = client.post(
            f"/v1/{domain}/execute",
            headers={
                "Authorization": "Bearer secret",
                "Idempotency-Key": f"domain-contract-{domain}",
                "X-Request-ID": f"12345678-1234-4234-8234-{index:012d}",
            },
            json={
                "tenant_id": "org123",
                "payload": PAYLOADS[domain],
            },
        )
        assert response.status_code == 200, f"{domain}: {response.text}"
        assert routes[domain].called
        forwarded = json.loads(routes[domain].calls.last.request.content)
        assert forwarded["tenant_id"] == "org123"
        assert forwarded["payload"]["case_id"] == f"E2E-{domain}"
        assert forwarded["payload"]["domain"] == domain
        assert response.json()["result"]["domain"] == domain


def test_unknown_domain_fails_closed(monkeypatch):
    monkeypatch.setenv("FDE_ENV", "test")
    monkeypatch.setenv("FDE_SERVICE_TOKEN", "secret")
    monkeypatch.setenv("FDE_MASTER_UPSTREAM_URL", "https://fde-mastery.internal")
    monkeypatch.setenv("FDE_MASTER_UPSTREAM_TOKEN", "static-token")
    response = TestClient(app).post(
        "/v1/unknown/execute",
        headers={
            "Authorization": "Bearer secret",
            "Idempotency-Key": "unknown-domain",
        },
        json={
            "tenant_id": "org123",
            "payload": {"synthetic": True},
        },
    )
    assert response.status_code == 422
