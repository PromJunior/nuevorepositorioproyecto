from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from database.database import get_db
from auth.security import get_current_user, get_user_role_name, require_role
from models.model import User
from schemas.order_schema import OrderCreate, OrderResponse, OrderUpdate
from schemas.client_schema import (
    ClientCreate,
    ClientCrmSummary,
    ClientCrmRow,
    ClientFollowUpCreate,
    ClientFollowUpResponse,
    ClientFollowUpUpdate,
    ClientNoteCreate,
    ClientNoteResponse,
    ClientPurchaseHistoryResponse,
    ClientResponse,
    ClientSegmentStat,
    ClientStats,
    ClientUpdate,
    DniResponse,
)
from schemas.payment_method_schema import PaymentMethodResponse
from services.sales_service import SalesService
from services.apiperu_service import ApiPeruConfigError, ApiPeruRequestError, consult_dni_apiperu
from crud.client_crud import (
    create_client,
    deactivate_client,
    get_client_by_dni,
    get_client_by_email,
    get_client_by_id,
    get_client_purchase_history,
    get_client_stats,
    get_clients_crm_summary,
    get_clients,
    update_client,
)
from crud.payment_crud import get_payment_method
from crud import order_crud
from crud.crm_crud import (
    create_client_follow_up,
    create_client_note,
    get_client_crm_rows,
    get_client_follow_ups,
    get_client_notes,
    get_client_segment_stats,
    get_top_clients_crm,
    update_client_follow_up,
)

router = APIRouter(tags=["Sales & Clients"])

@router.post("/create_order/", response_model=OrderResponse)
def create_order_db(order: OrderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return SalesService.create_order(db=db, order_create=order, user_id=current_user.id)


@router.get("/order/", response_model=List[OrderResponse])
def get_order_db(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = None,
    payment_method_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = (current_user.role.name if current_user.role else "").lower()
    if role == "admin":
        return order_crud.get_order(db=db, skip=skip, limit=limit, user_id=user_id, payment_method_id=payment_method_id)
    elif role == "vendedor":
        return order_crud.get_order(db=db, skip=skip, limit=limit, user_id=current_user.id, payment_method_id=payment_method_id)
    
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
def get_clients_db(
    skip: int = 0,
    limit: int = 100,
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_clients(db=db, skip=skip, limit=limit, include_inactive=include_inactive)


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


@router.get("/clients/dni-local/{dni}", response_model=ClientResponse)
def get_client_by_dni_db(dni: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_client = get_client_by_dni(db=db, dni=dni)
    if not db_client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return db_client


@router.get("/clients/{client_id}", response_model=ClientResponse)
def get_client_db(client_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_client = get_client_by_id(db=db, client_id=client_id)
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


@router.get("/clients/stats/summary", response_model=ClientCrmSummary)
def get_clients_summary_db(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_clients_crm_summary(db=db)


@router.get("/clients/crm/segments", response_model=List[ClientSegmentStat])
def get_client_segments_db(
    segment: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    user_id: Optional[int] = None,
    payment_method_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    return get_client_segment_stats(
        db,
        segment=segment,
        date_from=date_from,
        date_to=date_to,
        user_id=effective_user_id,
        payment_method_id=payment_method_id,
    )


@router.get("/clients/crm/ranking", response_model=List[ClientCrmRow])
def get_client_ranking_db(
    metric: str = Query("amount", pattern="^(amount|orders|frequency)$"),
    limit: int = Query(10, ge=1, le=100),
    segment: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    user_id: Optional[int] = None,
    payment_method_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    return get_top_clients_crm(
        db,
        metric=metric,
        limit=limit,
        segment=segment,
        date_from=date_from,
        date_to=date_to,
        user_id=effective_user_id,
        payment_method_id=payment_method_id,
    )


@router.get("/clients/crm/list", response_model=List[ClientCrmRow])
def get_clients_crm_db(
    segment: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    user_id: Optional[int] = None,
    payment_method_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(500, ge=1, le=2000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = (get_user_role_name(current_user) or "").lower() == "admin"
    effective_user_id = user_id if is_admin else current_user.id
    _, rows = get_client_crm_rows(
        db,
        segment=segment,
        date_from=date_from,
        date_to=date_to,
        user_id=effective_user_id,
        payment_method_id=payment_method_id,
        skip=skip,
        limit=limit,
    )
    return rows


@router.put("/clients/{client_id}", response_model=ClientResponse)
def update_client_db(
    client_id: int,
    client: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    existing = get_client_by_id(db=db, client_id=client_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if client.email and client.email != existing.email:
        email_owner = get_client_by_email(db=db, email=client.email)
        if email_owner and email_owner.id != client_id:
            raise HTTPException(status_code=400, detail="Ya existe un cliente con este email")

    return update_client(db=db, client_id=client_id, client_data=client)


@router.delete("/clients/{client_id}", response_model=ClientResponse)
def deactivate_client_db(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    db_client = deactivate_client(db=db, client_id=client_id)
    if not db_client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return db_client


@router.get("/clients/{client_id}/stats", response_model=ClientStats)
def get_client_stats_db(client_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not get_client_by_id(db=db, client_id=client_id):
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return get_client_stats(db=db, client_id=client_id)


@router.get("/clients/{client_id}/notes", response_model=List[ClientNoteResponse])
def get_client_notes_db(client_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not get_client_by_id(db=db, client_id=client_id):
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return get_client_notes(db=db, client_id=client_id)


@router.post("/clients/{client_id}/notes", response_model=ClientNoteResponse, status_code=status.HTTP_201_CREATED)
def create_client_note_db(
    client_id: int,
    note: ClientNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not get_client_by_id(db=db, client_id=client_id):
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return create_client_note(db=db, client_id=client_id, user_id=current_user.id, note=note.note)


@router.get("/clients/{client_id}/follow-ups", response_model=List[ClientFollowUpResponse])
def get_client_follow_ups_db(client_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not get_client_by_id(db=db, client_id=client_id):
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return get_client_follow_ups(db=db, client_id=client_id)


@router.post("/clients/{client_id}/follow-ups", response_model=ClientFollowUpResponse, status_code=status.HTTP_201_CREATED)
def create_client_follow_up_db(
    client_id: int,
    follow_up: ClientFollowUpCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not get_client_by_id(db=db, client_id=client_id):
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return create_client_follow_up(db=db, client_id=client_id, user_id=current_user.id, data=follow_up)


@router.put("/clients/follow-ups/{follow_up_id}", response_model=ClientFollowUpResponse)
def update_client_follow_up_db(
    follow_up_id: int,
    follow_up: ClientFollowUpUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = update_client_follow_up(db=db, follow_up_id=follow_up_id, data=follow_up)
    if not updated:
        raise HTTPException(status_code=404, detail="Seguimiento no encontrado")
    return {
        "id": updated.id,
        "client_id": updated.client_id,
        "next_contact_at": updated.next_contact_at,
        "status": updated.status,
        "comment": updated.comment,
        "username": updated.user.username if updated.user else None,
        "created_at": updated.created_at,
        "updated_at": updated.updated_at,
    }


@router.get("/clients/{client_id}/purchase-history", response_model=ClientPurchaseHistoryResponse)
def get_client_purchase_history_db(
    client_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    payment_method_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not get_client_by_id(db=db, client_id=client_id):
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return get_client_purchase_history(
        db=db,
        client_id=client_id,
        skip=skip,
        limit=limit,
        payment_method_id=payment_method_id,
    )


@router.get("/payment_methods/", response_model=list[PaymentMethodResponse])
def get_payment_methods_db(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_payment_method(db=db)
