# Backend — Mini ERP SaaS (FastAPI)

Documentación técnica del backend ubicado en `backend/`. Stack: **FastAPI 0.133**, **SQLAlchemy 2.0**, **SQL Server** (`mssql+pyodbc`), **JWT (python-jose)**, **bcrypt**.

---

## Arquitectura backend

### Visión general

El backend sigue una **arquitectura en capas** orientada a un ERP comercial (ventas, inventario, caja, compras, usuarios):

```
┌─────────────────────────────────────────────────────────────┐
│  main.py          → FastAPI app, CORS, exception handlers   │
├─────────────────────────────────────────────────────────────┤
│  routers/         → HTTP: validación entrada, auth Depends  │
├─────────────────────────────────────────────────────────────┤
│  services/        → Reglas de negocio (ventas, kardex, API) │
├─────────────────────────────────────────────────────────────┤
│  crud/            → Persistencia SQLAlchemy (transacciones) │
├─────────────────────────────────────────────────────────────┤
│  models/          → ORM (un archivo monolítico model.py)    │
│  schemas/         → Contratos Pydantic request/response     │
├─────────────────────────────────────────────────────────────┤
│  auth/            → JWT, bcrypt, dependencias de seguridad  │
│  database/        → Engine, SessionLocal, get_db            │
│  core/            → Settings (.env), excepciones dominio    │
│  middleware/      → CORS para frontend Vite                 │
└─────────────────────────────────────────────────────────────┘
```

### Módulos funcionales (por router)

| Módulo | Router | Responsabilidad |
|--------|--------|-----------------|
| Autenticación / usuarios | `auth_router.py` | Login JWT, CRUD usuarios, registro |
| Productos / categorías | `products_router.py` | Catálogo e inventario maestro |
| Ventas / clientes | `sales_router.py` | Órdenes, clientes, DNI ApiPeru, reporte |
| Cierre de caja | `cash_router.py` | Resumen pendiente, cierre, historial |
| Compras | `purchases_router.py` | Ingreso mercadería + kardex ENTRADA |

**Agregador:** `routers/router.py` incluye los cinco routers **sin prefijo** `/api/v1` (rutas en raíz).

### Flujo backend (request → response)

```
Cliente HTTP
    │
    ▼
[CORS Middleware]  ← middleware/cors_config.py
    │
    ▼
[Router + Depends]
    ├─ get_db()           → sesión SQLAlchemy por request
    ├─ get_current_user() → JWT Bearer (si ruta protegida)
    └─ require_role() / get_current_admin_user()
    │
    ▼
[Schema Pydantic]  → validación body/query automática FastAPI
    │
    ▼
[Service] (opcional)  → SalesService, PurchaseService, KardexService
    │
    ▼
[CRUD]  → queries, commit/rollback
    │
    ▼
[Model ORM]  → tablas SQL Server (ventasdb)
    │
    ▼
JSON response (response_model) o DomainError → handler en main.py
```

### Punto de entrada

**Archivo:** `main.py`

- Crea `FastAPI(title="API de Gestión de Pedidos")`.
- Registra `domain_exception_handler` para `DomainError` y subclases.
- Monta `APIRouter` y `setup_cors(app)`.
- Ruta pública: `GET /`.

---

## Estructura de carpetas

```
backend/
├── main.py                 # App FastAPI
├── create_table.py         # DDL: Base.metadata.create_all()
├── requirements.txt
├── .env                    # DATABASE_URL, APIPERU_TOKEN
│
├── auth/
│   ├── security.py         # JWT, get_current_user, roles
│   └── password.py         # bcrypt (evita import circular con user_crud)
│
├── core/
│   ├── config.py           # pydantic-settings
│   └── exceptions.py       # Errores de dominio
│
├── database/
│   └── database.py         # engine, SessionLocal, get_db
│
├── middleware/
│   └── cors_config.py
│
├── models/
│   └── model.py            # Todos los modelos (18 tablas)
│
├── schemas/                # Un archivo por dominio
├── crud/                   # Acceso a datos
├── services/               # Lógica de negocio
├── routers/                # Endpoints HTTP
│
├── validators/             # (order_validator — uso limitado)
├── repositories/           # (sales_repository — stub/legacy)
└── docs/                   # Esta documentación
```

### Responsabilidades por capa

| Carpeta | Qué hace en TU proyecto | Ejemplo real |
|---------|-------------------------|--------------|
| **routers** | Define rutas, inyecta `db` y usuario, delega | `POST /create_order/` → `SalesService.create_order` |
| **schemas** | Forma del JSON entrada/salida | `OrderCreate`, `UserResponse` |
| **services** | Validaciones de negocio antes del CRUD | Caja abierta, stock con `with_for_update` |
| **crud** | SQL + transacciones + kardex | `order_crud.create_order_db_record` |
| **models** | Tablas y relaciones ORM | `Order`, `Product`, `InventoryTransaction` |
| **auth** | Quién puede llamar cada endpoint | `require_role("admin")` |
| **database** | Conexión única compartida | `get_db()` yield session |

---

## Flujo FastAPI en detalle

### 1. Request

- El cliente envía `Authorization: Bearer <JWT>` en rutas protegidas.
- `OAuth2PasswordBearer(tokenUrl="token")` en `auth/security.py` extrae el token.

