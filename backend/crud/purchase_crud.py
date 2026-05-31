from decimal import Decimal

from sqlalchemy.orm import Session, joinedload

from models.model import Purchase, PurchaseItem, PurchaseStatus, Product
from schemas.purchase_schema import PurchaseCreate, PurchaseDetailResponse, PurchaseItemFull, SupplierInfo, PurchaseStatusInfo
from services.inventory_service import KardexService
from core.exceptions import ProductNotFoundError
from crud.settings_crud import get_fiscal_settings, next_document_number


# ─── Helpers ─────────────────────────────────────────────────────────────────
def _get_status_by_name(db: Session, name: str) -> PurchaseStatus:
    s = db.query(PurchaseStatus).filter(PurchaseStatus.name_status == name).first()
    if not s:
        # Si no existe aún (primer arranque antes del seed), lo creamos inline
        s = PurchaseStatus(name_status=name)
        db.add(s)
        db.flush()
    return s


def _build_detail(purchase: Purchase) -> dict:
    """Convierte un ORM Purchase en dict para PurchaseDetailResponse."""
    items = []
    for it in purchase.purchase_items:
        items.append(PurchaseItemFull(
            id=it.id,
            product_id=it.product_id,
            product_name=it.product.name_product if it.product else None,
            quantity=it.quantity,
            unit_cost=it.unit_cost,
            sub_amount=it.sub_amount,
        ))

    supplier_info = None
    if purchase.supplier:
        supplier_info = SupplierInfo(
            id=purchase.supplier.id,
            ruc=purchase.supplier.ruc,
            company_name=purchase.supplier.company_name,
        )

    status_info = None
    if purchase.status:
        status_info = PurchaseStatusInfo(
            id=purchase.status.id,
            name_status=purchase.status.name_status,
        )

    return PurchaseDetailResponse(
        id=purchase.id,
        purchase_date=purchase.purchase_date,
        document_number=purchase.document_number,
        invoice_number=purchase.invoice_number,
        subtotal_amount=purchase.subtotal_amount or 0,
        tax_amount=purchase.tax_amount or 0,
        igv_percent=purchase.igv_percent or 0,
        total_amount=purchase.total_amount,
        supplier_id=purchase.supplier_id,
        supplier=supplier_info,
        user_id=purchase.user_id,
        username=purchase.user.username if purchase.user else None,
        status=status_info,
        items=items,
    )


def _full_query(db: Session):
    return (
        db.query(Purchase)
        .options(
            joinedload(Purchase.supplier),
            joinedload(Purchase.user),
            joinedload(Purchase.status),
            joinedload(Purchase.purchase_items).joinedload(PurchaseItem.product),
        )
    )


# ─── Crear compra en estado BORRADOR (sin afectar stock) ─────────────────────
def create_purchase_draft(db: Session, purchase_create: PurchaseCreate, user_id: int) -> Purchase:
    try:
        borrador = _get_status_by_name(db, "BORRADOR")
        subtotal_amount = Decimal("0")
        fiscal = get_fiscal_settings(db)
        igv_percent = Decimal(str(fiscal.get("igv_percent", 18)))
        document_number = next_document_number(db, "purchase")

        new_purchase = Purchase(
            supplier_id=purchase_create.supplier_id,
            user_id=user_id,
            document_number=document_number,
            invoice_number=purchase_create.invoice_number,
            subtotal_amount=0,
            tax_amount=0,
            igv_percent=igv_percent,
            total_amount=0,
            status_id=borrador.id,
        )
        db.add(new_purchase)
        db.flush()

        for item in purchase_create.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if not product:
                raise ProductNotFoundError(f"Producto con id {item.product_id} no encontrado")

            unit_cost = Decimal(str(item.unit_cost))
            sub_amount = Decimal(str(item.quantity)) * unit_cost
            subtotal_amount += sub_amount

            db.add(PurchaseItem(
                purchase_id=new_purchase.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_cost=unit_cost,
                sub_amount=sub_amount,
            ))

        tax_amount = (subtotal_amount * igv_percent / Decimal("100")).quantize(Decimal("0.01"))
        new_purchase.subtotal_amount = subtotal_amount
        new_purchase.tax_amount = tax_amount
        new_purchase.total_amount = subtotal_amount + tax_amount
        db.commit()
        db.refresh(new_purchase)

        return _full_query(db).filter(Purchase.id == new_purchase.id).first()

    except Exception as e:
        db.rollback()
        raise e


# ─── Recibir compra → afecta stock y crea Kardex ENTRADA ────────────────────
def receive_purchase(db: Session, purchase_id: int, user_id: int) -> Purchase:
    purchase = (
        db.query(Purchase)
        .options(joinedload(Purchase.status), joinedload(Purchase.purchase_items))
        .filter(Purchase.id == purchase_id)
        .first()
    )
    if not purchase:
        raise ValueError("Compra no encontrada")

    status_name = purchase.status.name_status if purchase.status else None
    if status_name != "BORRADOR":
        raise ValueError(f"Solo se pueden recibir compras en BORRADOR. Estado actual: {status_name}")

    recibida = _get_status_by_name(db, "RECIBIDA")

    for item in purchase.purchase_items:
        product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
        if not product:
            raise ProductNotFoundError(f"Producto con id {item.product_id} no encontrado")

        KardexService.register_movement(
            db=db,
            product_id=item.product_id,
            user_id=user_id,
            type_name="ENTRADA",
            concept="Compra a proveedor",
            quantity=item.quantity,
            unit_cost=item.unit_cost,
            source_type="purchases",
            source_id=purchase.id,
        )

    purchase.status_id = recibida.id
    db.commit()
    db.refresh(purchase)

    return _full_query(db).filter(Purchase.id == purchase_id).first()


# ─── Cancelar compra BORRADOR (no revierte stock) ────────────────────────────
def cancel_purchase(db: Session, purchase_id: int) -> Purchase:
    purchase = (
        db.query(Purchase)
        .options(joinedload(Purchase.status))
        .filter(Purchase.id == purchase_id)
        .first()
    )
    if not purchase:
        raise ValueError("Compra no encontrada")

    status_name = purchase.status.name_status if purchase.status else None
    if status_name != "BORRADOR":
        raise ValueError(f"Solo se pueden cancelar compras en BORRADOR. Estado actual: {status_name}")

    cancelada = _get_status_by_name(db, "CANCELADA")
    purchase.status_id = cancelada.id
    db.commit()
    db.refresh(purchase)

    return _full_query(db).filter(Purchase.id == purchase_id).first()


# ─── Obtener por ID con detalle completo ─────────────────────────────────────
def get_purchase_by_id(db: Session, purchase_id: int):
    purchase = _full_query(db).filter(Purchase.id == purchase_id).first()
    if not purchase:
        return None
    return _build_detail(purchase)


# ─── Listar compras ───────────────────────────────────────────────────────────
def get_purchases(db: Session, skip: int = 0, limit: int = 100):
    return (
        _full_query(db)
        .order_by(Purchase.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


# ─── Compatibilidad con código anterior ─────────────────────────────────────
# Se mantiene para no romper imports existentes. Llama a create_purchase_draft.
def create_purchase_db_record(db: Session, purchase_create: PurchaseCreate, user_id: int):
    return create_purchase_draft(db=db, purchase_create=purchase_create, user_id=user_id)
