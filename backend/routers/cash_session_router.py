from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from database.database import get_db
from auth.security import get_current_user, require_role
from models.model import User
from schemas.cash_session_schema import (
    CashSessionOpen,
    CashSessionClose,
    CashSessionResponse,
    CashSessionWithUserResponse,
    CashSessionSummary,
)
from crud.cash_session_crud import (
    open_cash_session,
    close_cash_session,
    get_open_session_by_user,
    get_cash_sessions,
    get_cash_sesions_by_user,
    get_cash_session_summary,
)

router = APIRouter(
    prefix="/cash-session",
    tags=["Cash Session – Caja Diaria"],
)


# ─── Abrir sesión de caja ────────────────────────────────────────────────────
@router.post("/open", response_model=CashSessionResponse)
def open_session(
    data: CashSessionOpen,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return open_cash_session(
            db=db,
            user_id=current_user.id,
            opnening_amount=data.opening_amount,
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


# ─── Obtener sesión activa del usuario actual ────────────────────────────────
@router.get("/active", response_model=Optional[CashSessionResponse])
def get_active_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = get_open_session_by_user(db=db, user_id=current_user.id)
    return session


# ─── Resumen de la sesión activa ─────────────────────────────────────────────
@router.get("/active/summary", response_model=CashSessionSummary)
def get_active_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = get_open_session_by_user(db=db, user_id=current_user.id)
    if not session:
        raise HTTPException(status_code=404, detail="No hay sesión de caja abierta.")
    try:
        return get_cash_session_summary(db=db, session_id=session.id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


# ─── Cerrar sesión de caja ───────────────────────────────────────────────────
@router.post("/close", response_model=CashSessionResponse)
def close_session(
    data: CashSessionClose,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return close_cash_session(
            db=db,
            user_id=current_user.id,
            closing_amount=data.closing_amount,
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


# ─── Historial de sesiones ───────────────────────────────────────────────────
# Admin: todas las sesiones   |   Vendedor: solo las propias
@router.get("/history", response_model=List[CashSessionWithUserResponse])
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role_name = current_user.role.name if current_user.role else ""

    if role_name == "admin":
        sessions = get_cash_sessions(db=db)
    else:
        sessions = get_cash_sesions_by_user(db=db, user_id=current_user.id)

    result = []
    for s in sessions:
        item = CashSessionWithUserResponse.model_validate(s)
        if s.user:
            item.username = s.user.username
            item.fullname = s.user.fullname
        result.append(item)
    return result
