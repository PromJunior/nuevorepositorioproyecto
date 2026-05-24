# Autenticación y autorización

Sistema basado en **JWT (HS256)** + **OAuth2 Password Flow** + roles en base de datos (`roles` / `users`).

---

## Componentes

| Archivo | Responsabilidad |
|---------|-----------------|
| `auth/password.py` | `verify_password`, `get_password_hash` (bcrypt) |
| `auth/security.py` | JWT, `get_current_user`, `require_role`, `get_current_admin_user` |
| `routers/auth_router.py` | Endpoints `/token`, `/users/*`, `/register/` |
| `crud/user_crud.py` | Persistencia usuarios y roles |

**Nota:** `password.py` existe para evitar import circular (`security.py` → `user_crud` → `security`).

---

## JWT Authentication

### Login (`POST /token`)

**Archivo:** `routers/auth_router.py`

```python
# Formato: application/x-www-form-urlencoded (OAuth2PasswordRequestForm)
# Campos: username, password
```

**Flujo interno:**

```
1. user_crud.get_user_by_username(db, username)
2. verify_password(plain, user.hashed_password)  # bcrypt
3. create_access_token({
       "sub": user.username,
       "role": get_user_role_name(user)   # ej. "admin", "vendedor"
   }, expires_delta=480 minutos)
4. Return { access_token, token_type: "bearer" }
```

**Constantes** (`auth/security.py`):

| Constante | Valor actual | Observación |
|-----------|--------------|-------------|
| `SECRET_KEY` | Hardcodeada en código | ⚠️ Debe ir a `.env` |
| `ALGORITHM` | `HS256` | Estándar |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `400` | Login usa `480` en router (inconsistencia menor) |

### Generación del token

```python
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode = {**data, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
```

**Claims usados:**

| Claim | Contenido |
|-------|-----------|
| `sub` | `username` (identificador para cargar usuario en cada request) |
| `role` | Nombre del rol (string) — usado por el frontend React |
| `exp` | Expiración UTC |

### Validación del token

**Dependencia:** `get_current_user` en `auth/security.py`

```
Authorization: Bearer <token>
        │
        ▼
oauth2_scheme extrae token
        │
        ▼
jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        │
        ▼
username = payload["sub"]
        │
        ▼
user_crud.get_user_by_username(db, username)
        │
        ├─ user is None        → 401
        ├─ not user.is_active  → 403 "Usuario inactivo"
        └─ OK                  → User ORM inyectado en endpoint
```

**No hay middleware global:** cada ruta protegida declara `Depends(get_current_user)` explícitamente.

### Expiración

- El backend valida `exp` en cada request vía `jwt.decode`.
- El frontend (`ProtectedRouter.jsx`) también decodifica con `jwt-decode` y redirige a `/login` si expiró (validación solo de tiempo, **no de firma**).

---

## Roles y permisos

### Modelo de datos

```
roles (id, name)     ← ej. "admin", "vendedor"
    ↑
users (id_role FK) 
```

**ORM:** `User.id_role` → `Roles.name`

### Mecanismos de autorización en código

| Mecanismo | Uso |
|-----------|-----|
| `get_current_user` | Cualquier usuario autenticado activo |
| `get_current_admin_user` | Solo `role.name.lower() == "admin"` |
| `require_role("admin")` | Factory que devuelve dependencia por rol |
| Comparación manual | `if get_user_role_name(current_user) != "admin"` en `auth_router` |

### Matriz de permisos (endpoints actuales)

| Endpoint | admin | vendedor | Auth |
|----------|:-----:|:--------:|------|
| `POST /token` | ✅ | ✅ | Público |
| `GET /users/me` | ✅ | ✅ | JWT |
| `POST /register/` | ✅ | ❌ | JWT + check admin |
| `GET /users/` | ✅ | ❌ | JWT + check admin |
| `PUT/DELETE /users/{id}` | ✅ | ❌ | JWT + check admin |
| `POST /create_products/` | ✅ | ❌ | `get_current_admin_user` |
| `GET /products/` | ✅ | ✅ | JWT |
| `POST /create_order/` | ✅ | ✅ | JWT + caja abierta |
| `GET /order/` | todas | solo propias | JWT + filtro `user_id` |
| `PUT/DELETE /update_order/` | ✅ | ❌ | `require_role("admin")` |
| `GET /sales_report/` | ✅ | ❌ | `require_role("admin")` |
| `GET/POST /clients/*` | ✅ | ✅ | JWT |
| `POST /close` (caja) | ✅ | ✅ | JWT (cualquier autenticado) |
| `GET /summary`, `/history` | ✅ | ❌ | `require_role("admin")` |
| `POST/GET /purchases/` | ✅ | ❌ | `get_current_admin_user` |

