from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db
from auth.security import get_current_user
from models.model import User
from schemas.supplier_schema import SupplierCreate, SupplierResponse, RucResponse
from crud import supplier_crud
from validators.supplier_validator import validate_ruc_format
from services.apiperu_service import consult_ruc_apiperu, ApiPeruConfigError, ApiPeruRequestError

router = APIRouter(prefix="/suppliers", tags=["Suppliers / Proveedores"])


@router.get("/ruc/{ruc}", response_model=RucResponse)
async def consult_supplier_ruc(
    ruc: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Consulta los datos de un RUC a través de ApiPeruDev de forma automática.
    Requiere autenticación JWT.
    """
    # 1. Validar el formato del RUC antes de hacer peticiones externas
    validate_ruc_format(ruc)
    
    try:
        # 2. Consultar a la API externa
        data = await consult_ruc_apiperu(ruc)
    except ApiPeruConfigError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc)
        )
    except ApiPeruRequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc)
        )
        
    # 3. Mapear y normalizar la respuesta para el frontend
    return RucResponse(
        ruc=data.get("numero", ruc),
        company_name=data.get("razon_social", ""),
        address=data.get("direccion_completa") or data.get("direccion"),
        state=data.get("estado"),
        condition=data.get("condicion"),
        ubigeo=" - ".join(filter(None, data.get("ubigeo", []))) if isinstance(data.get("ubigeo"), list)
        else data.get("ubigeo", ""),
        departamento=data.get("departamento"),
        provincia=data.get("provincia"),
        distrito=data.get("distrito"),
    )


@router.post("/", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(
    supplier: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Registra un nuevo proveedor en la base de datos previa validación de formato y duplicados.
    Requiere autenticación JWT.
    """
    # 1. Validar formato de RUC
    validate_ruc_format(supplier.ruc)
    
    # 2. Validar duplicados de RUC para evitar errores de llave única
    db_supplier = supplier_crud.get_supplier_by_ruc(db, ruc=supplier.ruc)
    if db_supplier:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El proveedor con RUC {supplier.ruc} ya está registrado en el sistema."
        )
        
    # 3. Crear registro
    return supplier_crud.create_supplier_db_record(db, supplier=supplier)


@router.get("/", response_model=List[SupplierResponse])
def list_suppliers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lista todos los proveedores registrados con paginación.
    Requiere autenticación JWT.
    """
    return supplier_crud.get_suppliers(db, skip=skip, limit=limit)
