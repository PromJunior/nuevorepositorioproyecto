from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth.security import get_current_user, get_current_admin_user, get_user_role_name
from database.database import get_db
from models.model import User, WebhookLog
from services.webhook_service import send_webhook_event

router = APIRouter(prefix="/automations", tags=["Automations"])


class RetryEventRequest(BaseModel):
    log_id: int


def require_automation_viewer(current_user: User = Depends(get_current_user)):
    role_name = (get_user_role_name(current_user) or "").lower()
    if role_name not in {"admin", "supervisor"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver eventos de automatizacion",
        )
    return current_user


def _log_to_dict(log: WebhookLog) -> dict:
    return {
        "id": log.id,
        "timestamp": log.created_at,
        "event": log.event,
        "success": bool(log.success),
        "result": "OK" if log.success else "ERROR",
        "duration_ms": log.duration_ms,
        "status_code": log.status_code,
        "destination_url": log.destination_url,
        "message": log.message,
    }


@router.post("/webhook/test")
def test_webhook_connection(
    _: User = Depends(get_current_admin_user),
):
    result = send_webhook_event(
        "test.connection",
        {"message": "ERP conectado correctamente"},
    )

    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=result.get("message", "No se pudo enviar el webhook"),
        )

    return {
        "success": True,
        "message": "Webhook enviado correctamente",
    }


@router.get("/events")
def list_recent_events(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_automation_viewer),
):
    logs = (
        db.query(WebhookLog)
        .order_by(WebhookLog.created_at.desc(), WebhookLog.id.desc())
        .limit(limit)
        .all()
    )
    return [_log_to_dict(log) for log in logs]


@router.get("/events/logs")
def list_event_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    event: str | None = None,
    success: bool | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_automation_viewer),
):
    query = db.query(WebhookLog)
    if event:
        query = query.filter(WebhookLog.event == event)
    if success is not None:
        query = query.filter(WebhookLog.success == success)

    total = query.count()
    logs = (
        query.order_by(WebhookLog.created_at.desc(), WebhookLog.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return {"total": total, "items": [_log_to_dict(log) for log in logs]}


@router.post("/events/retry")
def retry_event(
    data: RetryEventRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    log = db.query(WebhookLog).filter(WebhookLog.id == data.log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    if not log.payload:
        raise HTTPException(status_code=400, detail="El evento no tiene payload para reintento")

    result = send_webhook_event(log.event, log.payload)
    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=result.get("message", "No se pudo reenviar el evento"),
        )
    return {"success": True, "message": "Evento reenviado correctamente", "result": result}
