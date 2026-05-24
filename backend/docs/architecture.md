# Arquitectura del sistema — Mini ERP SaaS

Visión de arquitectura del producto **fastapi-react-mysql**: backend ERP comercial + frontend React (Vite), orientado a retail en Perú con integración DNI (ApiPeru) y automatización futura (n8n mencionado en UI).

---

## Arquitectura general

```
┌────────────────────────────────────────────────────────────────────┐
│                         CAPA PRESENTACIÓN                          │
│  React 19 + Vite + React Router + Axios + Tailwind                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │  Login   │ │Dashboard │ │ Inventario│ │  Ventas  │ │  Cierre  │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│       JWT en localStorage + ProtectedRouter (rol en token)         │
└───────────────────────────────┬────────────────────────────────────┘
                                │ HTTP/JSON (CORS :5173)
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                         CAPA APLICACIÓN                            │
│  FastAPI (main.py)                                                 │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │  Auth   │ │ Products │ │  Sales   │ │   Cash   │ │ Purchases││
│  └────┬────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘│
│       └───────────┴─────────────┴────────────┴────────────┘       │
│                         Services + CRUD                            │
└───────────────────────────────┬────────────────────────────────────┘
                                │ SQLAlchemy ORM
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                         CAPA DATOS                                 │
│  Microsoft SQL Server — base: ventasdb                             │
│  pyodbc + ODBC Driver 17/18                                        │
└────────────────────────────────────────────────────────────────────┘
                                │
                                ▼ (async HTTP)
┌────────────────────────────────────────────────────────────────────┐
│                    SERVICIOS EXTERNOS                              │
│  ApiPeru.dev (consulta DNI) — APIPERU_TOKEN en .env                │
└────────────────────────────────────────────────────────────────────┘
```

---

## Flujo del sistema por caso de uso

### 1. Login

```
Usuario → Login.jsx
    → POST /token (form)
    → JWT { sub, role, exp }
    → localStorage + redirect:
         admin    → /
         vendedor → /ventas
```

### 2. Inventario (catálogo)

```
Inventory.jsx → GET /products/, GET /categories/
Admin         → POST /create_products/, PUT, DELETE
```

**Nota:** Cambios de stock por venta/compra no pasan por CRUD producto directo; pasan por **kardex**.

### 3. Ventas / órdenes

```
Sales.jsx → POST /create_order/
Precondición backend: CashSession OPEN (crud/cash_session_crud)
Efecto: Order + Payment + Kardex SALIDA
Orders.jsx → GET /order/ (filtrado por rol)
```

### 4. Clientes (POS)

```
Consulta DNI → GET /clients/dni/{dni} → ApiPeru
Alta local     → POST /clients/
```

### 5. Cierre de caja

```
cashClosing.jsx → GET /summary, POST /close, GET /history
```

**Gap arquitectónico:** apertura de `CashSession` existe en `cash_session_crud.open_cash_session` pero **no está expuesta por API** — bloqueo para flujo vendedor completo vía HTTP.

---

## Módulos del backend (mapa lógico)

```
                    ┌─────────────────┐
                    │      main       │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   ┌───────────┐      ┌────────────┐      ┌────────────┐
   │   Auth    │      │  Comercial │      │  Finanzas  │
   │  module   │      │   module   │      │   module   │
   └─────┬─────┘      └──────┬─────┘      └──────┬─────┘
         │                   │                    │
    users/roles         products/orders      cash/payments
    JWT/bcrypt          clients/kardex       purchases
                        apiperu              closing
```

| Módulo lógico | Archivos principales | Estado |
|---------------|---------------------|--------|
| **Auth** | `auth/*`, `auth_router`, `user_crud` | Operativo |
| **Inventory** | `products_router`, `crud_product`, `KardexService` | Operativo |
| **Sales** | `sales_router`, `SalesService`, `order_crud` | Operativo |
| **Purchases** | `purchases_router`, `PurchaseService` | Operativo |
| **Cash** | `cash_router`, `closing_crud`, `cash_session_crud` | Parcial (sin API sesión) |
| **Dashboard** | — | Solo frontend (sin API dedicada) |
| **Reports** | `get_sales_report` | Básico |

---

## Capas y dependencias (Clean Architecture — estado actual)

```
         [Routers]  ──depende──►  Services (opcional)
              │                        │
              └──────────┬─────────────┘
                         ▼
                      [CRUD]
                         │
                         ▼
                      [Models]
                         │
                         ▼
                    [SQL Server]

         [Schemas]  ◄── validación paralela (Pydantic)
         [Auth]     ◄── cross-cutting (Depends)
```

**Desviaciones de Clean Architecture:**

- CRUD a veces contiene lógica de negocio (kardex en `order_crud`).
- Modelos ORM expuestos hasta router (`User` en type hints — aceptable en FastAPI).
- Sin capa de interfaces / puertos explícitos.

**Evolución sugerida (sin microservicios aún):**

