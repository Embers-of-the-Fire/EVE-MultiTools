from __future__ import annotations

from pydantic import BaseModel


class UniversePoint(BaseModel):
    x: float
    y: float
    z: float