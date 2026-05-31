from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from decimal import Decimal


# ─── Movimiento individual de Kardex ─────────────────────────────────────────
class InventoryTransactionResponse(BaseModel):
    id: int
    created_at: datetime
    product_id: int
    product_name: str
    category_name: Optional[str] = None
    user_id: int
    username: str
    transaction_type: str          # ENTRADA / SALIDA / AJUSTE
    concept: str
    quantity: int
    unit_cost: Decimal
    balance_stock: int
    balance_value: Decimal
    source_type: Optional[str] = None
    source_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=False)


# ─── Lista paginada de movimientos ───────────────────────────────────────────
class InventoryTransactionListResponse(BaseModel):
    items: List[InventoryTransactionResponse]
    total: int


# ─── Resumen global del inventario ───────────────────────────────────────────
class InventorySummaryResponse(BaseModel):
    total_products: int
    total_transactions: int
    total_valuation: Decimal
    entries_count: int
    exits_count: int
    low_stock_count: int


# ─── Producto con bajo stock ─────────────────────────────────────────────────
class LowStockProductResponse(BaseModel):
    id: int
    name_product: str
    stock: int
    category_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=False)


# ─── Info del producto para encabezado del Kardex por producto ───────────────
class ProductKardexInfoResponse(BaseModel):
    id: int
    name_product: str
    category_name: Optional[str] = None
    stock: int
    price: Decimal

    model_config = ConfigDict(from_attributes=False)


# ─── Kardex completo de un producto ──────────────────────────────────────────
class ProductKardexResponse(BaseModel):
    product: ProductKardexInfoResponse
    items: List[InventoryTransactionResponse]
    total: int
    total_entries: int
    total_exits: int
    total_adjustments: int
