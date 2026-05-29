from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db
from auth.security import get_current_user
from models.model import User
from schemas.dashboard_schema import (
    DashboardSummary,
    TopProduct,
    TopClient,
    RecentSale,
    RecentPurchase,
    SalesChartPoint,
    PaymentMethodStat,
)
from crud import dashboard_crud
from crud.inventory_crud import get_low_stock_products
from schemas.inventory_schema import LowStockProductResponse

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard / Reportes ejecutivos"],
)


# ─── KPIs principales ─────────────────────────────────────────────────────────
@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Retorna todos los KPIs principales del dashboard en una sola llamada."""
    return dashboard_crud.get_dashboard_summary(db=db)


# ─── Top productos más vendidos ───────────────────────────────────────────────
@router.get("/top-products", response_model=List[TopProduct])
def top_products(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return dashboard_crud.get_top_products(db=db, limit=limit)


# ─── Top clientes por gasto ───────────────────────────────────────────────────
@router.get("/top-clients", response_model=List[TopClient])
def top_clients(
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return dashboard_crud.get_top_clients(db=db, limit=limit)


# ─── Ventas recientes ─────────────────────────────────────────────────────────
@router.get("/recent-sales", response_model=List[RecentSale])
def recent_sales(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return dashboard_crud.get_recent_sales(db=db, limit=limit)


# ─── Compras recientes ────────────────────────────────────────────────────────
@router.get("/recent-purchases", response_model=List[RecentPurchase])
def recent_purchases(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return dashboard_crud.get_recent_purchases(db=db, limit=limit)


# ─── Gráfico ventas por día ───────────────────────────────────────────────────
@router.get("/sales-chart", response_model=List[SalesChartPoint])
def sales_chart(
    days: int = Query(30, ge=7, le=90),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return dashboard_crud.get_sales_chart(db=db, days=days)


# ─── Distribución métodos de pago ─────────────────────────────────────────────
@router.get("/payment-methods", response_model=List[PaymentMethodStat])
def payment_method_stats(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return dashboard_crud.get_payment_method_stats(db=db)


# ─── Productos bajo stock ─────────────────────────────────────────────────────
@router.get("/low-stock", response_model=List[LowStockProductResponse])
def dashboard_low_stock(
    threshold: int = Query(5, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return get_low_stock_products(db=db, threshold=threshold)
