from __future__ import annotations

import logging

from data.bundle_generate import paths


LOGGER = None


def init_logger():
    global LOGGER
    if LOGGER is not None:
        return

    LOGGER = logging.getLogger("bundle_generate")
    LOGGER.setLevel(logging.DEBUG)

    file_handler = logging.FileHandler(paths.BUNDLE_LOG_FILE, mode="w", encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)

    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)

    file_formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] [%(pathname)s]: %(message)s")
    file_handler.setFormatter(file_formatter)

    console_formatter = logging.Formatter("[%(levelname)s]: %(message)s")
    console_handler.setFormatter(console_formatter)

    LOGGER.addHandler(file_handler)
    LOGGER.addHandler(console_handler)


init_logger()
