from sqlalchemy.orm import Session 
from sqlalchemy import func
from models.model import Client, Order, OrderItem, Payment, PaymentMethod, Product
from schemas.order_schema import ProductNombre, OrderItemCreate, OrderResponse, OrderCreate, OrderUpdate
from datetime import datetime
import pytz
from sqlalchemy.orm import joinedload

from fastapi import HTTPException

PERU_TZ = pytz.timezone('America/Lima')

def create_order(db:Session, order_create: OrderCreate, user_id: int):
    try:
        total_venta=0
        fecha_actual = datetime.now(PERU_TZ)
        client_db = db.query(Client).filter(Client.id == order_create.client_id).first()
        if not client_db:
            raise HTTPException(status_code=404, detail=f"Cliente con id {order_create.client_id} no encontrado")

        new_order = Order(
            total_amount=0,
            order_date=fecha_actual,
            user_id = user_id,
            client_id = order_create.client_id,
        )
        db.add(new_order)
        db.flush()
        for item in order_create.items:
            product_db = db.query(Product).filter(Product.id==item.product_id).first()
            if not product_db:
                raise HTTPException(status_code=404, detail=f"Producto con id {item.product_id} no encontrado")

            if product_db.stockProduct == False:
                raise HTTPException(status_code=400, detail=f"Producto {product_db.name_product} sin stock disponible")

            if product_db.stock < item.quantity:
                raise HTTPException(status_code=400, detail=f"Stock insuficiente para el producto {product_db.name_product}")
            
            if item.price <= 0:
                raise HTTPException(status_code=400, detail=f"Precio inválido para el producto {product_db.name_product}")

            subamount = item.quantity * item.price
            total_venta += subamount


            new_item = OrderItem(
                order_id = new_order.id,
                product_id = item.product_id,
                quantity = item.quantity,
                price = item.price,
                sub_amount = subamount

            )
            db.add(new_item)

            product_db.stock -= item.quantity
            product_db.stockProduct = product_db.stock > 0

            
        new_order.total_amount = total_venta

        metodo_de_pago = db.query(PaymentMethod).filter(PaymentMethod.id == order_create.payment_method_id).first()
        if not metodo_de_pago:
            raise HTTPException(status_code=400, detail=f"Método de pago con id {order_create.payment_method_id} no encontrado")

        new_payment = Payment(
            order_id= new_order.id,
            id_payment_method = order_create.payment_method_id,
            amount = total_venta
        )
        db.add(new_payment)
        db.commit()
        db.refresh(new_order)
        return new_order

    
    except Exception as e:
        db.rollback()
        raise e


def get_order (db:Session, skip: int = 0, limit: int = 100):
    lista_de_ventas= db.query(Order).options(joinedload(Order.client)).order_by(Order.id).offset(skip).limit(limit).all()
    return lista_de_ventas



def update_order(db:Session, order_id:int, order_data: OrderUpdate):
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        return None

    client_db = db.query(Client).filter(Client.id == order_data.client_id).first()
    if not client_db:
        raise HTTPException(status_code=404, detail=f"Cliente con id {order_data.client_id} no encontrado")


    
    try:
        for olditem in db_order.order_items_order:
            product_db = db.query(Product).filter(Product.id == olditem.product_id).first()
            if product_db:
                product_db.stock += olditem.quantity
                product_db.stockProduct = True

        db.query(OrderItem).filter(OrderItem.order_id == order_id).delete()

        total_amount = 0
        for item in order_data.items:
            db_product = db.query(Product).filter(Product.id == item.product_id).first()
            if not db_product or db_product.stock < item.quantity:
                raise HTTPException(status_code=400, detail=f"Producto con id {item.product_id} no encontrado o stock insuficiente")
            
            sub_amount = item.quantity * item.price
            total_amount += sub_amount

            new_order_item = OrderItem(
                order_id = order_id,
                product_id = item.product_id,
                quantity = item.quantity,
                price = item.price,
                sub_amount = sub_amount
            )
            db.add(new_order_item)

            db_product.stock -= item.quantity
            db_product.stockProduct = db_product.stock > 0

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
        raise HTTPException(status_code=500, detail=str(e))

def delete_order(db: Session, order_id: int):
    
    db_order = db.query(Order).filter(Order.id == order_id).first()

    
    if not db_order:
        raise HTTPException(status_code=404, detail="La orden no existe")

    try:
        
        for item in db_order.order_items_order:
           
            product_db = db.query(Product).filter(Product.id == item.product_id).first()
            
            if product_db:
            
                product_db.stock += item.quantity
                
               
                if product_db.stock > 0:
                    product_db.stockProduct = True

        
        db.query(Payment).filter(Payment.order_id == order_id).delete()
        db.query(OrderItem).filter(OrderItem.order_id == order_id).delete()

       
        db.delete(db_order)
        
       
        db.commit()
        
        return {"message": "Orden eliminada con éxito y stock restaurado"}

    except Exception as e:
        db.rollback()
        raise e
    

# obtener el reporte de ventas totales y por usuario
    
def get_sales_report(db: Session, user_id: int = None):

    query = db.query(Order)
    #filrear por usuario si no es admin
    if user_id is not None:
        query=query.filter(Order.user_id==user_id)
    #cuenta el total de ventas y el total de ingresos    
    total_orders = query.count()
    total_revenue = (query.with_entities(func.sum(Order.total_amount)).scalar() or 0 )

    all_sales = query.all()

    return {
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "sales": all_sales
    }