### 2. Validation

- FastAPI valida el body contra schemas Pydantic (`OrderCreate`, `ProductData`, etc.).
- Errores de validación → **422** automático de FastAPI.
- Reglas custom en router (ej. DNI 8 dígitos en `sales_router`).

### 3. Business logic

- **Ventas:** `SalesService` exige `CashSession` con `status == "OPEN"` (`get_open_session_for_update`).
- **Stock:** `KardexService.register_movement` en `services/inventory_service.py` (clase `KardexService`).
- **Compras:** `PurchaseService` → `purchase_crud` + kardex `ENTRADA`.

### 4. Response

- `response_model` serializa ORM → JSON.
- Excepciones `DomainError` → `main.py` mapea a 400/403/404/409.

---

## Patrones utilizados

### Separación de responsabilidades (parcial)

| Patrón | Estado en el proyecto |
|--------|----------------------|
| Router delgado | ✅ En ventas/compras (delegan a service) |
| Service layer | ✅ `SalesService`, `PurchaseService`, `KardexService` |
| Repository | ⚠️ `repositories/sales_repository.py` no integrado |
| CRUD explícito | ✅ Por dominio (`order_crud`, `user_crud`, …) |
| Domain exceptions | ✅ `core/exceptions.py` + handler global |

### Modularidad

- Routers separados por dominio de negocio.
- **Debilidad:** todos los modelos en un solo `model.py` (~314 líneas).

### Código reutilizable

- `get_current_user`, `require_role`, `get_current_admin_user`.
- `KardexService` centraliza movimientos ENTRADA/SALIDA.
- `get_user_role_name()` normaliza rol desde relación `User.role`.

---

## Problemas actuales (detectados en código)

### Acoplamiento

| Problema | Ubicación | Impacto |
|----------|-----------|---------|
| Modelo monolítico | `models/model.py` | Difícil escalar equipos / migraciones |
| Lógica de rol duplicada | `auth_router` compara string `"admin"`; `sales_router` usa `current_user.role.name` | Inconsistencia si cambia nombre de rol |
| `SECRET_KEY` hardcodeada | `auth/security.py` línea 12 | Riesgo crítico en producción |
| Servicios stub sin uso | `order_service.py`, `cash_session_service.py`, `kardex_service.py` | Confusión para nuevos desarrolladores |

### Duplicación

- Token definido en `schemas/user_schema.py` y `schemas/auth_schemas.py`.
- Validación admin: `get_current_admin_user` vs `if get_user_role_name(...) != "admin"`.
- Cierre de caja: `CashSession` (sesión por vendedor) vs `CashClosing` (cierre de pagos) sin router unificado de sesión.

### Escalabilidad

- Sin **multi-tenant** (`organization_id` en tablas).
- Sin **versionado** de API (`/api/v1`).
- Sin **cola** para integraciones (ApiPeru, reportes).
- Paginación básica `skip/limit` sin cursor.
- `get_cash_sessions` en `cash_session_crud.py` tiene query incorrecta (`CashSession.id.desc()`).

### Funcionalidad incompleta expuesta

- `cash_session_crud` tiene `open_cash_session` / `close_cash_session` pero **no hay router HTTP** → el frontend no puede abrir caja vía API a menos que se agregue endpoint.

---

## Recomendaciones SaaS / enterprise

### Corto plazo (sin reescribir arquitectura)

1. Mover `SECRET_KEY` y `DATABASE_URL` solo a variables de entorno.
2. Exponer router `cash_sessions` que use `cash_session_crud` existente.
3. Eliminar o implementar stubs en `services/*_service.py` vacíos.
4. Prefijo `/api/v1` en `router.py`.
5. Añadir `python-jose`, `bcrypt` explícitos en `requirements.txt`.

### Medio plazo

1. Dividir `model.py` en `models/product.py`, `models/order.py`, etc.
2. Unificar autorización con un solo mecanismo (`require_role` en todos los routers).
3. Refresh tokens + revocación de sesión.
4. Alembic para migraciones SQL Server.

### Largo plazo (SaaS)

1. Columna `tenant_id` + middleware de tenant.
2. Planes y límites por suscripción.
3. Auditoría (`audit_log`) alimentada por eventos de kardex y ventas.
4. Extraer módulo inventario a servicio si el tráfico lo exige.

---

## Archivos clave — referencia rápida

| Archivo | Rol |
|---------|-----|
| `main.py` | App + excepciones dominio |
| `routers/router.py` | Registro de routers |
| `database/database.py` | Engine SQL Server + `get_db` |
| `core/config.py` | `Settings` desde `.env` |
| `services/inventory_service.py` | **KardexService** (stock atómico) |
| `services/sales_service.py` | Validación venta + caja |
| `crud/order_crud.py` | Transacción orden + kardex SALIDA |

---

## Comandos de desarrollo

```bash
cd backend
python create_table.py          # Crear tablas en ventasdb
uvicorn main:app --reload       # API en http://127.0.0.1:8000
# Swagger: http://127.0.0.1:8000/docs
```

---

*Documentación generada a partir del código en `backend/` — no es plantilla genérica.*
