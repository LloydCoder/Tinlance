from fastapi.testclient import TestClient

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
        json={"task": "test", "domain": "security"},
    )
    assert response.status_code == 401


def test_execute_requires_upstream(monkeypatch):
    monkeypatch.setenv("FDE_SERVICE_TOKEN", "secret")
    monkeypatch.delenv("FDE_MASTER_UPSTREAM_URL", raising=False)
    response = client.post(
        "/v1/execute",
        headers={"Authorization": "Bearer secret"},
        json={"task": "test", "domain": "security"},
    )
    assert response.status_code == 503
