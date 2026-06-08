from sqlalchemy.orm import Session

from models.model import PaymentMethod
from schemas.payment_method_schema import PaymentMethodData

def get_payment_method(db:Session):
    return (
        db.query(PaymentMethod)
        .filter(PaymentMethod.is_active == True)  # noqa: E712
        .order_by(PaymentMethod.display_order.asc(), PaymentMethod.id.asc())
        .all()
    )

def create_payment_method(db: Session, payment_method: PaymentMethodData):
    db_pm = PaymentMethod(name_payment_method=payment_method.name_payment_method)
    db.add(db_pm)
    db.commit()
    db.refresh(db_pm)
    return db_pm

def update_payment_method(db: Session, pm_id: int, pm_data: PaymentMethodData):
    db_pm = db.query(PaymentMethod).filter(PaymentMethod.id == pm_id).first()
    if db_pm:
        db_pm.name_payment_method = pm_data.name_payment_method
        db.commit()
        db.refresh(db_pm)
    return db_pm

def delete_payment_method(db: Session, pm_id: int):
    db_pm = db.query(PaymentMethod).filter(PaymentMethod.id == pm_id).first()
    if db_pm:
        db.delete(db_pm)
        db.commit()
        return True
    return False
