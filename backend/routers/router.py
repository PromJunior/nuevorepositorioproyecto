from auth.security import get_current_user, get_current_admin_user, get_user_role_name
from fastapi import FastAPI, Depends, HTTPException, APIRouter, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta, datetime

from database.database import get_db
from auth.security import verify_password, create_access_token, get_current_user, require_role, get_user_role_name, get_current_admin_user



from crud.crud_product import create_product, get_product, update_product, delete_product
from crud.order_crud import create_order, get_order, get_sales_report, update_order, delete_order
from crud.category_crud import get_category
from crud.payment_crud import get_payment_method
from crud.closing_crud import get_all_closings, get_peding_payment_sumary, excecute_cash_closing
from crud.user_crud import get_user_by_username, create_user, get_all_users
from crud.client_crud import create_client, get_client_by_dni, get_client_by_email, get_clients
from crud import user_crud

from models.model import Product, Order, OrderItem, Payment, PaymentMethod, User, Category, CashClosing

from schemas.product_schema import ProductData, ProductResponse
from schemas.order_schema import OrderCreate, OrderResponse, OrderUpdate
from schemas.category_schema import CategoryData, CategoryResponse
from schemas.payment_method_schema import PaymentMethodData, PaymentMethodResponse
from schemas.closing_schema import CashClosingResponse, DailSummary, CashClosingCreate
from schemas.user_schema import UserBase, UserCreate, UserResponse, Token, TokenData, UserUpdate, RoleCreate, RoleResponse
from schemas.client_schema import ClientCreate, ClientResponse, DniResponse
from services.apiperu_service import ApiPeruConfigError, ApiPeruRequestError, consult_dni_apiperu



from middleware.cors_config import setup_cors

router = APIRouter()

@router.post("/create_products/", response_model=ProductResponse)
def create_product_db(product: ProductData, db: Session = Depends(get_db), admin_user: User = Depends(get_current_admin_user)):
    
    return create_product(db=db, product=product)


