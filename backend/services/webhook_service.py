import logging
from datetime import datetime
from time import perf_counter
from typing import Any

import httpx
from sqlalchemy.orm import Session

from crud.settings_crud import get_automations_settings
from database.database import SessionLocal
from models.model import WebhookLog

logger = logging.getLogger(__name__)

WEBHOOK_TIMEOUT_SECONDS = 5
WEBHOOK_SOURCE = "erp"
WEBHOOK_VERSION = "1.0"


def _build_payload(event_name: str, payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "event": event_name,
        "timestamp": datetime.utcnow().isoformat(timespec="seconds"),
        "source": WEBHOOK_SOURCE,
        "version": WEBHOOK_VERSION,
        "data": payload,
    }


def _write_log(
    db: Session,
    event_name: str,
    destination_url: str | None,
    success: bool,
    message: str,
    status_code: int | None = None,
    duration_ms: int | None = None,
    payload: dict[str, Any] | None = None,
) -> None:
    db.add(
        WebhookLog(
            event=event_name,
            destination_url=destination_url,
            status_code=status_code,
            success=success,
            duration_ms=duration_ms,
            payload=payload,
            message=message[:500],
        )
    )
    db.commit()


def send_webhook_event(event_name: str, payload: dict[str, Any]) -> dict[str, Any]:
    db = SessionLocal()
    webhook_url = None
    started_at = perf_counter()

    try:
        settings = get_automations_settings(db)
        webhook_enabled = bool(settings.get("webhook_enabled", False))
        webhook_url = str(settings.get("webhook_url") or "").strip()
        webhook_secret = str(settings.get("webhook_secret") or "").strip()

        if not webhook_enabled:
            message = "Webhook desactivado"
            duration_ms = int((perf_counter() - started_at) * 1000)
            _write_log(db, event_name, None, False, message, duration_ms=duration_ms, payload=payload)
            return {"success": False, "sent": False, "message": message}

        if not webhook_url:
            message = "URL Webhook no configurada"
            duration_ms = int((perf_counter() - started_at) * 1000)
            _write_log(db, event_name, None, False, message, duration_ms=duration_ms, payload=payload)
            return {"success": False, "sent": False, "message": message}

        headers = {"Content-Type": "application/json"}
        if webhook_secret:
            headers["X-ERP-Webhook-Secret"] = webhook_secret

        response = httpx.post(
            webhook_url,
            json=_build_payload(event_name, payload),
            headers=headers,
            timeout=WEBHOOK_TIMEOUT_SECONDS,
        )
        success = 200 <= response.status_code < 300
        message = "Webhook enviado correctamente" if success else f"Webhook respondio con HTTP {response.status_code}"
        duration_ms = int((perf_counter() - started_at) * 1000)
        _write_log(db, event_name, webhook_url, success, message, response.status_code, duration_ms, payload)
        return {
            "success": success,
            "sent": True,
            "message": message,
            "status_code": response.status_code,
            "duration_ms": duration_ms,
        }
    except Exception as exc:
        message = f"Error enviando webhook: {exc}"
        logger.exception("Webhook event failed: %s", event_name)
        try:
            duration_ms = int((perf_counter() - started_at) * 1000)
            _write_log(db, event_name, webhook_url, False, message, duration_ms=duration_ms, payload=payload)
        except Exception:
            logger.exception("Webhook log write failed")
        return {"success": False, "sent": False, "message": message}
    finally:
        db.close()
