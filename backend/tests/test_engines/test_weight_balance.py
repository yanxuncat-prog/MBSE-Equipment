import pytest
from app.engines.base import ConstraintStatus
from app.engines.weight_balance import WeightBalanceEngine


def _make_equip(mass_kg: float, arm_sta: float) -> dict:
    return {
        "id": "test",
        "part_number": "TEST",
        "weight_balance": {"mass_kg": mass_kg, "arm_sta": arm_sta, "arm_bl": 0, "arm_wl": 0},
    }


def _engine(**kwargs):
    defaults = dict(mac_leading_edge_sta=500.0, mac_length=200.0, cg_forward_limit_pct=20.0, cg_aft_limit_pct=40.0, mtow_kg=100_000.0)
    defaults.update(kwargs)
    return WeightBalanceEngine(**defaults)


def test_cg_within_envelope():
    engine = _engine()
    result = engine.evaluate([_make_equip(1000, 560)])  # CG = (560-500)/200*100 = 30%
    assert result.status == ConstraintStatus.PASS
    assert result.details["cg_pct_mac"] == pytest.approx(30.0, abs=0.1)


def test_cg_out_of_envelope_aft():
    engine = _engine()
    result = engine.evaluate([_make_equip(1000, 700)])  # CG = 100% MAC
    assert result.status == ConstraintStatus.BLOCKED
    assert "后越限" in result.summary


def test_cg_out_of_envelope_forward():
    engine = _engine()
    result = engine.evaluate([_make_equip(1000, 510)])  # CG = 5% MAC < 20%
    assert result.status == ConstraintStatus.BLOCKED
    assert "前越限" in result.summary


def test_mtow_exceeded():
    engine = _engine(mtow_kg=50.0)
    result = engine.evaluate([_make_equip(100, 550)])
    assert result.status == ConstraintStatus.BLOCKED
    assert result.details["total_mass_kg"] == 100.0


def test_warning_near_mtow():
    engine = _engine(mtow_kg=100.0)
    result = engine.evaluate([_make_equip(88, 560)])  # 88% > 85% threshold
    assert result.status == ConstraintStatus.WARNING


def test_empty_equipment_list():
    engine = _engine()
    result = engine.evaluate([])
    assert result.status == ConstraintStatus.PASS
    assert result.details["total_mass_kg"] == 0.0


def test_multiple_equipment_cg():
    engine = _engine()
    # Two items: 100kg@540 + 200kg@600
    # total = 300kg, moment = 100*540 + 200*600 = 174000, cg_sta = 580, cg% = (580-500)/200*100 = 40%
    result = engine.evaluate([_make_equip(100, 540), _make_equip(200, 600)])
    assert result.details["cg_pct_mac"] == pytest.approx(40.0, abs=0.1)
    assert result.details["total_mass_kg"] == 300.0


def test_equipment_without_wb_data_ignored():
    engine = _engine()
    result = engine.evaluate([{"id": "no-wb", "weight_balance": None}, _make_equip(100, 560)])
    assert result.details["total_mass_kg"] == 100.0