@router.get("/products/",response_model=list[ProductResponse])
def get_product_db(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_product(db=db, skip=skip, limit=limit)

@router.put("/update_products/{product_id}", tags=["products"])
def edit_product_db(product_id:int, product: ProductData, db:Session = Depends(get_db), admin_user: User = Depends(get_current_admin_user)):
    return update_product(db, product_id, product)

@router.delete("/delete_product/{product_id}", tags=["products"])
def delete_product_db(product_id:int, db:Session = Depends(get_db), admin_user: User = Depends(get_current_admin_user)):
    return {"deleted": delete_product(db, product_id)}
    
#----------------------->      endpoints de las ordenes registradas        <------------------------

@router.post("/create_order/", response_model=OrderResponse)
def create_order_db(order: OrderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_order(db=db, order_create=order, user_id = current_user.id)


# obtener todas las ordenes registradas, con paginacion y filtro por usuario (solo admin puede ver todas las ordenes, vendedor solo las suyas)
@router.get("/order/", response_model=List[OrderResponse], tags=["Orders"],)
def get_order_db(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    role = current_user.role.name
    if role == "admin":
        return get_order(db=db)
    elif role == "vendedor":
        return get_order(db=db , user_id=current_user.id)
    
    raise HTTPException(status_code=403, detail="No tienes permisos para ver estas ordenes")

#editar las ordenes registradas, solo admin puede editar cualquier orden, vendedor solo las suyas
@router.put("/update_order/{order_id}", tags=["orders"])
def update_order_db(order_id:int, order_data: OrderUpdate, db:Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    db_order = update_order(db=db, order_id = order_id, order_data = order_data)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    return db_order
    
#eliminar las ordenes registradas, solo admin puede eliminar cualquier orden, vendedor solo las suyas
@router.delete("/delete_order/{order_id}", tags=["orders"])
def delete_order_db(order_id:int, db:Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    return delete_order(db=db, order_id=order_id)

# obtener el reporte de ventas totales y por usuario, solo admin puede ver el reporte de todos los usuarios, vendedor solo el suyo

@router.get("/sales_report/", tags=["reports"])
def get_sales_report_db(db:Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    return get_sales_report(db=db)

    

#-----------------------> endpoint de los clientes admin y usuarios pueden ver y editar        <------------------------

@router.get("/clients/", response_model=List[ClientResponse], tags=["Clients"])
def get_clients_db(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_clients(db=db, skip=skip, limit=limit)

@router.get("/clients/dni/{dni}", response_model=DniResponse, tags=["Clients"])
async def consult_client_dni(dni:str, db:Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if len(dni) !=8 or not dni.isdigit():
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
        

@router.get("/clients/{dni}", response_model=ClientResponse, tags=["Clients"])
def get_client_db(dni: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_client = get_client_by_dni(db=db, dni=dni)
    if not db_client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return db_client

@router.post("/clients/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED, tags=["Clients"])
def create_client_db(client: ClientCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if get_client_by_dni(db=db, dni=client.dni):
        raise HTTPException(status_code=400, detail="Ya existe un cliente con este DNI")

    if get_client_by_email(db=db, email=client.email):
        raise HTTPException(status_code=400, detail="Ya existe un cliente con este email")

    return create_client(db=db, client_data=client)

#----------------------->              <------------------------

@router.get("/categories/", response_model=list[CategoryResponse])
def get_categories_db(db: Session = Depends(get_db), current_user : User = Depends(get_current_user)):
    return get_category(db=db)

@router.get("/payment_methods/", response_model=list[PaymentMethodResponse])
def get_payment_methods_db(db: Session = Depends(get_db), current_user : User = Depends(get_current_user)):
    return get_payment_method(db=db)



#----------------------->  endpoints de cierre de caja             <------------------------
# sumatoria de las ventas pendientes de pago, solo admin puede ver el resumen de todas las ventas pendientes, vendedor solo las suyas
@router.get("/summary", response_model=List[DailSummary])
def read_sumary(db:Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    return get_peding_payment_sumary(db)

#vendedor y admin pueden ejecutar el cierre de caja, pero vendedor solo puede cerrar sus ventas pendientes, admin puede cerrar todas las ventas pendientes
@router.post("/close", response_model=CashClosingResponse)
def create_close(data: CashClosingCreate, db:Session = Depends(get_db), current_user : User = Depends(get_current_user)):
    try:
        return excecute_cash_closing(db=db, closing_data=data, user_id = current_user.id)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al ejecutar el cierre de caja: {str(e)}")
    
@router.get("/history", response_model=List[CashClosingResponse])
def get_history(db: Session = Depends(get_db), admin_user: User = Depends(require_role("admin"))):
    return get_all_closings(db=db)

#-----------------------> acceso al sistema mediante tokens             <------------------------

@router.post("/token", response_model = Token, tags=["Authentication"])
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = user_crud.get_user_by_username(db=db, username=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code= status.HTTP_401_UNAUTHORIZED,
                             detail="username o contraseña incorrecta",
                             headers={"WWW-Authenticate": "Bearer"},
                             )
    access_token_expires = timedelta(minutes=480)

    access_token = create_access_token(data={"sub": user.username, "role": get_user_role_name(user)}, expires_delta=access_token_expires)

    return{"access_token": access_token, "token_type": "bearer"}


@router.post("/register/", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    if get_user_role_name(current_user) != "admin":
        raise HTTPException(status_code=403, detail="solo admin puede crear usuarios")

    db_user = user_crud.get_user_by_username(db=db, username = user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="username ya existe")
    
    try:
        return user_crud.create_user(db=db, user_data=user)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))



@router.get("/users/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user          

@router.get("/users/", response_model=List[UserResponse], tags=["Users"])
def read_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if get_user_role_name(current_user) != "admin":
        raise HTTPException(status_code=403, detail="Solo el administrador puede ver la lista de usuarios")
    return get_all_users(db=db)

@router.put("/users/{user_id}", response_model=UserResponse)
def edit_user(
    user_id: int, 
    user_updates: UserUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) 
):
    if get_user_role_name(current_user) != "admin":
        raise HTTPException(status_code=403, detail="No tienes permisos para editar usuarios")
    
    try:
        return user_crud.update_user(db, user_id, user_updates)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@router.delete("/users/{user_id}", response_model=UserResponse)
def delete_user_logical(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if get_user_role_name(current_user) != "admin":
        raise HTTPException(status_code=403, detail="No tienes permisos para esta acción")
    
    return user_crud.deactivate_user(db, user_id)



            
