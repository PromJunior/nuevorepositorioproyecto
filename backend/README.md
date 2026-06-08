# Mini ERP SaaS — Backend API

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.133-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?style=flat-square)](https://www.sqlalchemy.org/)
[![SQL Server](https://img.shields.io/badge/SQL%20Server-ventasdb-CC2927?style=flat-square&logo=microsoft-sql-server&logoColor=white)](https://www.microsoft.com/sql-server)
[![License](https://img.shields.io/badge/License-Private-lightgrey?style=flat-square)](.)

API REST modular para un **mini ERP comercial** orientado a SaaS: ventas, inventario con kardex, clientes, caja, compras y gestión de usuarios con **JWT** y **control por roles**.

> Backend únicamente. Documentación detallada en [`docs/`](./docs/).

---

## Descripción

Este backend expone una **API de gestión comercial** construida con **FastAPI** y **SQLAlchemy**, diseñada para soportar operaciones de punto de venta y administración:

| Dominio | Qué resuelve |
|---------|----------------|
| **Autenticación** | Login OAuth2, tokens JWT, usuarios y roles (`admin`, `vendedor`) |
| **Inventario** | Productos, categorías, stock con movimientos kardex atómicos |
| **Ventas** | Órdenes, ítems, pagos, vinculación a sesión de caja abierta |
| **Clientes** | CRUD local + consulta DNI vía ApiPeru |
| **Caja** | Resumen de pagos pendientes, cierre contable, historial |
| **Compras** | Ingreso de mercadería con kardex `ENTRADA` |

**Enfoque arquitectónico:** capas **Router → Service → CRUD → ORM**, validación con **Pydantic**, errores de dominio centralizados y sesión de base de datos por request. Preparado para evolucionar hacia multi-empresa, reportes y despliegue enterprise.

---

## Tecnologías

| Tecnología | Uso en el proyecto |
|------------|-------------------|
| **Python 3.11+** | Runtime |
| **FastAPI** | Framework HTTP, OpenAPI/Swagger |
| **SQLAlchemy 2.0** | ORM y motor de persistencia |
| **Pydantic / pydantic-settings** | Schemas y configuración (`.env`) |
| **SQL Server** | Base de datos `ventasdb` (`mssql+pyodbc`) |
| **pyodbc** | Driver ODBC 17/18 |
| **JWT (python-jose)** | Tokens HS256 |
| **bcrypt** | Hash de contraseñas |
| **httpx** | Cliente async ApiPeru (DNI) |
| **uvicorn** | Servidor ASGI |

> El proyecto migró la conexión de MySQL/PyMySQL a **SQL Server**. Ver [`docs/database.md`](./docs/database.md).

---

## Arquitectura (resumen)

```
                    ┌─────────────────────────────────────┐
                    │           Cliente HTTP              │
                    │    (Bearer JWT en rutas privadas)   │
                    └──────────────────┬──────────────────┘
                                       │
                                       ▼
                    ┌─────────────────────────────────────┐
                    │  FastAPI (main.py)                  │
                    │  · CORS (middleware/)               │
                    │  · DomainError handler (core/)      │
                    └──────────────────┬──────────────────┘
                                       │
                                       ▼
                    ┌─────────────────────────────────────┐
                    │  routers/                           │
                    │  auth · products · sales · cash ·    │
                    │  purchases                          │
                    └──────────────────┬──────────────────┘
                                       │
                         ┌─────────────┴─────────────┐
                         ▼                           ▼
              ┌──────────────────┐        ┌──────────────────┐
              │  services/       │        │  auth/           │
              │  SalesService    │        │  JWT, roles      │
              │  KardexService   │        │  bcrypt          │
              │  PurchaseService │        └──────────────────┘
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │  crud/           │
              │  transacciones   │
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │  models/ +       │
              │  schemas/        │
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │  database/       │
              │  SQL Server      │
              │  ventasdb        │
              └──────────────────┘
```

| Capa | Carpeta | Responsabilidad |
|------|---------|-----------------|
| HTTP | `routers/` | Rutas, `Depends`, códigos HTTP |
| Contratos | `schemas/` | Validación entrada/salida JSON |
| Negocio | `services/` | Reglas (caja abierta, kardex, ApiPeru) |
| Datos | `crud/` | Queries, `commit`/`rollback` |
| Persistencia | `models/` | Tablas ORM (`model.py`) |
| Infra | `database/` | Engine, `get_db()` |
| Seguridad | `auth/` | Token, roles, contraseñas |
| Config | `core/` | Settings, excepciones dominio |
| Cross-cutting | `middleware/` | CORS |

---

## Características principales

- **JWT Authentication** — `POST /token` (OAuth2 password flow), Bearer en rutas protegidas
- **Roles y permisos** — `admin` y `vendedor`; `require_role()`, `get_current_admin_user`
- **Rutas protegidas** — `Depends(get_current_user)` por endpoint
- **Arquitectura modular** — routers por dominio de negocio
- **Validaciones Pydantic** — schemas por recurso (`OrderCreate`, `ProductData`, …)
- **API REST** — JSON, Swagger en `/docs`
- **Kardex de inventario** — `KardexService` con `with_for_update()` en ventas y compras
- **Manejo de errores** — `DomainError` → 400/403/404/409 según tipo
- **Integración Perú** — consulta DNI externa (`APIPERU_TOKEN`)
- **Escalabilidad** — capas desacopladas, pool SQL Server (`pool_pre_ping`, `fast_executemany`)

---

## Estructura del proyecto

```
backend/
├── main.py                 # App FastAPI, handlers, CORS
├── create_table.py         # DDL inicial (create_all)
├── requirements.txt
├── .env                    # Variables sensibles (no commitear)
│
├── auth/                   # JWT + bcrypt
├── core/                   # config.py, exceptions.py
├── database/               # engine, SessionLocal, get_db
├── middleware/             # cors_config.py
├── models/                 # model.py (ORM)
├── schemas/                # DTOs Pydantic
├── services/               # Lógica de negocio
├── crud/                   # Acceso a datos
├── routers/                # Endpoints HTTP
└── docs/                   # Documentación técnica
```

---

## Instalación

### Requisitos previos

- Python 3.11+
- SQL Server con base de datos **`ventasdb`** creada
- [ODBC Driver 17 o 18 for SQL Server](https://learn.microsoft.com/sql/connect/odbc/download-odbc-driver-for-sql-server)

### Pasos

```bash
# Clonar y entrar al backend
cd backend

# Entorno virtual
python -m venv .venv
.\.venv\Scripts\Activate.ps1    # Windows PowerShell
# source .venv/bin/activate     # Linux/macOS

# Dependencias
pip install -r requirements.txt

# Variables de entorno (crear .env en la raíz de backend/)
# Ver sección "Variables de entorno" más abajo

# Crear tablas
python create_table.py

# Levantar API
uvicorn main:app --reload
```

| Recurso | URL |
|---------|-----|
| API | http://127.0.0.1:8000 |
| Swagger UI | http://127.0.0.1:8000/docs |
| ReDoc | http://127.0.0.1:8000/redoc |
| Health | http://127.0.0.1:8000/ |

---

## Variables de entorno

Archivo: **`.env`** en la raíz de `backend/` (cargado por `core/config.py`).

| Variable | Requerida | Descripción |
|----------|:---------:|-------------|
| `DATABASE_URL` | ✅ | Cadena SQLAlchemy. Ejemplo SQL Server: `mssql+pyodbc://sa:password@localhost/ventasdb?driver=ODBC+Driver+17+for+SQL+Server` |
| `APIPERU_TOKEN` | ⚠️ | Token para `GET /clients/dni/{dni}`. Vacío → error 500 en consulta DNI |

**Seguridad JWT** (estado actual del código en `auth/security.py`):

| Parámetro | Ubicación actual | Recomendación producción |
|-----------|------------------|---------------------------|
| `SECRET_KEY` | Constante en código | Mover a `.env` como `JWT_SECRET_KEY` |
| `ALGORITHM` | `HS256` | Mantener |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `400` (login usa 480 min en router) | Unificar; valor corto + refresh token |

Ejemplo `.env`:

```env
DATABASE_URL=mssql+pyodbc://sa:TU_PASSWORD@localhost/ventasdb?driver=ODBC+Driver+17+for+SQL+Server
APIPERU_TOKEN=tu_token_apiperu

# Recomendado (cuando se externalice en código):
# JWT_SECRET_KEY=generar_con_openssl_rand_hex_32
# ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Autenticación Windows (SQL Server):**

```env
DATABASE_URL=mssql+pyodbc://@localhost/ventasdb?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes
```

---

## Seguridad

### Autenticación

1. Cliente envía `username` + `password` a `POST /token` (`application/x-www-form-urlencoded`).
2. Backend valida con **bcrypt** (`auth/password.py`).
3. Emite **JWT** con claims `sub` (username) y `role`.
4. Requests siguientes: header `Authorization: Bearer <token>`.

### Autorización

| Mecanismo | Uso |
|-----------|-----|
| `get_current_user` | Usuario autenticado y activo |
| `get_current_admin_user` | Solo rol `admin` |
| `require_role("admin")` | Factory para roles específicos |

### Rutas protegidas

La protección es **por endpoint** (dependencias FastAPI), no middleware global. Detalle de permisos por ruta: [`docs/auth.md`](./docs/auth.md).

---

## Flujo de una petición

```
HTTP Request
     │
     ▼
┌────────────┐
│ CORS       │
└─────┬──────┘
      ▼
┌────────────┐     Pydantic valida body/query
│ Router     │──── Depends: get_db, get_current_user
└─────┬──────┘
      ▼
┌────────────┐     Ej: caja abierta, stock, cliente existe
│ Service    │──── (opcional; ventas/compras sí lo usan)
└─────┬──────┘
      ▼
┌────────────┐     SQL + kardex + commit/rollback
│ CRUD       │
└─────┬──────┘
      ▼
┌────────────┐
│ SQL Server │
└─────┬──────┘
      ▼
JSON Response  (response_model o DomainError → handler)
```

**Ejemplo real — crear venta:**  
`POST /create_order/` → `SalesService.create_order` → valida `CashSession` OPEN → `order_crud` + `KardexService` SALIDA → `OrderResponse`.

---

## Módulos API (resumen)

| Módulo | Prefijo de rutas | Tag Swagger |
|--------|------------------|-------------|
| Auth / usuarios | `/token`, `/users/*`, `/register/` | Authentication |
| Productos | `/products/`, `/categories/`, `/create_products/` | Products |
| Ventas | `/create_order/`, `/order/`, `/clients/*` | Sales & Clients |
| Caja | `/summary`, `/close`, `/history` | Cash Session / Cierre de Caja |
| Compras | `/purchases/` | Purchases / Compras |

Referencia completa de endpoints: [`docs/api.md`](./docs/api.md).

---

## Documentación técnica

| Documento | Contenido |
|-----------|-----------|
| [`docs/backend.md`](./docs/backend.md) | Capas, patrones, problemas detectados, recomendaciones |
| [`docs/auth.md`](./docs/auth.md) | JWT, roles, matriz de permisos, seguridad |
| [`docs/database.md`](./docs/database.md) | Tablas, relaciones, kardex, SQL Server |
| [`docs/api.md`](./docs/api.md) | Endpoints, payloads, códigos HTTP |
| [`docs/architecture.md`](./docs/architecture.md) | Vista sistema, SaaS futuro, escalabilidad |

---

## Roadmap backend

| Fase | Entrega | Estado |
|------|---------|--------|
| Core ERP | Ventas, productos, clientes, JWT | ✅ |
| SQL Server | Migración `mssql+pyodbc` | ✅ |
| Kardex | Movimientos ENTRADA/SALIDA + bloqueo stock | ✅ |
| Caja sesión | API abrir/cerrar `CashSession` | 🔲 |
| Auth | Refresh tokens, `SECRET_KEY` en `.env` | 🔲 |
| RBAC | Permisos granulares por recurso | 🔲 |
| Reportes | Servicio dedicado, agregaciones SQL | 🔲 |
| Auditoría | `audit_log`, `created_by` / `updated_by` | 🔲 |
| Logs | Logging estructurado JSON | 🔲 |
| Multi-empresa | `tenant_id`, aislamiento datos | 🔲 |
| Performance | Redis cache catálogo | 🔲 |
| DevOps | Docker, CI/CD, Alembic | 🔲 |

---

## Mejoras futuras

### Arquitectura enterprise

- Prefijo versionado `/api/v1`
- Alembic para migraciones incrementales
- Dividir `models/model.py` en paquete por dominio
- Eliminar servicios stub (`order_service.py`, `kardex_service.py`, …) o implementarlos

### Microservicios (largo plazo)

- Servicio de inventario/kardex si el volumen de stock lo exige
- Servicio de facturación / billing SaaS
- Bus de eventos (RabbitMQ) para webhooks y n8n

### Async y performance

- Colas para reportes pesados y notificaciones
- Caché Redis en catálogo y métodos de pago
- Workers uvicorn + connection pool tuning

### Seguridad avanzada

- Refresh token rotativo + revocación
- Rate limiting en `/token`
- MFA para administradores
- Secretos en vault (Azure Key Vault, AWS Secrets Manager)

---

## Scripts útiles

```bash
# Crear esquema en BD
python create_table.py

# Desarrollo con recarga
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Verificar import de la app
python -c "from main import app; print(app.title)"
```

---

## Contribución y mantenimiento

1. Mantener routers delgados; lógica en `services/` o `crud/`.
2. Nuevos errores de negocio → subclase de `DomainError` en `core/exceptions.py` + handler en `main.py`.
3. Documentar endpoints nuevos en [`docs/api.md`](./docs/api.md).

---

**Mini ERP SaaS — Backend API** · FastAPI · SQL Server · Arquitectura modular lista para escalar.
