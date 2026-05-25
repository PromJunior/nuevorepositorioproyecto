from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from datetime import datetime
from sqlalchemy import func

from models.model import CashSession, Order, Payment, PaymentMethod
from schemas.cash_session_schema import CashSessionOpen, CashSessionClose, CashSessionResponse

# obtener sesion abierta del usuario
def get_open_session_by_user(db: Session, user_id: int):
    return (
        db.query(CashSession)
        .filter(CashSession.user_id == user_id, CashSession.status == "OPEN")
        .first()
    )


def get_open_session_for_update(db: Session, user_id: int):
    """Sesión de caja abierta con bloqueo de fila para operaciones de venta."""
    return (
        db.query(CashSession)
        .filter(CashSession.user_id == user_id, CashSession.status == "OPEN")
        .with_for_update()
        .first()
    )

#abrir sesion de caja

def open_cash_session(db:Session, user_id:int, opnening_amount: float):
    #verificar si ya existe la sesion abierta para el usuario
    existing_session = get_open_session_by_user(db=db,user_id=user_id)
    if existing_session:
        raise ValueError("Ya existe una sesión de caja abierta para este usuario.")
    
    #crear una nueva session

    new_session= CashSession(
        user_id = user_id,
        opening_amount = opnening_amount,
        opening_time = datetime.now(),
        status = "OPEN"
    )

    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

# cerrar sesion de caja

def close_cash_session(db:Session, user_id: int, closing_amount: float):
    #buscar sesion abierta por id
    session = get_open_session_by_user(db=db, user_id = user_id)

    if not session:
        raise ValueError("No hay una sesión de caja abierta para este usuario.")
    
    #calcular total de ventas
    total_sales = (db.query(func.sum(Order.total_amount)).filter(Order.cash_session_id == session.id).scalar() or 0)

    #calcular el monto esperado
    expected_amount = float(session.opening_amount) + float(total_sales)

    #calcular la diferencia
    difference = float(closing_amount) - expected_amount

    #actualizar la sesion de caja
    session.closing_amount = closing_amount
    session.expected_amount = expected_amount
    session.difference = difference
    session.closing_time = datetime.now()
    session.status = "CLOSED"
    db.commit()
    db.refresh(session)
    return session

#obtener el historial de sesiones

def get_cash_sessions(db:Session, skip: int=0, limit:int=0):
    return db.query(CashSession.id.desc()).offset(skip).limit(limit).all()

#options(joinedload(CashSession.user)).order_by(CashSession.opening_time.desc()).offset(skip).limit(limit).all()

#obtene el histirial de decisiones por ususrio

def get_cash_sesions_by_user(db:Session,user_id: int, skip:int=0,
                             limit:int=100):
        return db.query(CashSession).filter(CashSession.user_id==user_id).order_by(CashSession.id.desc()).offset(skip).limit(limit).all()

#obtener sesion por id

def get_cash_session_by_id(db:Session, session_id:int):
     return db.query(CashSession).filter(CashSession.id==session_id).first()

#validar si el usuario tiene caja abierta

def user_has_open_session(db:Session, user_id:int)->bool:
     session= get_open_session_by_user(db=db, user_id=user_id)
     return session is not None

# obtener resumen de la sesion de caja abierta

def get_cash_session_summary(
    db: Session,
    session_id: int
):

    session = get_cash_session_by_id(
        db=db,
        session_id=session_id
    )

    if not session:
        raise ValueError("Sesión no encontrada")

    total_sales = (
        db.query(func.sum(Order.total_amount))
        .filter(Order.cash_session_id == session.id)
        .scalar()
        or 0
    )

    total_orders = (
        db.query(Order)
        .filter(Order.cash_session_id == session.id)
        .count()
    )

    return {
        "session_id": session.id,
        "user_id": session.user_id,
        "status": session.status,
        "opening_amount": session.opening_amount,
        "closing_amount": session.closing_amount,
        "expected_amount": session.expected_amount,
        "difference": session.difference,
        "total_sales": total_sales,
        "total_orders": total_orders,
        "opening_time": session.opening_time,
        "closing_time": session.closing_time
    }