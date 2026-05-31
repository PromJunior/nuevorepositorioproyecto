from sqlalchemy.orm import Session

from models.model import Client, PaymentMethod, Order, Product
from schemas.order_schema import OrderCreate, OrderUpdate
from core.exceptions import (
    ClientNotFoundError,
    ProductNotFoundError,
    InvalidPriceError,
    PaymentMethodNotFoundError,
    OrderNotFoundError,
    NoOpenCashSessionError,
)
from crud import order_crud
from crud.cash_session_crud import get_open_session_for_update
from crud.settings_crud import get_sales_settings


class SalesService:
    @staticmethod
    def create_order(db: Session, order_create: OrderCreate, user_id: int):
        settings = get_sales_settings(db)
        if order_create.client_id is None and settings.get("default_counter_client_id"):
            order_create.client_id = settings.get("default_counter_client_id")
        if order_create.payment_method_id is None and settings.get("default_payment_method_id"):
            order_create.payment_method_id = settings.get("default_payment_method_id")

        if order_create.discount_percent and not settings.get("allow_manual_discount", True):
            raise InvalidPriceError("El descuento manual no esta permitido.")
        max_discount = float(settings.get("max_discount_percent", 0) or 0)
        if float(order_create.discount_percent or 0) > max_discount:
            raise InvalidPriceError(f"El descuento supera el maximo permitido ({max_discount}%).")

        cash_session = get_open_session_for_update(db=db, user_id=user_id)
        if not cash_session:
            raise NoOpenCashSessionError(
                "No tienes una sesión de caja abierta. Abre caja primero para vender."
            )

        client_db = db.query(Client).filter(Client.id == order_create.client_id).first()
        if not client_db:
            raise ClientNotFoundError(
                f"Cliente con id {order_create.client_id} no encontrado"
            )

        metodo_de_pago = (
            db.query(PaymentMethod)
            .filter(PaymentMethod.id == order_create.payment_method_id)
            .first()
        )
        if not metodo_de_pago or not metodo_de_pago.is_active:
            raise PaymentMethodNotFoundError(
                f"Método de pago con id {order_create.payment_method_id} no encontrado"
            )

        for item in order_create.items:
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

            if item.price <= 0:
                raise InvalidPriceError(
                    f"Precio inválido para el producto {product_db.name_product}"
                )

        return order_crud.create_order_db_record(
            db=db,
            order_create=order_create,
            user_id=user_id,
            cash_session_id=cash_session.id,
        )

    @staticmethod
    def update_order(db: Session, order_id: int, order_data: OrderUpdate, user_id: int):
        db_order = db.query(Order).filter(Order.id == order_id).first()
        if not db_order:
            raise OrderNotFoundError("La orden no existe")

        client_db = db.query(Client).filter(Client.id == order_data.client_id).first()
        if not client_db:
            raise ClientNotFoundError(
                f"Cliente con id {order_data.client_id} no encontrado"
            )

        for item in order_data.items:
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
            if item.price <= 0:
                raise InvalidPriceError(
                    f"Precio inválido para el producto {db_product.name_product}"
                )

        return order_crud.update_order_db_record(
            db=db, order_id=order_id, order_data=order_data, user_id=user_id
        )

    @staticmethod
    def delete_order(db: Session, order_id: int, user_id: int):
        db_order = db.query(Order).filter(Order.id == order_id).first()
        if not db_order:
            raise OrderNotFoundError("La orden no existe")

        return order_crud.delete_order_db_record(
            db=db, order_id=order_id, user_id=user_id
        )

    @staticmethod
    def get_sales_report(db: Session, user_id: int = None):
        return order_crud.get_sales_report(db=db, user_id=user_id)
