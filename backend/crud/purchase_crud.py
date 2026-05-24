from decimal import Decimal

from sqlalchemy.orm import Session, joinedload

from models.model import Purchase, PurchaseItem, Product
from schemas.purchase_schema import PurchaseCreate
from services.inventory_service import KardexService
from core.exceptions import ProductNotFoundError


def create_purchase_db_record(db: Session, purchase_create: PurchaseCreate, user_id: int):
    try:
        total_amount = Decimal("0")
        new_purchase = Purchase(
            supplier_id=purchase_create.supplier_id,
            user_id=user_id,
            invoice_number=purchase_create.invoice_number,
            total_amount=0,
        )
        db.add(new_purchase)
        db.flush()

        for item in purchase_create.items:
            product_db = (
                db.query(Product)
                .filter(Product.id == item.product_id)
                .with_for_update()
                .first()
            )
            if not product_db:
                raise ProductNotFoundError(
                    f"Producto con id {item.product_id} no encontrado"
                )

            unit_cost = Decimal(str(item.unit_cost))
            KardexService.register_movement(
                db=db,
                product_id=item.product_id,
                user_id=user_id,
                type_name="ENTRADA",
                concept="Compra Proveedor",
                quantity=item.quantity,
                unit_cost=unit_cost,
                source_type="purchases",
                source_id=new_purchase.id,
            )

            sub_amount = Decimal(str(item.quantity)) * unit_cost
            total_amount += sub_amount

            db.add(
                PurchaseItem(
                    purchase_id=new_purchase.id,
                    product_id=item.product_id,
                    quantity=item.quantity,
                    unit_cost=unit_cost,
                    sub_amount=sub_amount,
                )
            )

        new_purchase.total_amount = total_amount
        db.commit()
        db.refresh(new_purchase)
        return (
            db.query(Purchase)
            .options(joinedload(Purchase.purchase_items))
            .filter(Purchase.id == new_purchase.id)
            .first()
        )

    except Exception as e:
        db.rollback()
        raise e


def get_purchases(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(Purchase)
        .options(joinedload(Purchase.purchase_items))
        .order_by(Purchase.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