### Rutas protegidas — patrón FastAPI

```python
@router.post("/create_order/")
def create_order_db(
    order: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # ← protección
):
    ...
```

---

## Flujo autenticación (sistema completo)

```
┌──────────────┐     POST /token (form)      ┌──────────────┐
│   React      │ ──────────────────────────► │   FastAPI    │
│   Login.jsx  │                             │ auth_router  │
└──────────────┘                             └──────┬───────┘
       │                                            │
       │◄──────── { access_token, token_type } ─────┘
       │
       ▼
 localStorage.setItem('token', access_token)
       │
       ▼
 axios interceptor → Header: Authorization: Bearer <token>
       │
       ▼
┌──────────────┐     GET /products/ etc.     ┌──────────────┐
│  Protected   │ ──────────────────────────► │ get_current_ │
│  Router      │                             │    user()    │
└──────────────┘                             └──────────────┘
       │
       │ jwtDecode(token).role → menú UI (admin vs vendedor)
       ▼
 MainLayout muestra/oculta Dashboard, Inventario, etc.
```

**Desalineación UI vs API:** el frontend permite `admin` y `vendedor` en `ProtectedRouter`, pero algunas rutas API son solo admin; el vendedor recibirá **403** si llama endpoints admin.

---

## Seguridad

### Vulnerabilidades / riesgos actuales

| Riesgo | Severidad | Detalle |
|--------|-----------|---------|
| `SECRET_KEY` en código | **Alta** | Cualquiera con el repo puede falsificar tokens |
| JWT largo (480 min) | Media | Ventana amplia si roban token |
| Sin refresh token | Media | No hay rotación ni revocación |
| Rol en JWT no re-validado estrictamente | Media | Se confía en DB en `get_current_user`, pero el claim `role` del token puede desactualizarse hasta expirar |
| CORS localhost fijo | Baja (dev) | Producción requiere orígenes reales |
| `POST /close` sin rol admin | Baja | Cualquier usuario autenticado puede cerrar caja global de pagos |

### Buenas prácticas ya aplicadas

- Contraseñas con **bcrypt** + salt (`auth/password.py`).
- Usuario inactivo bloqueado (`is_active=False` → 403).
- Baja de usuarios lógica (`deactivate_user`) sin borrar fila.
- Separación hash/JWT en módulos distintos.

### Mejoras recomendadas

```env
# .env (propuesta)
JWT_SECRET_KEY=<generar con openssl rand -hex 32>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

1. **Refresh token** en cookie `httpOnly` + access token corto.
2. **RBAC:** tabla `permissions` + `role_permissions` en lugar de strings en código.
3. **Revocación:** `token_version` en `users` validado en cada request.
4. **Rate limiting** en `/token` (slowapi).
5. Unificar expiración (400 vs 480 minutos).

---

## Mejoras futuras

### Refresh token (flujo propuesto)

```
POST /token          → access_token (15 min)
POST /token/refresh  → nuevo access_token (cookie refresh)
POST /logout         → invalidar refresh en Redis/DB
```

### RBAC avanzado

```
Permiso: orders:delete
Rol admin     → [orders:*, users:*, ...]
Rol vendedor  → [orders:create, orders:read:own, ...]
```

Implementación: dependencia `require_permission("orders:delete")` consultando BD, no solo `role == "admin"`.

### Permisos dinámicos SaaS

- Permisos por **plan** (Free / Pro / Enterprise).
- Middleware que inyecte `tenant_id` y filtre datos por empresa.

---

## Schemas relacionados

| Schema | Archivo |
|--------|---------|
| `Token` | `schemas/user_schema.py` |
| `UserCreate`, `UserResponse`, `UserUpdate` | `schemas/user_schema.py` |
| Duplicado `Token` | `schemas/auth_schemas.py` (legacy) |

---

## Swagger / OAuth2

- `OAuth2PasswordBearer(tokenUrl="token")` habilita botón **Authorize** en `/docs`.
- Usuario de prueba: el que exista en tabla `users` con hash bcrypt en `hashed_password`.

---

*Basado en `auth/security.py`, `auth/password.py`, `routers/auth_router.py` y `crud/user_crud.py`.*
