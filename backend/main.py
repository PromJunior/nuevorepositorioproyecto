from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from routers.router import router as APIRouter
from middleware.cors_config import setup_cors
from core.exceptions import (
    DomainError,
    ClientNotFoundError,
    ProductNotFoundError,
    PaymentMethodNotFoundError,
    OrderNotFoundError,
    OutOfStockError,
    InsufficientStockError,
    NoOpenCashSessionError,
    InvalidPriceError,
)



app = FastAPI(title="API de Gestión de Pedidos")

@app.exception_handler(DomainError)
def domain_exception_handler(request: Request, exc: DomainError):
    status_code = 400
    if isinstance(exc, NoOpenCashSessionError):
        status_code = 403
    elif isinstance(exc, (ClientNotFoundError, ProductNotFoundError, PaymentMethodNotFoundError, OrderNotFoundError)):
        status_code = 404
    elif isinstance(exc, (OutOfStockError, InsufficientStockError)):
        status_code = 409
    return JSONResponse(
        status_code=status_code,
        content={"detail": exc.message}
    )

app.include_router(APIRouter)
setup_cors(app)

@app.get("/")
def root():
    return {"message": "Bienvenido al sistema de ventas"}

from database.seed import (
    create_initial_admin,
    ensure_drive_export_log_columns,
    ensure_payment_method_columns,
    ensure_settings_integration_columns,
    seed_payment_methods,
    seed_purchase_statuses,
)
from database.database import SessionLocal, Base, engine
import models.model  # noqa: F401  — asegura que todos los modelos estén registrados

@app.on_event("startup")
def startup_event():
    # Crea tablas nuevas (idempotente: no afecta las existentes)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        ensure_payment_method_columns(db)
        ensure_settings_integration_columns(db)
        ensure_drive_export_log_columns(db)
        create_initial_admin(db)
        seed_purchase_statuses(db)
        seed_payment_methods(db)
    finally:
        db.close()
