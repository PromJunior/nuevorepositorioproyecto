from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db
from auth.security import get_current_user, get_user_role_name
from models.model import User
from schemas.dashboard_schema import (
    DashboardSummary,
    TopProduct,
    TopClient,
    ClientSegmentationPoint,
    RecentSale,
    RecentPurchase,
    SalesChartPoint,
    PaymentMethodStat,
)
from crud import dashboard_crud
from crud.settings_crud import get_dashboard_settings, get_inventory_settings
from crud.inventory_crud import get_low_stock_products
from schemas.inventory_schema import LowStockProductResponse

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard / Reportes ejecutivos"],
)


# ─── KPIs principales ─────────────────────────────────────────────────────────
@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(
    payment_method_id: int | None = None,
    user_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna todos los KPIs principales del dashboard en una sola llamada."""
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    return dashboard_crud.get_dashboard_summary(db=db, payment_method_id=payment_method_id, user_id=effective_user_id)


# ─── Top productos más vendidos ───────────────────────────────────────────────
@router.get("/top-products", response_model=List[TopProduct])
def top_products(
    limit: int | None = Query(None, ge=1, le=50),
    payment_method_id: int | None = None,
    user_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    limit = limit or int(get_dashboard_settings(db).get("records_limit", 10) or 10)
    return dashboard_crud.get_top_products(db=db, limit=limit, payment_method_id=payment_method_id, user_id=effective_user_id)


# ─── Top clientes por gasto ───────────────────────────────────────────────────
@router.get("/top-clients", response_model=List[TopClient])
def top_clients(
    limit: int | None = Query(None, ge=1, le=20),
    payment_method_id: int | None = None,
    user_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    limit = limit or int(get_dashboard_settings(db).get("records_limit", 10) or 10)
    return dashboard_crud.get_top_clients(db=db, limit=limit, payment_method_id=payment_method_id, user_id=effective_user_id)


@router.get("/client-segmentation", response_model=List[ClientSegmentationPoint])
def client_segmentation(
    payment_method_id: int | None = None,
    user_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    return dashboard_crud.get_client_segmentation(db=db, payment_method_id=payment_method_id, user_id=effective_user_id)


# ─── Ventas recientes ─────────────────────────────────────────────────────────
@router.get("/recent-sales", response_model=List[RecentSale])
def recent_sales(
    limit: int | None = Query(None, ge=1, le=50),
    payment_method_id: int | None = None,
    user_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    limit = limit or int(get_dashboard_settings(db).get("records_limit", 10) or 10)
    return dashboard_crud.get_recent_sales(db=db, limit=limit, payment_method_id=payment_method_id, user_id=effective_user_id)


# ─── Compras recientes ────────────────────────────────────────────────────────
@router.get("/recent-purchases", response_model=List[RecentPurchase])
def recent_purchases(
    limit: int | None = Query(None, ge=1, le=50),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    limit = limit or int(get_dashboard_settings(db).get("records_limit", 10) or 10)
    return dashboard_crud.get_recent_purchases(db=db, limit=limit)


# ─── Gráfico ventas por día ───────────────────────────────────────────────────
@router.get("/sales-chart", response_model=List[SalesChartPoint])
def sales_chart(
    days: int = Query(30, ge=7, le=90),
    payment_method_id: int | None = None,
    user_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    return dashboard_crud.get_sales_chart(db=db, days=days, payment_method_id=payment_method_id, user_id=effective_user_id)


# ─── Distribución métodos de pago ─────────────────────────────────────────────
@router.get("/payment-methods", response_model=List[PaymentMethodStat])
def payment_method_stats(
    payment_method_id: int | None = None,
    user_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    return dashboard_crud.get_payment_method_stats(db=db, payment_method_id=payment_method_id, user_id=effective_user_id)


# ─── Productos bajo stock ─────────────────────────────────────────────────────
@router.get("/low-stock", response_model=List[LowStockProductResponse])
def dashboard_low_stock(
    threshold: int | None = Query(None, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    threshold = threshold if threshold is not None else int(get_inventory_settings(db).get("global_min_stock", 5) or 5)
    return get_low_stock_products(db=db, threshold=threshold)
