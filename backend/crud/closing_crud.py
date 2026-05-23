from sqlalchemy.orm import Session
from sqlalchemy import func

from models.model import CashClosing, Payment, PaymentMethod
from schemas.closing_schema import CashClosingCreate, CashClosingResponse, DailSummary

def get_peding_payment_sumary(db:Session):
    return db.query(
        PaymentMethod.name_payment_method.label("method"),
        func.sum(Payment.amount).label("total")
    ).join(Payment, Payment.id_payment_method == PaymentMethod.id
    ).filter(Payment.cash_closing_id == None
    ).group_by(PaymentMethod.name_payment_method).all()

def excecute_cash_closing(db: Session, closing_data: CashClosingCreate):
    try:
        # 1. Convertir el schema a diccionario y crear objeto
        new_closing = CashClosing(
            expected_amount=closing_data.expected_amount,
            actual_amount=closing_data.actual_amount,
            differences=closing_data.differences, # <--- CAMBIA 'differences' por 'difference'
            notes=closing_data.notes
        )
        
        db.add(new_closing)
        db.commit() 
        db.refresh(new_closing) 

        # 2. Buscar pagos que aún no tienen cierre
        pending_payments = db.query(Payment).filter(Payment.cash_closing_id == None).all()

        # 3. Sellar cada pago
        for payment in pending_payments:
            payment.cash_closing_id = new_closing.id
        
        db.commit() 
        return new_closing

    except Exception as e:
        db.rollback() 
        print(f"Error detallado: {e}") 
        raise e
    
def get_all_closings(db: Session):
    return db.query(CashClosing).order_by(CashClosing.closing_date.desc()).all()
    
