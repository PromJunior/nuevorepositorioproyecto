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
