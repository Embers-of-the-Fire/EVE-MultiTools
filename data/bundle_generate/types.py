from __future__ import annotations

import typing

from pydantic import BeforeValidator


def _cvt_int_to_bool(v: int | bool) -> bool:
    """Convert integer to boolean."""
    if isinstance(v, bool):
        return v
    if v in (0, 1):
        return bool(v)
    raise ValueError(f"Invalid value for boolean conversion: {v}")


type BoolInt = typing.Annotated[bool, BeforeValidator(_cvt_int_to_bool)]
