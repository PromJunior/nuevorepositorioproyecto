from sqlalchemy.orm import Session

from schemas.purchase_schema import PurchaseCreate
from core.exceptions import ProductNotFoundError, InvalidPriceError
from models.model import Product, Supplier
from crud import purchase_crud


class PurchaseService:
    @staticmethod
    def create_purchase(db: Session, purchase_create: PurchaseCreate, user_id: int):
        """Crea una compra en estado BORRADOR (sin afectar stock)."""
        if not purchase_create.items:
            raise ValueError("La compra debe incluir al menos un ítem")

        supplier = db.query(Supplier).filter(Supplier.id == purchase_create.supplier_id).first()
        if not supplier:
            raise ValueError(f"Proveedor con id {purchase_create.supplier_id} no encontrado")

        for item in purchase_create.items:
            product_db = (
                db.query(Product)
                .filter(Product.id == item.product_id)
                .first()
            )
            if not product_db:
                raise ProductNotFoundError(f"Producto con id {item.product_id} no encontrado")
            if item.unit_cost <= 0:
                raise InvalidPriceError(
                    f"Costo unitario inválido para el producto {product_db.name_product}"
                )

        return purchase_crud.create_purchase_draft(
            db=db, purchase_create=purchase_create, user_id=user_id
        )

    @staticmethod
    def list_purchases(db: Session, skip: int = 0, limit: int = 100):
        return purchase_crud.get_purchases(db=db, skip=skip, limit=limit)
