# API REST — Referencia técnica

**Base URL (desarrollo):** `http://localhost:8000`  
**Documentación interactiva:** `http://localhost:8000/docs` (Swagger)  
**Autenticación:** Bearer JWT (excepto `POST /token` y `GET /`)

> No hay prefijo `/api/v1`. Todas las rutas están en la raíz del servidor.

---

## Resumen por módulo

| Tag Swagger | Router | Endpoints |
|-------------|--------|-----------|
| Authentication | `auth_router` | 6 |
| Products | `products_router` | 5 |
| Sales & Clients | `sales_router` | 11 |
| Cash Session / Cierre de Caja | `cash_router` | 3 |
| Purchases / Compras | `purchases_router` | 2 |

---

## Autenticación (`auth_router`)

### `POST /token` — Login

| | |
|---|---|
| **Auth** | No |
| **Content-Type** | `application/x-www-form-urlencoded` |
| **Body** | `username`, `password` |

**Response 200:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

**Errores:** `401` credenciales incorrectas

---

### `POST /register/` — Crear usuario

| | |
|---|---|
| **Auth** | JWT (solo admin) |
| **Body** | `UserCreate` |

```json
{
  "username": "vendedor1",
  "fullname": "Juan Pérez",
  "password": "secreto123",
  "role": "vendedor"
}
```

**Response:** `UserResponse`  
**Errores:** `400` username duplicado, `403` no admin

---

### `GET /users/me`

**Response:** usuario autenticado (`UserResponse`).

---

### `GET /users/` | `PUT /users/{id}` | `DELETE /users/{id}`

Solo **admin**. `DELETE` = baja lógica (`is_active=False`).

---

## Inventario / productos (`products_router`)

### `POST /create_products/` — Admin

**Body (`ProductData`):**

```json
{
  "name_product": "Cuaderno A4",
  "price": 5.50,
  "stockProduct": true,
  "stock": 100,
  "description": "Rayado",
  "category_id": 1
}
```

### `GET /products/?skip=0&limit=100`

Lista productos (JWT cualquier rol). Incluye `category.name_category` si existe relación cargada.

### `PUT /update_products/{product_id}` — Admin

### `DELETE /delete_product/{product_id}` — Admin

**Response:** `{ "deleted": true }` o `404`.

### `GET /categories/`

Lista categorías.

---

## Ventas y órdenes (`sales_router`)

### `POST /create_order/` — Crear venta

| | |
|---|---|
| **Auth** | JWT (admin o vendedor) |
| **Precondición** | `CashSession` OPEN para el usuario |
| **Body** | `OrderCreate` |

```json
{
  "client_id": 1,
  "payment_method_id": 1,
  "items": [
    { "product_id": 2, "quantity": 3, "price": 10.00 }
  ]
}
```

**Efectos en BD:**

- Inserta `orders` + `order_items` + `payments`
- Kardex `SALIDA` por ítem
- Asigna `cash_session_id`

**Errores dominio (handler `main.py`):**

| Excepción | HTTP |
|-----------|------|
| `NoOpenCashSessionError` | 403 |
| `ClientNotFoundError`, `ProductNotFoundError`, … | 404 |
| `InsufficientStockError`, `OutOfStockError` | 409 |
| Otros `DomainError` | 400 |

---

### `GET /order/?skip=0&limit=100`

| Rol | Comportamiento |
|-----|----------------|
| admin | Todas las órdenes |
| vendedor | Solo `user_id == current_user.id` |
| otro | 403 |

**Response:** `List[OrderResponse]` con `client` y `order_items_order[].product.name_product`.

---

### `PUT /update_order/{order_id}` — Admin

**Body:** `OrderUpdate` (misma forma que `OrderCreate`). Revierte stock vía kardex ENTRADA y aplica nuevas SALIDAs.

### `DELETE /delete_order/{order_id}` — Admin

Elimina orden físicamente y restaura stock (kardex ENTRADA).

### `GET /sales_report/` — Admin

```json
{
  "total_orders": 42,
  "total_revenue": 15000.00,
  "sales": [ /* objetos Order completos */ ]
}
```

---

## Clientes (`sales_router`)

### `GET /clients/`

Paginado `skip`, `limit`.

### `GET /clients/dni/{dni}` — Consulta ApiPeru

| | |
|---|---|
| **Validación** | 8 dígitos numéricos |
| **Externo** | `services/apiperu_service.py` → ApiPeru.dev |
| **Env** | `APIPERU_TOKEN` |

**Response (`DniResponse`):** nombres, apellidos, `nombre_completo`, etc.

**Errores:** `500` token no configurado, `502` error ApiPeru

### `GET /clients/{dni}` — Cliente en BD local

