from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db
from auth.security import get_current_user, require_role
from models.model import User
from schemas.order_schema import OrderCreate, OrderResponse, OrderUpdate
from schemas.client_schema import ClientCreate, ClientResponse, DniResponse
from schemas.payment_method_schema import PaymentMethodResponse
from services.sales_service import SalesService
from services.apiperu_service import ApiPeruConfigError, ApiPeruRequestError, consult_dni_apiperu
from crud.client_crud import create_client, get_client_by_dni, get_client_by_email, get_clients
from crud.payment_crud import get_payment_method
from crud import order_crud

router = APIRouter(tags=["Sales & Clients"])

@router.post("/create_order/", response_model=OrderResponse)
def create_order_db(order: OrderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return SalesService.create_order(db=db, order_create=order, user_id=current_user.id)


@router.get("/order/", response_model=List[OrderResponse])
def get_order_db(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    role = current_user.role.name
    if role == "admin":
        return order_crud.get_order(db=db, skip=skip, limit=limit)
    elif role == "vendedor":
        return order_crud.get_order(db=db, skip=skip, limit=limit, user_id=current_user.id)
    
    raise HTTPException(status_code=403, detail="No tienes permisos para ver estas ordenes")


@router.put("/update_order/{order_id}")
def update_order_db(order_id: int, order_data: OrderUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    return SalesService.update_order(db=db, order_id=order_id, order_data=order_data, user_id=current_user.id)
    

@router.delete("/delete_order/{order_id}")
def delete_order_db(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    return SalesService.delete_order(db=db, order_id=order_id, user_id=current_user.id)


@router.get("/sales_report/")
def get_sales_report_db(db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    return SalesService.get_sales_report(db=db)


#-----------------------> endpoints de los clientes <------------------------

@router.get("/clients/", response_model=List[ClientResponse])
def get_clients_db(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_clients(db=db, skip=skip, limit=limit)


@router.get("/clients/dni/{dni}", response_model=DniResponse)
async def consult_client_dni(dni: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if len(dni) != 8 or not dni.isdigit():
        raise HTTPException(status_code=400, detail="DNI debe tener 8 dígitos numéricos")
    try:
        data = await consult_dni_apiperu(dni)
    except ApiPeruConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except ApiPeruRequestError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    return DniResponse(
        dni=data.get("numero", dni),
        full_name=data.get("nombre_completo", ""),
        nombres=data.get("nombres"),
        apellido_paterno=data.get("apellido_paterno"),
        apellido_materno=data.get("apellido_materno"),
        codigo_verificacion=data.get("codigo_verificacion"),
    )
        

@router.get("/clients/{dni}", response_model=ClientResponse)
def get_client_db(dni: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_client = get_client_by_dni(db=db, dni=dni)
    if not db_client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return db_client


@router.post("/clients/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
def create_client_db(client: ClientCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if get_client_by_dni(db=db, dni=client.dni):
        raise HTTPException(status_code=400, detail="Ya existe un cliente con este DNI")

    if get_client_by_email(db=db, email=client.email):
        raise HTTPException(status_code=400, detail="Ya existe un cliente con este email")

    return create_client(db=db, client_data=client)


@router.get("/payment_methods/", response_model=list[PaymentMethodResponse])
def get_payment_methods_db(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_payment_method(db=db)
