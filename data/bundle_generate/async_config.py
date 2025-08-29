from __future__ import annotations

import asyncio


global SEMAPHORE

SEMAPHORE_VALUE = 4
SEMAPHORE = asyncio.Semaphore(SEMAPHORE_VALUE)
