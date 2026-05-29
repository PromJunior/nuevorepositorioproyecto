from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from datetime import date

from database.database import get_db
from auth.security import get_current_user
from models.model import User, Product
from schemas.inventory_schema import (
    InventoryTransactionListResponse,
    InventorySummaryResponse,
    LowStockProductResponse,
    ProductKardexResponse,
    ProductKardexInfoResponse,
)
from crud.inventory_crud import (
    get_transactions,
    get_transactions_by_product,
    get_product_kardex_counts,
    get_inventory_summary,
    get_low_stock_products,
)

router = APIRouter(
    prefix="/inventory",
    tags=["Inventory / Kardex"],
)


# ─── Kardex General ─────────────────────────────────────────────────────────
@router.get("/transactions", response_model=InventoryTransactionListResponse)
def list_transactions(
    product_id: Optional[int] = Query(None, description="Filtrar por producto"),
    transaction_type: Optional[str] = Query(None, description="ENTRADA | SALIDA | AJUSTE"),
    user_id: Optional[int] = Query(None, description="Filtrar por usuario"),
    source_type: Optional[str] = Query(None, description="orders | purchases | manual"),
    date_from: Optional[date] = Query(None, description="Fecha desde (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="Fecha hasta (YYYY-MM-DD)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    total, items = get_transactions(
        db=db,
        product_id=product_id,
        transaction_type=transaction_type,
        user_id=user_id,
        source_type=source_type,
        date_from=date_from,
        date_to=date_to,
        skip=skip,
        limit=limit,
    )
    return {"items": items, "total": total}


# ─── Kardex por Producto ─────────────────────────────────────────────────────
@router.get("/kardex/{product_id}", response_model=ProductKardexResponse)
def get_product_kardex(
    product_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    product = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.id == product_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    total, items = get_transactions_by_product(
        db=db, product_id=product_id, skip=skip, limit=limit
    )
    counts = get_product_kardex_counts(db=db, product_id=product_id)

    product_info = ProductKardexInfoResponse(
        id=product.id,
        name_product=product.name_product,
        category_name=(
            product.category.name_category if product.category else None
        ),
        stock=product.stock,
        price=product.price,
    )

    return ProductKardexResponse(
        product=product_info,
        items=items,
        total=total,
        **counts,
    )


# ─── Resumen Global ──────────────────────────────────────────────────────────
@router.get("/summary", response_model=InventorySummaryResponse)
def inventory_summary(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return get_inventory_summary(db=db)


# ─── Productos bajo stock ────────────────────────────────────────────────────
@router.get("/low-stock", response_model=List[LowStockProductResponse])
def low_stock(
    threshold: int = Query(5, ge=0, le=100, description="Umbral de stock bajo"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return get_low_stock_products(db=db, threshold=threshold)
