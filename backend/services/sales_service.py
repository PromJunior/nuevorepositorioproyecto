from sqlalchemy.orm import Session
from datetime import datetime
import pytz

from models.model import Client, Product, PaymentMethod, Order
from schemas.order_schema import OrderCreate, OrderUpdate
from core.exceptions import (
    ClientNotFoundError,
    ProductNotFoundError,
    OutOfStockError,
    InsufficientStockError,
    InvalidPriceError,
    PaymentMethodNotFoundError,
    OrderNotFoundError
)
from crud import order_crud

PERU_TZ = pytz.timezone('America/Lima')

class SalesService:
    @staticmethod
    def create_order(db: Session, order_create: OrderCreate, user_id: int):
        # 1. Validar existencia del cliente
        client_db = db.query(Client).filter(Client.id == order_create.client_id).first()
        if not client_db:
            raise ClientNotFoundError(f"Cliente con id {order_create.client_id} no encontrado")

        # 2. Validar métodos de pago
        metodo_de_pago = db.query(PaymentMethod).filter(PaymentMethod.id == order_create.payment_method_id).first()
        if not metodo_de_pago:
            raise PaymentMethodNotFoundError(f"Método de pago con id {order_create.payment_method_id} no encontrado")

        # 3. Validar stock, stockProduct, y precios de cada ítem
        for item in order_create.items:
            product_db = db.query(Product).filter(Product.id == item.product_id).first()
            if not product_db:
                raise ProductNotFoundError(f"Producto con id {item.product_id} no encontrado")

            if not product_db.stockProduct or product_db.stock <= 0:
                raise OutOfStockError(f"Producto {product_db.name_product} sin stock disponible")

            if product_db.stock < item.quantity:
                raise InsufficientStockError(f"Stock insuficiente para el producto {product_db.name_product}")

            if item.price <= 0:
                raise InvalidPriceError(f"Precio inválido para el producto {product_db.name_product}")

        # 4. Delegar al CRUD para la persistencia transaccional limpia
        return order_crud.create_order_db_record(db=db, order_create=order_create, user_id=user_id)

    @staticmethod
    def update_order(db: Session, order_id: int, order_data: OrderUpdate):
        # 1. Validar existencia de la orden
        db_order = db.query(Order).filter(Order.id == order_id).first()
        if not db_order:
            raise OrderNotFoundError("La orden no existe")

        # 2. Validar existencia del cliente
        client_db = db.query(Client).filter(Client.id == order_data.client_id).first()
        if not client_db:
            raise ClientNotFoundError(f"Cliente con id {order_data.client_id} no encontrado")

        # 3. Validar stock disponible para la actualización
        # Para validar correctamente, sumamos temporalmente el stock original
        for olditem in db_order.order_items_order:
            product_db = db.query(Product).filter(Product.id == olditem.product_id).first()
            if product_db:
                product_db.stock += olditem.quantity

        try:
            for item in order_data.items:
                db_product = db.query(Product).filter(Product.id == item.product_id).first()
                if not db_product:
                    raise ProductNotFoundError(f"Producto con id {item.product_id} no encontrado")
                if db_product.stock < item.quantity:
                    raise InsufficientStockError(f"Stock insuficiente para el producto {db_product.name_product}")
                if item.price <= 0:
                    raise InvalidPriceError(f"Precio inválido para el producto {db_product.name_product}")
        finally:
            # Revertimos el stock sumado temporalmente para dejar que el CRUD transaccional maneje la persistencia limpia
            for olditem in db_order.order_items_order:
                product_db = db.query(Product).filter(Product.id == olditem.product_id).first()
                if product_db:
                    product_db.stock -= olditem.quantity

        # 4. Delegar al CRUD la actualización
        return order_crud.update_order_db_record(db=db, order_id=order_id, order_data=order_data)

    @staticmethod
    def delete_order(db: Session, order_id: int):
        # 1. Validar existencia de la orden
        db_order = db.query(Order).filter(Order.id == order_id).first()
        if not db_order:
            raise OrderNotFoundError("La orden no existe")

        # 2. Delegar la eliminación lógica/física al CRUD
        return order_crud.delete_order_db_record(db=db, order_id=order_id)

    @staticmethod
    def get_sales_report(db: Session, user_id: int = None):
        return order_crud.get_sales_report(db=db, user_id=user_id)
