from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum
from typing import Any


class ConstraintStatus(str, Enum):
    PASS = "pass"
    WARNING = "warning"
    BLOCKED = "blocked"


@dataclass
class ConstraintResult:
    engine_name: str
    status: ConstraintStatus
    summary: str
    details: dict[str, Any]


class ConstraintEngine(ABC):
    @abstractmethod
    def evaluate(self, equipment_data: list[dict]) -> ConstraintResult:
        ...
