from app.engines.base import ConstraintEngine, ConstraintResult, ConstraintStatus

WARNING_THRESHOLD = 0.85


class WeightBalanceEngine(ConstraintEngine):
    def __init__(
        self,
        mac_leading_edge_sta: float,
        mac_length: float,
        cg_forward_limit_pct: float,
        cg_aft_limit_pct: float,
        mtow_kg: float,
    ):
        self.mac_le = mac_leading_edge_sta
        self.mac_len = mac_length
        self.cg_fwd = cg_forward_limit_pct
        self.cg_aft = cg_aft_limit_pct
        self.mtow = mtow_kg

    def evaluate(self, equipment_data: list[dict]) -> ConstraintResult:
        items = [e for e in equipment_data if e.get("weight_balance")]
        if not items:
            return ConstraintResult(
                engine_name="weight_balance",
                status=ConstraintStatus.PASS,
                summary="无设备重量数据",
                details={"total_mass_kg": 0.0, "cg_pct_mac": 0.0, "mtow_margin_kg": self.mtow},
            )

        total_mass = sum(e["weight_balance"]["mass_kg"] for e in items)
        total_moment = sum(e["weight_balance"]["mass_kg"] * e["weight_balance"]["arm_sta"] for e in items)
        cg_sta = total_moment / total_mass if total_mass > 0 else 0
        cg_pct = ((cg_sta - self.mac_le) / self.mac_len) * 100 if self.mac_len > 0 else 0

        problems = []
        status = ConstraintStatus.PASS

        mtow_ratio = total_mass / self.mtow if self.mtow > 0 else 0
        if total_mass > self.mtow:
            problems.append(f"超过最大起飞重量: {total_mass:.1f}kg > {self.mtow:.1f}kg")
            status = ConstraintStatus.BLOCKED
        elif mtow_ratio > WARNING_THRESHOLD:
            problems.append(f"接近最大起飞重量: {mtow_ratio:.0%}")
            if status != ConstraintStatus.BLOCKED:
                status = ConstraintStatus.WARNING

        if cg_pct < self.cg_fwd:
            problems.append(f"CG 前越限: {cg_pct:.1f}%MAC < {self.cg_fwd:.1f}%MAC")
            status = ConstraintStatus.BLOCKED
        elif cg_pct > self.cg_aft:
            problems.append(f"CG 后越限: {cg_pct:.1f}%MAC > {self.cg_aft:.1f}%MAC")
            status = ConstraintStatus.BLOCKED

        return ConstraintResult(
            engine_name="weight_balance",
            status=status,
            summary="; ".join(problems) if problems else f"CG {cg_pct:.1f}%MAC, 重量 {total_mass:.1f}kg",
            details={
                "total_mass_kg": total_mass,
                "cg_sta": cg_sta,
                "cg_pct_mac": cg_pct,
                "mtow_margin_kg": self.mtow - total_mass,
                "mtow_ratio_pct": mtow_ratio * 100,
            },
        )
