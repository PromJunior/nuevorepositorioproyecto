from __future__ import annotations

from datetime import date, datetime, time, timedelta
from time import perf_counter
from typing import Any, Callable

from sqlalchemy.orm import Session

from models.model import BackupExecutionLog
from services.webhook_service import send_webhook_event

BACKUP_SCHEDULE_TIME = time(22, 30)
FINAL_BACKUP_STATUSES = {"SUCCESS", "SKIPPED"}
BACKUP_TRIGGER_TYPES = {"schedule", "startup", "manual"}

ExportRunner = Callable[[Session, date], list[dict[str, Any]]]


def _now() -> datetime:
    return datetime.now()


def _scheduled_at(scheduled_date: date) -> datetime:
    return datetime.combine(scheduled_date, BACKUP_SCHEDULE_TIME)


def _normalize_trigger(trigger_type: str) -> str:
    normalized = (trigger_type or "schedule").strip().lower()
    return normalized if normalized in BACKUP_TRIGGER_TYPES else "manual"


def _get_log_for_date(db: Session, scheduled_date: date) -> BackupExecutionLog | None:
    return (
        db.query(BackupExecutionLog)
        .filter(BackupExecutionLog.scheduled_date == scheduled_date)
        .order_by(BackupExecutionLog.id.desc())
        .first()
    )


def _has_final_log(db: Session, scheduled_date: date) -> bool:
    return (
        db.query(BackupExecutionLog)
        .filter(
            BackupExecutionLog.scheduled_date == scheduled_date,
            BackupExecutionLog.status.in_(FINAL_BACKUP_STATUSES),
        )
        .first()
        is not None
    )


def _log_to_dict(log: BackupExecutionLog | None) -> dict[str, Any] | None:
    if not log:
        return None
    return {
        "id": log.id,
        "scheduled_date": log.scheduled_date,
        "scheduled_time": log.scheduled_time,
        "executed_at": log.executed_at,
        "status": log.status,
        "trigger_type": log.trigger_type,
        "message": log.message,
        "duration_ms": log.duration_ms,
        "rows_exported": log.rows_exported,
        "created_at": log.created_at,
        "updated_at": log.updated_at,
    }


def log_execution(
    db: Session,
    *,
    scheduled_date: date,
    trigger_type: str,
    status: str = "PENDING",
    message: str | None = None,
    executed_at: datetime | None = None,
    duration_ms: int | None = None,
    rows_exported: int = 0,
) -> BackupExecutionLog:
    existing = _get_log_for_date(db, scheduled_date)
    if existing and existing.status not in FINAL_BACKUP_STATUSES:
        log = existing
    else:
        log = BackupExecutionLog(
            scheduled_date=scheduled_date,
            scheduled_time=BACKUP_SCHEDULE_TIME,
            status="PENDING",
            trigger_type=_normalize_trigger(trigger_type),
        )
        db.add(log)
        db.flush()

    log.status = status.upper()
    log.trigger_type = _normalize_trigger(trigger_type)
    log.message = (message or "")[:500]
    log.executed_at = executed_at
    log.duration_ms = duration_ms
    log.rows_exported = rows_exported
    log.updated_at = _now()
    db.commit()
    db.refresh(log)
    return log


def schedule_daily_backup(db: Session, scheduled_date: date | None = None) -> BackupExecutionLog:
    target_date = scheduled_date or _now().date()
    existing = _get_log_for_date(db, target_date)
    if existing:
        return existing
    return log_execution(
        db,
        scheduled_date=target_date,
        trigger_type="schedule",
        status="PENDING",
        message="Backup diario programado",
    )


