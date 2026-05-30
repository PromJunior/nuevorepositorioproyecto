from decimal import Decimal

from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.orm import joinedload

from models.model import Order, OrderItem, Payment, Product
from schemas.order_schema import OrderCreate, OrderUpdate
from services.inventory_service import KardexService
from core.exceptions import NoOpenCashSessionError
from datetime import datetime
import pytz

PERU_TZ = pytz.timezone('America/Lima')


def _unit_cost_from_product(product: Product) -> Decimal:
    return Decimal(str(product.price))


def create_order_db_record(
    db: Session,
    order_create: OrderCreate,
    user_id: int,
    cash_session_id: int,
):
    if not cash_session_id:
        raise NoOpenCashSessionError(
            "No tienes una sesión de caja abierta. Abre caja primero para vender."
        )

    try:
        total_venta = Decimal("0")
        fecha_actual = datetime.now(PERU_TZ)

        new_order = Order(
            total_amount=0,
            order_date=fecha_actual,
            user_id=user_id,
            client_id=order_create.client_id,
            cash_session_id=cash_session_id,
        )
        db.add(new_order)
        db.flush()

        for item in order_create.items:
            product_db = (
                db.query(Product)
                .filter(Product.id == item.product_id)
                .with_for_update()
                .first()
            )
            if not product_db:
                from core.exceptions import ProductNotFoundError
                raise ProductNotFoundError(f"Producto con id {item.product_id} no encontrado")

            unit_cost = _unit_cost_from_product(product_db)
            KardexService.register_movement(
                db=db,
                product_id=item.product_id,
                user_id=user_id,
                type_name="SALIDA",
                concept="Venta",
                quantity=item.quantity,
                unit_cost=unit_cost,
                source_type="orders",
                source_id=new_order.id,
            )

            subamount = Decimal(str(item.quantity)) * Decimal(str(item.price))
            total_venta += subamount

            new_item = OrderItem(
                order_id=new_order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                price=item.price,
                sub_amount=subamount,
            )
            db.add(new_item)

        new_order.total_amount = total_venta

        new_payment = Payment(
            order_id=new_order.id,
            id_payment_method=order_create.payment_method_id,
            amount=total_venta,
        )
        db.add(new_payment)
        db.commit()
        db.refresh(new_order)
        return new_order

    except Exception as e:
        db.rollback()
        raise e


def get_order(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    user_id: int = None,
    payment_method_id: int = None,
):
    query = db.query(Order).options(
        joinedload(Order.client),
        joinedload(Order.order_items_order).joinedload(OrderItem.product),
        joinedload(Order.payment_order).joinedload(Payment.payment_method),
    )
    if user_id is not None:
        query = query.filter(Order.user_id == user_id)
    if payment_method_id is not None:
        query = query.join(Payment, Payment.order_id == Order.id).filter(
            Payment.id_payment_method == payment_method_id
        )
    return query.order_by(Order.id.desc()).offset(skip).limit(limit).all()


def update_order_db_record(db: Session, order_id: int, order_data: OrderUpdate, user_id: int):
    try:
        db_order = db.query(Order).filter(Order.id == order_id).first()
        if not db_order:
            from core.exceptions import OrderNotFoundError
            raise OrderNotFoundError("La orden no existe")

        for olditem in db_order.order_items_order:
            product_db = (
                db.query(Product)
                .filter(Product.id == olditem.product_id)
                .with_for_update()
                .first()
            )
            if product_db:
                KardexService.register_movement(
                    db=db,
                    product_id=olditem.product_id,
                    user_id=user_id,
                    type_name="ENTRADA",
                    concept="Reversión venta (edición orden)",
                    quantity=olditem.quantity,
                    unit_cost=Decimal(str(olditem.price)),
                    source_type="orders",
                    source_id=order_id,
                )

        db.query(OrderItem).filter(OrderItem.order_id == order_id).delete()

        total_amount = Decimal("0")
        for item in order_data.items:
            product_db = (
                db.query(Product)
                .filter(Product.id == item.product_id)
                .with_for_update()
                .first()
            )
            if not product_db:
                from core.exceptions import ProductNotFoundError
                raise ProductNotFoundError(f"Producto con id {item.product_id} no encontrado")

            unit_cost = _unit_cost_from_product(product_db)
            KardexService.register_movement(
                db=db,
                product_id=item.product_id,
                user_id=user_id,
                type_name="SALIDA",
                concept="Venta (edición orden)",
                quantity=item.quantity,
                unit_cost=unit_cost,
                source_type="orders",
                source_id=order_id,
            )

            sub_amount = Decimal(str(item.quantity)) * Decimal(str(item.price))
            total_amount += sub_amount

            new_order_item = OrderItem(
                order_id=order_id,
                product_id=item.product_id,
                quantity=item.quantity,
                price=item.price,
                sub_amount=sub_amount,
            )
            db.add(new_order_item)

        db_order.total_amount = total_amount
        db_order.client_id = order_data.client_id

        db_payment = db.query(Payment).filter(Payment.order_id == order_id).first()
        if db_payment:
            db_payment.amount = total_amount
            db_payment.id_payment_method = order_data.payment_method_id

        db.commit()
        db.refresh(db_order)
        return db_order
    except Exception as e:
        db.rollback()
        raise e


def delete_order_db_record(db: Session, order_id: int, user_id: int):
    try:
        db_order = db.query(Order).filter(Order.id == order_id).first()
        if not db_order:
            from core.exceptions import OrderNotFoundError
            raise OrderNotFoundError("La orden no existe")

        for item in db_order.order_items_order:
            KardexService.register_movement(
                db=db,
                product_id=item.product_id,
                user_id=user_id,
                type_name="ENTRADA",
                concept="Anulación venta",
                quantity=item.quantity,
                unit_cost=Decimal(str(item.price)),
                source_type="orders",
                source_id=order_id,
            )

        db.query(Payment).filter(Payment.order_id == order_id).delete()
        db.query(OrderItem).filter(OrderItem.order_id == order_id).delete()
        db.delete(db_order)
        db.commit()

        return {"message": "Orden eliminada con éxito y stock restaurado"}

    except Exception as e:
        db.rollback()
        raise e


def get_sales_report(db: Session, user_id: int = None):
    query = db.query(Order)
    if user_id is not None:
        query = query.filter(Order.user_id == user_id)

    total_orders = query.count()
    total_revenue = query.with_entities(func.sum(Order.total_amount)).scalar() or 0
    all_sales = query.all()

    return {
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "sales": all_sales,
    }
