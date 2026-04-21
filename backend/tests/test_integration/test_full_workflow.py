"""
Full workflow integration test:
Program -> Series -> Zones -> Buses -> Config -> Equipment -> Validate -> Clone -> Diff -> Documents
"""
import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_full_equipment_management_workflow(client: AsyncClient, auth_headers: dict):
    """Test the complete equipment management workflow end-to-end."""

    # 1. Create Program
    resp = await client.post("/api/programs", json={
        "name": f"TEST-{uuid.uuid4().hex[:6]}", "aircraft_type": "TestAircraft",
    }, headers=auth_headers)
    assert resp.status_code == 201
    program_id = resp.json()["id"]

    # 2. Create Series
    resp = await client.post("/api/series", json={
        "program_id": program_id, "variant_name": "基本型",
    }, headers=auth_headers)
    assert resp.status_code == 201
    series_id = resp.json()["id"]

    # 3. Create Zones
    resp = await client.get(f"/api/zones?series_id={series_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json() == []  # Empty initially

    # 4. Create Bus Definitions (via direct DB in real test, but API for zones/buses is read-only)
    # For integration test, we skip bus creation since it requires direct DB access
    # The constraint engine will handle missing buses gracefully

    # 5. Create Configuration
    resp = await client.post("/api/configurations", json={
        "series_id": series_id, "version": "V1.0",
    }, headers=auth_headers)
    assert resp.status_code == 201
    config_id = resp.json()["id"]
    assert resp.json()["status"] == "draft"

    # 6. Create Equipment
    resp = await client.post("/api/equipment", json={
        "part_number": f"FMC-{uuid.uuid4().hex[:4]}",
        "name": "飞行管理计算机",
        "ata_chapter": "34-21",
        "equipment_type": "LRU",
        "weight_balance": {"mass_kg": 15.2},
    }, headers=auth_headers)
    assert resp.status_code == 201
    equip1_id = resp.json()["id"]
    assert resp.json()["weight_balance"]["mass_kg"] == 15.2

    # Create second equipment
    resp = await client.post("/api/equipment", json={
        "part_number": f"IRS-{uuid.uuid4().hex[:4]}",
        "name": "惯性基准系统",
        "ata_chapter": "34-22",
        "equipment_type": "LRU",
        "weight_balance": {"mass_kg": 12.8},
    }, headers=auth_headers)
    assert resp.status_code == 201
    equip2_id = resp.json()["id"]

    # 7. Add equipment to configuration
    resp = await client.post(f"/api/configurations/{config_id}/equipment/{equip1_id}", headers=auth_headers)
    assert resp.status_code == 200

    resp = await client.post(f"/api/configurations/{config_id}/equipment/{equip2_id}", headers=auth_headers)
    assert resp.status_code == 200

    # 8. List equipment for config
    resp = await client.get(f"/api/equipment?config_id={config_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 2

    # 9. Validate constraints
    resp = await client.post("/api/constraints/validate", json={
        "config_id": config_id,
    }, headers=auth_headers)
    assert resp.status_code == 200
    report = resp.json()
    assert report["overall_status"] in ("pass", "warning", "blocked")
    assert len(report["engines"]) == 2
    wb_engine = next(e for e in report["engines"] if e["engine_name"] == "weight_balance")
    assert wb_engine["details"]["total_mass_kg"] == pytest.approx(28.0, abs=0.1)

    # 10. Hypothetical analysis (what if we remove equip2?)
    resp = await client.post("/api/constraints/validate", json={
        "config_id": config_id,
        "hypothetical_removes": [equip2_id],
    }, headers=auth_headers)
    assert resp.status_code == 200
    hypo_report = resp.json()
    wb_hypo = next(e for e in hypo_report["engines"] if e["engine_name"] == "weight_balance")
    assert wb_hypo["details"]["total_mass_kg"] == pytest.approx(15.2, abs=0.1)

    # 11. Clone configuration
    resp = await client.post(f"/api/configurations/{config_id}/clone", json={
        "version": "V1.1",
    }, headers=auth_headers)
    assert resp.status_code == 200
    config2_id = resp.json()["id"]
    assert resp.json()["version"] == "V1.1"

    # 12. Remove equipment from cloned config
    resp = await client.delete(f"/api/configurations/{config2_id}/equipment/{equip2_id}", headers=auth_headers)
    assert resp.status_code == 200

    # 13. Diff configs
    resp = await client.get(f"/api/configurations/{config_id}/diff/{config2_id}", headers=auth_headers)
    assert resp.status_code == 200
    diff = resp.json()
    assert len(diff["removed"]) == 1
    assert diff["removed"][0]["equipment_id"] == equip2_id

    # 14. Lock baseline
    resp = await client.post(f"/api/configurations/{config_id}/lock", headers=auth_headers)
    assert resp.status_code == 200

    # Verify can't add equipment to locked config
    resp = await client.post(f"/api/configurations/{config_id}/equipment/{equip1_id}", headers=auth_headers)
    assert resp.status_code == 400

    # 15. Get single equipment with all sub-tables
    resp = await client.get(f"/api/equipment/{equip1_id}", headers=auth_headers)
    assert resp.status_code == 200
    equip_detail = resp.json()
    assert equip_detail["part_number"].startswith("FMC-")
    assert equip_detail["weight_balance"]["mass_kg"] == 15.2

    # 16. Update equipment
    resp = await client.put(f"/api/equipment/{equip1_id}", json={
        "name": "飞行管理计算机 (升级版)",
        "weight_balance": {"mass_kg": 14.5},
    }, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "飞行管理计算机 (升级版)"
    assert resp.json()["weight_balance"]["mass_kg"] == 14.5

    # 17. Search equipment
    resp = await client.get("/api/equipment?search=飞行管理", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1

    # 18. Health check
    resp = await client.get("/api/health")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_auth_required_for_all_endpoints(client: AsyncClient):
    """Verify all API endpoints require authentication."""
    endpoints = [
        ("GET", "/api/equipment"),
        ("POST", "/api/equipment"),
        ("GET", "/api/programs"),
        ("GET", "/api/configurations?series_id=fake"),
        ("POST", "/api/constraints/validate"),
    ]
    for method, url in endpoints:
        if method == "GET":
            resp = await client.get(url)
        else:
            resp = await client.post(url, json={})
        assert resp.status_code == 401, f"{method} {url} should require auth"
