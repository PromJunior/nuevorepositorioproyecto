from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db
from auth.security import get_current_admin_user
from models.model import User
from schemas.purchase_schema import PurchaseCreate, PurchaseResponse
from services.purchase_service import PurchaseService

router = APIRouter(tags=["Purchases / Compras"])


@router.post("/purchases/", response_model=PurchaseResponse, status_code=201)
def create_purchase(
    purchase: PurchaseCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user),
):
    return PurchaseService.create_purchase(
        db=db, purchase_create=purchase, user_id=admin_user.id
    )


@router.get("/purchases/", response_model=List[PurchaseResponse])
def list_purchases(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user),
):
    return PurchaseService.list_purchases(db=db, skip=skip, limit=limit)
