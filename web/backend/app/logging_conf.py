"""
logging_conf.py — tuzilmaviy (JSON) loglash sozlamasi.

Maxfiylik: WS token query-paramda kelishi mumkin, shuning uchun uvicorn access
loglari URL query qismini yozmasligi yaxshi — bu yerda formatni soddalashtiramiz.
"""

from __future__ import annotations

import json
import logging
from logging.config import dictConfig


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)


def setup_logging() -> None:
    dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "json": {"()": "app.logging_conf.JsonFormatter"},
            },
            "handlers": {
                "default": {
                    "class": "logging.StreamHandler",
                    "formatter": "json",
                },
            },
            "root": {"handlers": ["default"], "level": "INFO"},
            "loggers": {
                # Access loglari token tushib qolmasligi uchun WARNING'gacha jim.
                "uvicorn.access": {"level": "WARNING"},
            },
        }
    )
