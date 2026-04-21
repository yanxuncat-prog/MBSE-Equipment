import pytest
from app.engines.base import ConstraintStatus
from app.engines.electrical_load import ElectricalLoadEngine


BUS_DEFS = [
    {"id": "bus1", "bus_name": "AC BUS 1", "bus_type": "AC", "rated_capacity_kva": 20.0},
    {"id": "bus2", "bus_name": "DC ESS", "bus_type": "DC", "rated_capacity_kva": 5.0},
]


def _equip(bus_id: str, normal: float, emergency: float | None = None) -> dict:
    return {
        "id": "test",
        "electrical_load": {
            "bus_id": bus_id, "bus_name": "", "power_kva_normal": normal,
            "power_kva_emergency": emergency, "power_kva_max": None,
        },
    }


def test_all_buses_within_capacity():
    engine = ElectricalLoadEngine(bus_definitions=BUS_DEFS)
    result = engine.evaluate([_equip("bus1", 10.0), _equip("bus2", 2.0)])
    assert result.status == ConstraintStatus.PASS
    assert result.details["buses"]["bus1"]["load_ratio_pct"] == pytest.approx(50.0)
    assert result.details["buses"]["bus2"]["load_ratio_pct"] == pytest.approx(40.0)


def test_bus_overloaded():
    engine = ElectricalLoadEngine(bus_definitions=BUS_DEFS)
    result = engine.evaluate([_equip("bus2", 3.0), _equip("bus2", 3.0)])  # 6 > 5
    assert result.status == ConstraintStatus.BLOCKED
    assert "过载" in result.summary


def test_bus_warning_threshold():
    engine = ElectricalLoadEngine(bus_definitions=BUS_DEFS)
    result = engine.evaluate([_equip("bus1", 18.0)])  # 90% > 85%
    assert result.status == ConstraintStatus.WARNING


def test_empty_equipment():
    engine = ElectricalLoadEngine(bus_definitions=BUS_DEFS)
    result = engine.evaluate([])
    assert result.status == ConstraintStatus.PASS
    for bus in result.details["buses"].values():
        assert bus["load_kva"] == 0.0


def test_equipment_without_eload_ignored():
    engine = ElectricalLoadEngine(bus_definitions=BUS_DEFS)
    result = engine.evaluate([{"id": "no-eload", "electrical_load": None}, _equip("bus1", 5.0)])
    assert result.details["buses"]["bus1"]["load_kva"] == 5.0


def test_emergency_phase():
    engine = ElectricalLoadEngine(bus_definitions=BUS_DEFS)
    equip = _equip("bus1", 10.0, emergency=15.0)
    result = engine.evaluate([equip], phase="emergency")
    assert result.details["buses"]["bus1"]["load_kva"] == 15.0


def test_multiple_equipment_same_bus():
    engine = ElectricalLoadEngine(bus_definitions=BUS_DEFS)
    result = engine.evaluate([_equip("bus1", 5.0), _equip("bus1", 7.0), _equip("bus1", 3.0)])
    assert result.details["buses"]["bus1"]["load_kva"] == pytest.approx(15.0)
    assert result.details["buses"]["bus1"]["margin_kva"] == pytest.approx(5.0)