### `POST /clients/` — Crear

**Body (`ClientCreate`):**

```json
{
  "dni": "12345678",
  "full_name": "María López",
  "email": "maria@email.com",
  "address": "Av. Principal 123",
  "phone": "999888777"
}
```

**Validación Pydantic:** DNI regex `^\d{8}$`, `EmailStr`.

---

## Métodos de pago

### `GET /payment_methods/`

Lista activos desde `payment_crud.get_payment_method`.

---

## Caja (`cash_router`)

### `GET /summary` — Admin

Pagos sin cerrar agrupados por método (`DailSummary`: `method`, `total`).

### `POST /close`

**Body (`CashClosingCreate`):**

```json
{
  "expected_amount": 1500.00,
  "actual_amount": 1490.00,
  "differences": -10.00,
  "notes": "Faltante por vuelto"
}
```

Asocia todos los `payments` con `cash_closing_id = NULL` al nuevo cierre.

### `GET /history` — Admin

Lista `CashClosing` ordenados por fecha.

---

## Compras (`purchases_router`) — Admin

### `POST /purchases/` — 201

```json
{
  "supplier_id": 1,
  "invoice_number": "F001-00012345",
  "items": [
    { "product_id": 1, "quantity": 50, "unit_cost": 8.50 }
  ]
}
```

**Efecto:** kardex ENTRADA + `purchase_items`.

### `GET /purchases/`

Lista compras con ítems (`joinedload`).

---

## Flujo API completo (venta)

```
React (sales.jsx)
    │ POST /create_order/ + Bearer
    ▼
sales_router.create_order_db
    ▼
SalesService.create_order
    ├─ get_open_session_for_update()
    ├─ validar client, payment, products (with_for_update)
    └─ order_crud.create_order_db_record
            ├─ INSERT orders (cash_session_id)
            ├─ KardexService SALIDA × N
            └─ INSERT payments
    ▼
OrderResponse JSON
```

---

## Validaciones

### Capa Pydantic (schemas)

| Schema | Validaciones destacadas |
|--------|-------------------------|
| `ClientCreate` | DNI 8 dígitos, email válido |
| `PurchaseItemCreate` | `quantity > 0`, `unit_cost > 0` |
| `UserCreate` | password requerido |
| `ProductData` | tipos y campos obligatorios catálogo |

### Capa negocio (services)

- Caja abierta antes de vender.
- Precio ítem `> 0`.
- Stock vía kardex (no solo lectura previa).

### Capa router (HTTP)

- DNI formato en consulta ApiPeru.
- Duplicados DNI/email en clientes.
- Rol admin en rutas sensibles.

---

## Códigos de estado HTTP

| Código | Cuándo en tu API |
|--------|------------------|
| 200 | OK general |
| 201 | `POST /clients/`, `POST /purchases/` |
| 400 | Duplicados, `ValueError`, DomainError genérico |
| 401 | Token inválido / login fallido |
| 403 | Sin permisos, usuario inactivo, sin caja abierta |
| 404 | Entidad no encontrada (dominio) |
| 409 | Stock insuficiente |
| 422 | Validación Pydantic (automático FastAPI) |
| 500 | Error no controlado (ej. cierre caja) |
| 502 | ApiPeru no disponible |

---

## Buenas prácticas REST — análisis del proyecto

### Naming (inconsistencias actuales)

| Actual | REST idiomático sugerido |
|--------|-------------------------|
| `POST /create_order/` | `POST /orders` |
| `GET /order/` | `GET /orders` |
| `POST /create_products/` | `POST /products` |
| `PUT /update_products/{id}` | `PATCH /products/{id}` |

### Consistencia

- Mezcla trailing slash (`/register/` vs `/token`).
- Algunos endpoints sin `response_model` en update (`PUT /update_products/`).
- Tags Swagger bien definidos ✅.

### Headers recomendados para clientes

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

Login:

```http
Content-Type: application/x-www-form-urlencoded
```

---

## Errores — formato estándar

**DomainError (handler custom):**

```json
{ "detail": "Mensaje legible del error de negocio" }
```

**HTTPException FastAPI:**

```json
{ "detail": "Solo el administrador puede ver la lista de usuarios" }
```

**Validación 422:**

```json
{
  "detail": [
    { "loc": ["body", "dni"], "msg": "...", "type": "..." }
  ]
}
```

---

## Integración frontend

**Archivo:** `frontend/src/api/axios.js`

- `baseURL: 'http://localhost:8000'`
- Interceptor añade `Authorization: Bearer` desde `localStorage.token`

---

*Endpoints verificados en `routers/*.py` y schemas en `schemas/*.py`.*
