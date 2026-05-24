# Base de datos — SQLAlchemy + SQL Server

**Motor:** SQL Server (`ventasdb`) vía `mssql+pyodbc`  
**ORM:** SQLAlchemy 2.0 — modelos en `models/model.py`  
**Tipos monetarios:** `Numeric(10, 2)` y `Numeric(12, 2)` (compatibles con SQL Server)  
**Inicialización:** `create_table.py` → `Base.metadata.create_all(bind=engine)`

---

## Conexión

**Archivo:** `database/database.py`

```python
engine = create_engine(settings.database_url, pool_pre_ping=True, fast_executemany=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

**Configuración:** `core/config.py` + `.env` → `DATABASE_URL`

Ejemplo:

```
mssql+pyodbc://sa:password@localhost/ventasdb?driver=ODBC+Driver+17+for+SQL+Server
```

**Sesión por request:** `get_db()` hace `yield` de `SessionLocal()` y cierra en `finally`.

---

## Diagrama entidad-relación (simplificado)

```
                    ┌─────────────┐
                    │   roles     │
                    └──────┬──────┘
                           │ 1:N
                    ┌──────▼──────┐
┌──────────┐        │    users    │◄────────────────┐
│ categories│───1:N──│             │                 │
└────┬─────┘        └───┬───┬─────┘                 │
     │                  │   │                       │
     │ 1:N              │   │ 1:N                   │ 1:N
┌────▼─────┐            │   ├──────────► cash_sessions
│ products │◄───────────┼───┼──────────► purchases
└────┬─────┘            │   │
     │                  │   └──────────► inventory_transactions
     │                  │
     │    ┌─────────────┼─────────────┐
     │    │             │             │
     ▼    ▼             ▼             ▼
order_items      orders ◄── clients   suppliers
     │               │                    │
     │               ├── payments         │ 1:N
     │               ├── order_status     ▼
     │               └── cash_sessions  purchases
     │                                      │
     └──────────────────────────────── purchase_items

payment_methods ──► payments ──► cash_closings

inventory_transaction_types ──► inventory_transactions ──► products
```

---

## Tablas — propósito y relaciones

### Catálogo e inventario

| Tabla | Modelo | Propósito | FK principales |
|-------|--------|-----------|----------------|
| `categories` | `Category` | Clasificación de productos | — |
| `products` | `Product` | SKU, precio, stock actual, flags | `category_id` → categories |
| `inventory_transaction_types` | `InventoryTransactionType` | ENTRADA, SALIDA, AJUSTE | — |
| `inventory_transactions` | `InventoryTransaction` | **Kardex** — historial movimientos | product, user, type |

**Campos críticos en `products`:**

- `stock` (int) — cantidad actual (actualizado por kardex).
- `stockProduct` (bool) — disponibilidad rápida para UI.
- `is_active`, `delete_at` — borrado lógico parcial.

### Ventas

| Tabla | Modelo | Propósito | FK principales |
|-------|--------|-----------|----------------|
| `clients` | `Client` | Clientes (DNI Perú 8 dígitos) | — |
| `order_status` | `OrderStatus` | PENDIENTE, COMPLETADA, ANULADA | — |
| `orders` | `Order` | Cabecera venta | user, client, cash_session, status |
| `order_items` | `OrderItem` | Líneas de venta | order (CASCADE), product |
| `payment_methods` | `PaymentMethod` | Efectivo, tarjeta, etc. | — |
| `payments` | `Payment` | Pago por orden | order, payment_method, cash_closing |

### Caja

| Tabla | Modelo | Propósito | Notas |
|-------|--------|-----------|-------|
| `cash_sessions` | `CashSession` | Apertura/cierre por **vendedor** | `status`: OPEN / CLOSED |
| `cash_closings` | `CashClosing` | Cierre contable de **pagos pendientes** | Agrupa payments sin `cash_closing_id` |

**Importante:** Son dos conceptos distintos en tu modelo:

1. **CashSession** — obligatoria para vender (`SalesService` valida sesión OPEN).
2. **CashClosing** — usada en `POST /close` (`closing_crud.excecute_cash_closing`).

### Compras / proveedores

| Tabla | Modelo | Propósito |
|-------|--------|-----------|
| `suppliers` | `Supplier` | Proveedores (RUC, razón social) |
| `purchase_status` | `PurchaseStatus` | Estado de compra |
| `purchases` | `Purchase` | Cabecera compra |
| `purchase_items` | `PurchaseItem` | Detalle por producto |

### Seguridad

| Tabla | Modelo | Propósito |
|-------|--------|-----------|
| `roles` | `Roles` | admin, vendedor |
| `users` | `User` | Credenciales, `id_role`, soft delete |

---

## Relaciones ORM

### One-to-many (principales)

| Padre | Hijo | back_populates |
|-------|------|----------------|
| Category | Product | `products_cate` / `category` |
| Order | OrderItem | `order_items_order` / `order` |
| Order | Payment | `payment_order` / `order` |
| User | Order | `orders` / `user` |
| User | CashSession | `cash_sessions` / `user` |
| Purchase | PurchaseItem | `purchase_items` / `purchase` |
| Product | InventoryTransaction | `inventory_transactions` / `product` |

### Integridad referencial

| FK | ondelete en código | Efecto |
|----|-------------------|--------|
| `order_items.order_id` | `CASCADE` | Borrar orden elimina ítems |
| `payments.cash_closing_id` | `SET NULL` | Mantiene pago si se borra cierre |
| `purchase_items.purchase_id` | `CASCADE` | Borrar compra elimina ítems |

**Sin CASCADE en `products`:** no se puede borrar categoría con productos (RESTRICT implícito en SQL Server si no hay ON DELETE).

---

## Flujo ERP en datos

### Inventario → Venta → Stock

```
1. products.stock = N
2. POST /create_order/
3. SalesService valida CashSession OPEN
4. order_crud.create_order_db_record:
   - Por cada ítem: KardexService.register_movement(SALIDA)
   - Actualiza products.stock con with_for_update()
   - Inserta order_items, payments
   - orders.cash_session_id = sesión activa
