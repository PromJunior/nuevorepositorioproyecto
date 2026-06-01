from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db
from auth.security import get_current_user, get_current_admin_user
from models.model import Product, User
from schemas.purchase_schema import PurchaseCreate, PurchaseResponse, PurchaseDetailResponse
from services.purchase_service import PurchaseService
from services.event_dispatcher import emit_purchase_received, emit_stock_low_if_needed
from crud import purchase_crud

router = APIRouter(tags=["Purchases / Compras"])


# ─── Crear compra (borrador, sin afectar stock) ───────────────────────────────
@router.post("/purchases/", response_model=PurchaseDetailResponse, status_code=201)
def create_purchase(
    purchase: PurchaseCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user),
):
    try:
        return PurchaseService.create_purchase(
            db=db, purchase_create=purchase, user_id=admin_user.id
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


# ─── Listar compras ───────────────────────────────────────────────────────────
@router.get("/purchases/", response_model=List[PurchaseResponse])
def list_purchases(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user),
):
    return purchase_crud.get_purchases(db=db, skip=skip, limit=limit)


# ─── Detalle de compra ────────────────────────────────────────────────────────
@router.get("/purchases/{purchase_id}", response_model=PurchaseDetailResponse)
def get_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    detail = purchase_crud.get_purchase_by_id(db=db, purchase_id=purchase_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Compra no encontrada")
    return detail


# ─── Recibir compra (afecta stock + Kardex) ──────────────────────────────────
@router.post("/purchases/{purchase_id}/receive", response_model=PurchaseDetailResponse)
def receive_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user),
):
    try:
        purchase = purchase_crud.receive_purchase(
            db=db, purchase_id=purchase_id, user_id=admin_user.id
        )
        emit_purchase_received(purchase)
        for item in purchase.purchase_items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                emit_stock_low_if_needed(db, product)
        return purchase_crud.get_purchase_by_id(db=db, purchase_id=purchase_id)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


# ─── Cancelar compra (solo BORRADOR) ─────────────────────────────────────────
@router.post(
    "/purchases/{purchase_id}/cancel",
    response_model=PurchaseDetailResponse,
    status_code=status.HTTP_200_OK,
)
def cancel_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    try:
        purchase_crud.cancel_purchase(db=db, purchase_id=purchase_id)
        return purchase_crud.get_purchase_by_id(db=db, purchase_id=purchase_id)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
