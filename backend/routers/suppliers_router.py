from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db
from auth.security import get_current_user
from models.model import User
from schemas.supplier_schema import SupplierCreate, SupplierUpdate, SupplierResponse, RucResponse
from crud import supplier_crud
from validators.supplier_validator import validate_ruc_format
from services.apiperu_service import consult_ruc_apiperu, ApiPeruConfigError, ApiPeruRequestError

router = APIRouter(prefix="/suppliers", tags=["Suppliers / Proveedores"])


# ─── Buscar RUC en base de datos LOCAL (sin llamar ApiPeru) ──────────────────
@router.get("/ruc-local/{ruc}", response_model=SupplierResponse)
def get_supplier_by_ruc_local(
    ruc: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Busca un proveedor por RUC en la BD local — NO llama a ApiPeru."""
    validate_ruc_format(ruc)
    supplier = supplier_crud.get_supplier_by_ruc(db, ruc=ruc)
    if not supplier:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado localmente")
    return supplier


# ─── Consultar RUC via ApiPeru ────────────────────────────────────────────────
@router.get("/ruc/{ruc}", response_model=RucResponse)
async def consult_supplier_ruc(
    ruc: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Consulta datos del RUC en ApiPeruDev. Solo cuando no está en la BD."""
    validate_ruc_format(ruc)
    try:
        data = await consult_ruc_apiperu(ruc)
    except ApiPeruConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except ApiPeruRequestError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    return RucResponse(
        ruc=data.get("numero", ruc),
        company_name=data.get("razon_social", ""),
        address=data.get("direccion_completa") or data.get("direccion"),
        state=data.get("estado"),
        condition=data.get("condicion"),
        ubigeo=" - ".join(filter(None, data.get("ubigeo", [])))
        if isinstance(data.get("ubigeo"), list)
        else data.get("ubigeo", ""),
        departamento=data.get("departamento"),
        provincia=data.get("provincia"),
        distrito=data.get("distrito"),
    )


# ─── Crear proveedor ──────────────────────────────────────────────────────────
@router.post("/", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(
    supplier: SupplierCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    validate_ruc_format(supplier.ruc)
    if supplier_crud.get_supplier_by_ruc(db, ruc=supplier.ruc):
        raise HTTPException(
            status_code=409,
            detail=f"El proveedor con RUC {supplier.ruc} ya está registrado.",
        )
    return supplier_crud.create_supplier_db_record(db, supplier=supplier)


# ─── Listar proveedores ───────────────────────────────────────────────────────
@router.get("/", response_model=List[SupplierResponse])
def list_suppliers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return supplier_crud.get_suppliers(db, skip=skip, limit=limit)


# ─── Obtener proveedor por ID ─────────────────────────────────────────────────
@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    supplier = supplier_crud.get_supplier(db, supplier_id=supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return supplier


# ─── Actualizar proveedor ─────────────────────────────────────────────────────
@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: int,
    data: SupplierUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    supplier = supplier_crud.update_supplier(db, supplier_id=supplier_id, data=data)
    if not supplier:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return supplier