5. inventory_transactions registra balance_stock, balance_value
```

### Compra → Ingreso stock

```
1. POST /purchases/ (admin)
2. purchase_crud + KardexService.register_movement(ENTRADA)
3. purchase_items + actualización stock
4. source_type='purchases', source_id=purchase.id
```

### Cierre de caja (pagos)

```
1. GET /summary → pagos con cash_closing_id IS NULL agrupados por método
2. POST /close → crea cash_closings, asigna cash_closing_id a payments pendientes
```

---

## Kardex (implementación actual)

**Servicio:** `services/inventory_service.py` → clase `KardexService`

### Registro de movimiento

| Campo | Uso |
|-------|-----|
| `transaction_type_id` | ENTRADA / SALIDA (tabla `inventory_transaction_types`) |
| `concept` | Texto: "Venta", "Compra Proveedor", "Anulación venta" |
| `quantity` | Siempre positivo |
| `movement` | Duplicado cantidad (legacy) |
| `unit_cost` | Costo para valorización |
| `balance_stock` | Stock después del movimiento |
| `balance_value` | `stock * unit_cost` |
| `source_type` | `orders`, `purchases`, `manual` |
| `source_id` | ID documento origen |

### Concurrencia

```python
product = db.query(Product).filter(...).with_for_update().first()
```

Evita sobreventa en requests simultáneos (SQL Server row lock).

### Puntos de integración

| Operación | Tipo kardex | Archivo |
|-----------|-------------|---------|
| Crear orden | SALIDA | `crud/order_crud.py` |
| Editar orden | ENTRADA + SALIDA | `crud/order_crud.py` |
| Eliminar orden | ENTRADA | `crud/order_crud.py` |
| Crear compra | ENTRADA | `crud/purchase_crud.py` |

### Arquitectura kardex profesional (propuesta)

```
┌─────────────────────────────────────────┐
│           inventory_transactions         │  ← append-only ledger
├─────────────────────────────────────────┤
│  products.stock  ← derivado / caché     │  ← lectura rápida POS
└─────────────────────────────────────────┘
```

**Mejoras enterprise:**

1. Vista materializada `v_stock_actual` por producto.
2. Trigger o job que reconcilie `products.stock` vs último `balance_stock`.
3. Endpoint `GET /kardex/{product_id}` (implementar stubs en `kardex_service.py`).
4. Costo promedio ponderado (CPP) en lugar de `product.price` como `unit_cost` en ventas.

---

## Escalabilidad DB

### Normalización

| Nivel | Estado |
|-------|--------|
| 3NF en catálogo/ventas | ✅ Mayormente normalizado |
| Redundancia | `stock` + kardex (aceptable como denormalización controlada) |
| Catálogos | `order_status`, `payment_methods` separados ✅ |

### Índices existentes en modelos

- `primary_key` + `index=True` en IDs, usernames, DNI, emails, nombres únicos.
- **Faltan índices compuestos sugeridos:**

```sql
-- Propuesta
CREATE INDEX ix_orders_user_date ON orders(user_id, order_date);
CREATE INDEX ix_inventory_tx_product_date ON inventory_transactions(product_id, created_at);
CREATE INDEX ix_orders_cash_session ON orders(cash_session_id);
```

### Performance — observaciones

| Tema | Código actual | Recomendación |
|------|---------------|---------------|
| N+1 en listados | `get_product` itera categorías en Python | `joinedload(Product.category)` |
| Reportes | `get_sales_report` carga todas las órdenes | Agregaciones SQL `SUM/COUNT` |
| Paginación | `offset/limit` | Cursor-based en tablas grandes |
| Pool | `pool_pre_ping` ✅ | Ajustar `pool_size` en producción |

---

## Soft delete y auditoría

### Ya presente (parcial)

| Tabla | Campo | Uso |
|-------|-------|-----|
| products | `is_active`, `delete_at` | Deshabilitar producto |
| orders | `is_active`, `delete_at` | Anulación lógica (modelo listo) |
| users | `is_active`, `delete_at` | `deactivate_user` |
| clients | `is_active`, `delete_at` | Cliente inactivo |

### Faltante para enterprise

| Campo / tabla | Propósito |
|---------------|-----------|
| `created_at`, `updated_at` en todas las tablas | Trazabilidad |
| `created_by`, `updated_by` | Auditoría usuario |
| `audit_log` | Eventos inmutables (login, venta, cierre caja) |
| `row_version` (SQL Server) | Optimistic locking |

---

## Creación de esquema

```bash
python create_table.py
```

**Limitaciones:**

- No ejecuta migraciones incrementales (no hay Alembic).
- No crea la base `ventasdb` (solo tablas dentro de BD existente).
- No inserta datos semilla (roles, admin).

---

## Mapeo tipos SQLAlchemy → SQL Server

| Python (model.py) | SQL Server |
|-------------------|------------|
| `Integer, autoincrement=True` | `INT IDENTITY` |
| `Numeric(10, 2)` | `NUMERIC(10, 2)` |
| `Boolean` | `BIT` |
| `DateTime` | `DATETIME2` |
| `String(n)` | `NVARCHAR(n)` |

---

*Derivado de `models/model.py`, `database/database.py`, `crud/order_crud.py`, `services/inventory_service.py`.*