def run_backup(
    db: Session,
    *,
    export_runner: ExportRunner,
    trigger_type: str = "schedule",
    scheduled_date: date | None = None,
) -> dict[str, Any]:
    target_date = scheduled_date or _now().date()
    trigger = _normalize_trigger(trigger_type)

    existing = _get_log_for_date(db, target_date)
    if existing and existing.status in FINAL_BACKUP_STATUSES:
        return {
            "success": True,
            "executed": False,
            "skipped": True,
            "trigger": trigger,
            "status": "SKIPPED",
            "message": "Backup ya ejecutado para la fecha programada",
            "modules": [],
            "rows_exported": existing.rows_exported,
            "log": _log_to_dict(existing),
        }

    if not existing:
        existing = log_execution(
            db,
            scheduled_date=target_date,
            trigger_type=trigger,
            status="PENDING",
            message="Backup pendiente",
        )

    started_at = perf_counter()
    try:
        modules = export_runner(db, target_date)
        rows_exported = sum(int(item.get("rows") or 0) for item in modules)
        has_errors = any((item.get("status") or "").upper() == "ERROR" for item in modules)
        status = "FAILED" if has_errors else ("SUCCESS" if rows_exported > 0 else "SKIPPED")
        message = (
            "Backup diario ejecutado"
            if status == "SUCCESS"
            else "Backup sin cambios nuevos; no se suben CSV vacios"
            if status == "SKIPPED"
            else "Backup diario fallo"
        )
        duration_ms = int((perf_counter() - started_at) * 1000)
        log = log_execution(
            db,
            scheduled_date=target_date,
            trigger_type=trigger,
            status=status,
            message=message,
            executed_at=_now(),
            duration_ms=duration_ms,
            rows_exported=rows_exported,
        )
        return {
            "success": status != "FAILED",
            "executed": status != "SKIPPED" or rows_exported == 0,
            "skipped": status == "SKIPPED",
            "trigger": trigger,
            "status": status,
            "message": message,
            "modules": modules,
            "rows_exported": rows_exported,
            "log": _log_to_dict(log),
        }
    except Exception as exc:
        duration_ms = int((perf_counter() - started_at) * 1000)
        log = log_execution(
            db,
            scheduled_date=target_date,
            trigger_type=trigger,
            status="FAILED",
            message=str(exc),
            executed_at=_now(),
            duration_ms=duration_ms,
            rows_exported=0,
        )
        return {
            "success": False,
            "executed": True,
            "skipped": False,
            "trigger": trigger,
            "status": "FAILED",
            "message": str(exc),
            "modules": [],
            "rows_exported": 0,
            "log": _log_to_dict(log),
        }


def check_missed_backup(db: Session, reference: datetime | None = None) -> BackupExecutionLog | None:
    current = reference or _now()
    missed_date = current.date() - timedelta(days=1)
    if _has_final_log(db, missed_date):
        return None
    return schedule_daily_backup(db, missed_date)


def backup_status(db: Session) -> dict[str, Any]:
    last_log = (
        db.query(BackupExecutionLog)
        .filter(BackupExecutionLog.status.in_(FINAL_BACKUP_STATUSES | {"FAILED"}))
        .order_by(BackupExecutionLog.executed_at.desc(), BackupExecutionLog.id.desc())
        .first()
    )
    current = _now()
    next_date = current.date() if current.time() < BACKUP_SCHEDULE_TIME else current.date() + timedelta(days=1)
    return {
        "last_backup": last_log.executed_at if last_log else None,
        "status": last_log.status if last_log else "PENDING",
        "next_backup": _scheduled_at(next_date),
        "rows_exported": last_log.rows_exported if last_log else 0,
        "trigger_type": last_log.trigger_type if last_log else None,
        "message": last_log.message if last_log else None,
    }


def notify_missed_backup_if_needed() -> dict[str, Any]:
    from database.database import SessionLocal

    db = SessionLocal()
    try:
        pending = check_missed_backup(db)
        if not pending:
            return {"sent": False, "message": "No hay backup faltante"}

        result = send_webhook_event(
            "backup.missed",
            {
                "scheduled_date": pending.scheduled_date.isoformat(),
                "scheduled_time": pending.scheduled_time.strftime("%H:%M:%S"),
                "trigger": "startup",
                "recovery_endpoint": "/exports/run-missed-backup",
            },
        )
        return {"sent": bool(result.get("success")), "message": result.get("message"), "result": result}
    finally:
        db.close()