```
domain/       ← entidades + reglas puras
application/  ← use cases (CreateOrder, RegisterPurchase)
infrastructure/ ← crud, sqlalchemy, apiperu
interfaces/   ← routers
```

---

## Escalabilidad

### Estado actual (monolito modular)

| Dimensión | Capacidad | Cuello de botella |
|-----------|-----------|-------------------|
| Usuarios concurrentes | Moderada | Single process uvicorn |
| Datos | Single DB ventasdb | Sin sharding |
| Stock concurrente | `with_for_update` ✅ | Contención en productos hot |
| Lecturas | Sin caché | Listados productos/órdenes |

### Evolución técnica recomendada

#### Fase 1 — Monolito reforzado

```
┌─────────────┐     ┌─────────┐     ┌──────────────┐
│   FastAPI   │────►│  Redis  │     │ SQL Server   │
│  (workers)  │     │  cache  │     │  ventasdb    │
└─────────────┘     └─────────┘     └──────────────┘
```

- Redis: sesiones, rate limit login, caché catálogo.
- Uvicorn workers + Gunicorn.
- Cola **Celery/RQ** para reportes y webhooks n8n.

#### Fase 2 — Servicios opcionales

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  API Core    │   │ Inventory Svc│   │  Billing Svc │
│  (orders)    │   │  (kardex)    │   │  (SaaS)      │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       └──────────────────┴──────────────────┘
                          │
                    Message Bus (RabbitMQ)
```

Solo justificado con alto volumen o equipos separados.

#### Async

- Endpoints ya async en consulta DNI (`consult_client_dni`).
- Resto es sync def — migrar I/O externo a async donde crezca latencia.

---

## Arquitectura SaaS futura

### Multi-empresa (multi-tenant)

**Modelo recomendado:** columna `tenant_id` en tablas de negocio.

```
Request → JWT { sub, role, tenant_id }
       → Middleware filtra query: .filter(Model.tenant_id == tenant_id)
```

| Estrategia | Pros | Contras |
|------------|------|---------|
| Columna discriminador | Simple, un schema | Riesgo fuga datos si bug |
| Schema por tenant | Aislamiento | Costoso operar |
| DB por tenant | Máximo aislamiento | Complejidad extrema |

### Multi-usuario por tenant

```
Organization (tenant)
    ├── Users (roles por org)
    ├── Branches (sucursales)  ← futuro
    └── CashSessions por branch/user
```

### Permisos SaaS

```
Plan Free     → 1 user, 100 products, sin ApiPeru
Plan Pro      → 5 users, kardex, reportes
Plan Enterprise → SSO, multi-branch, SLA
```

Implementación: tabla `subscriptions` + middleware que valide límites antes de `create_product` / `create_user`.

### Suscripciones (billing)

Integración Stripe/Paddle → webhooks → actualizar `plan_id` en `organizations`.

---

## Seguridad en arquitectura

```
[Internet]
    │
    ▼
[Reverse Proxy TLS]  ← nginx / cloudflare
    │
    ▼
[FastAPI + CORS restrictivo]
    │
    ├─ JWT validation
    ├─ Role checks
    └─ Domain errors
    │
    ▼
[SQL Server private network]
```

---

## Observabilidad (propuesta)

| Componente | Herramienta |
|------------|-------------|
| Logs estructurados | `structlog` + JSON |
| Trazas | OpenTelemetry |
| Errores | Sentry (ya en requirements como dependencia transitiva) |
| Métricas | Prometheus + `/metrics` |

---

## Diagrama de despliegue (objetivo producción)

```
                    ┌──────────────┐
                    │   Usuarios   │
                    └──────┬───────┘
                           │ HTTPS
                    ┌──────▼───────┐
                    │  CDN/Static  │  React build
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │     API      │  Docker: FastAPI
                    │  (backend)   │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌─────────┐ ┌───────────┐
        │SQL Server│ │  Redis  │ │  ApiPeru  │
        │ ventasdb │ │ (futuro)│ │  (externo)│
        └──────────┘ └─────────┘ └───────────┘
```

---

## Roadmap arquitectónico sugerido

| Prioridad | Entrega | Impacto |
|:---------:|---------|---------|
| P0 | Secretos en `.env`, endpoint abrir caja | Seguridad + flujo venta |
| P1 | `/api/v1`, Alembic, tests integración | Mantenibilidad |
| P2 | Redis cache catálogo, refresh JWT | Performance + UX |
| P3 | `tenant_id`, planes SaaS | Modelo negocio |
| P4 | Servicio reportes / eventos n8n | Ecosistema |

---

## Documentos relacionados

| Documento | Contenido |
|-----------|-----------|
| [backend.md](./backend.md) | Capas, carpetas, patrones, problemas |
| [auth.md](./auth.md) | JWT, roles, seguridad |
| [database.md](./database.md) | Tablas, kardex, ERP data flow |
| [api.md](./api.md) | Endpoints, payloads, REST |

---

*Arquitectura documentada según el estado del repositorio `backend/` + integración con `frontend/`.*
