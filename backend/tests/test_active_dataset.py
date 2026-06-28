import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_active_dataset_flow():
    # 1. Get current active dataset
    response = client.get("/api/upload/active")
    assert response.status_code == 200
    
    # 2. List recent uploads
    response = client.get("/api/upload/recent")
    assert response.status_code == 200
    datasets = response.json()
    
    if datasets:
        target_id = datasets[0]["upload_id"]
        # Set active dataset
        response = client.post(f"/api/upload/active/{target_id}")
        assert response.status_code == 200
        assert response.json()["upload_id"] == target_id
        
        # Retrieve active dataset and check if matched
        response = client.get("/api/upload/active")
        assert response.status_code == 200
        assert response.json()["upload_id"] == target_id
        
        # Test active dataset overview calculations
        response = client.get("/api/analytics/overview")
        assert response.status_code == 200
        data = response.json()
        assert "revenue" in data
        assert "orders" in data
        assert "aov" in data
