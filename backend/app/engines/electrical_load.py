from app.engines.base import ConstraintEngine, ConstraintResult, ConstraintStatus

WARNING_THRESHOLD = 0.85


class ElectricalLoadEngine(ConstraintEngine):
    def __init__(self, bus_definitions: list[dict]):
        self.bus_defs = {b["id"]: b for b in bus_definitions}

    def evaluate(self, equipment_data: list[dict], phase: str = "normal") -> ConstraintResult:
        bus_loads: dict[str, float] = {bid: 0.0 for bid in self.bus_defs}

        for e in equipment_data:
            eload = e.get("electrical_load")
            if not eload:
                continue
            bid = eload["bus_id"]
            if bid not in bus_loads:
                continue
            power_key = f"power_kva_{phase}"
            power = eload.get(power_key) or eload.get("power_kva_normal", 0) or 0
            bus_loads[bid] += power

        status = ConstraintStatus.PASS
        problems = []
        bus_details = {}

        for bid, load in bus_loads.items():
            bdef = self.bus_defs[bid]
            capacity = bdef["rated_capacity_kva"]
            ratio = load / capacity if capacity > 0 else 0
            margin = capacity - load

            bus_details[bid] = {
                "bus_name": bdef["bus_name"],
                "load_kva": load,
                "capacity_kva": capacity,
                "margin_kva": margin,
                "load_ratio_pct": ratio * 100,
            }

            if load > capacity:
                problems.append(f"{bdef['bus_name']} 过载: {load:.1f}/{capacity:.1f} kVA")
                status = ConstraintStatus.BLOCKED
            elif ratio > WARNING_THRESHOLD and status != ConstraintStatus.BLOCKED:
                problems.append(f"{bdef['bus_name']} 接近满载: {ratio:.0%}")
                if status != ConstraintStatus.BLOCKED:
                    status = ConstraintStatus.WARNING

        return ConstraintResult(
            engine_name="electrical_load",
            status=status,
            summary="; ".join(problems) if problems else "所有母线负荷正常",
            details={"phase": phase, "buses": bus_details},
        )
