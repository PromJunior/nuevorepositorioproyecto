from sqlalchemy.orm import Session 
from sqlalchemy import func
from models.model import Client, Order, OrderItem, Payment, PaymentMethod, Product
from schemas.order_schema import OrderCreate, OrderUpdate
from datetime import datetime
import pytz
from sqlalchemy.orm import joinedload

PERU_TZ = pytz.timezone('America/Lima')

def create_order_db_record(db: Session, order_create: OrderCreate, user_id: int):
    try:
        total_venta = 0
        fecha_actual = datetime.now(PERU_TZ)

        new_order = Order(
            total_amount=0,
            order_date=fecha_actual,
            user_id=user_id,
            client_id=order_create.client_id,
        )
        db.add(new_order)
        db.flush()

        for item in order_create.items:
            product_db = db.query(Product).filter(Product.id == item.product_id).first()
            
            subamount = item.quantity * item.price
            total_venta += subamount

            new_item = OrderItem(
                order_id=new_order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                price=item.price,
                sub_amount=subamount
            )
            db.add(new_item)

            product_db.stock -= item.quantity
            product_db.stockProduct = product_db.stock > 0

        new_order.total_amount = total_venta

        new_payment = Payment(
            order_id=new_order.id,
            id_payment_method=order_create.payment_method_id,
            amount=total_venta
        )
        db.add(new_payment)
        db.commit()
        db.refresh(new_order)
        return new_order

    except Exception as e:
        db.rollback()
        raise e


def get_order(db: Session, skip: int = 0, limit: int = 100, user_id: int = None):
    query = db.query(Order).options(joinedload(Order.client))
    if user_id is not None:
        query = query.filter(Order.user_id == user_id)
    return query.order_by(Order.id).offset(skip).limit(limit).all()


def update_order_db_record(db: Session, order_id: int, order_data: OrderUpdate):
    try:
        db_order = db.query(Order).filter(Order.id == order_id).first()
        
        # 1. Devolver el stock anterior
        for olditem in db_order.order_items_order:
            product_db = db.query(Product).filter(Product.id == olditem.product_id).first()
            if product_db:
                product_db.stock += olditem.quantity
                product_db.stockProduct = True

        # 2. Eliminar ítems anteriores
        db.query(OrderItem).filter(OrderItem.order_id == order_id).delete()

        # 3. Insertar nuevos ítems y actualizar stock
        total_amount = 0
        for item in order_data.items:
            db_product = db.query(Product).filter(Product.id == item.product_id).first()
            
            sub_amount = item.quantity * item.price
            total_amount += sub_amount

            new_order_item = OrderItem(
                order_id=order_id,
                product_id=item.product_id,
                quantity=item.quantity,
                price=item.price,
                sub_amount=sub_amount
            )
            db.add(new_order_item)

            db_product.stock -= item.quantity
            db_product.stockProduct = db_product.stock > 0

        # 4. Actualizar cabecera de la orden y pago
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


def delete_order_db_record(db: Session, order_id: int):
    try:
        db_order = db.query(Order).filter(Order.id == order_id).first()
        
        # Restaurar stock antes de eliminar
        for item in db_order.order_items_order:
            product_db = db.query(Product).filter(Product.id == item.product_id).first()
            if product_db:
                product_db.stock += item.quantity
                product_db.stockProduct = True

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
    total_revenue = (query.with_entities(func.sum(Order.total_amount)).scalar() or 0)
    all_sales = query.all()

    return {
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "sales": all_sales
    }