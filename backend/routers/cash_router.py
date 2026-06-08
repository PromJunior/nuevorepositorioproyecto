from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db
from auth.security import get_current_user, require_role
from models.model import User
from schemas.closing_schema import CashClosingResponse, DailSummary, CashClosingCreate
from crud.closing_crud import get_all_closings, get_peding_payment_sumary, excecute_cash_closing

router = APIRouter(tags=["Cash Session / Cierre de Caja"])

@router.get("/summary", response_model=List[DailSummary])
def read_sumary(db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    return get_peding_payment_sumary(db)


@router.post("/close", response_model=CashClosingResponse)
def create_close(data: CashClosingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        return excecute_cash_closing(db=db, closing_data=data)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al ejecutar el cierre de caja: {str(e)}")
    

@router.get("/history", response_model=List[CashClosingResponse])
def get_history(db: Session = Depends(get_db), admin_user: User = Depends(require_role("admin"))):
    return get_all_closings(db=db)
