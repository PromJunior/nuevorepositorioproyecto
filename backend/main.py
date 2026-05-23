from fastapi import FastAPI
from routers.router import router as APIRouter

from middleware.cors_config import setup_cors


app = FastAPI(title = "API de Gestión de Pedidos")


app.include_router(APIRouter)
setup_cors(app)


@app.get("/")
def root():
    return {"message": "Bienvenido al sistema de ventas"}


