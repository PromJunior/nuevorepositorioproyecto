import datetime
from http.client import HTTPException
from itertools import product

from sqlalchemy.orm import Session

from models.model import OrderItem, Product
from schemas.product_schema import ProductData, ProductResponse

def create_product(db:Session , product: ProductData):
    db_product = Product(
        name_product = product.name_product,
        price = product.price,
        description = product.description,
        stock = product.stock,
        category_id = product.category_id,
        stockProduct = True if product.stock >=1 else False
    )
    try:
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
    except Exception as e:
        db.rollback()
        raise e
    return db_product


def get_product(db:Session, skip: int = 0, limit: int = 100):
    product = db.query(Product).order_by(Product.id).offset(skip).limit(limit).all()
    for p in product:
        p.category_name = p.category.name_category if p.category else None

    return product

def update_product(db: Session, product_id: int, product_data: ProductData):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    
    if db_product:
        # Convertimos el esquema a diccionario
        update_data = product_data.model_dump() 
        
        for key, value in update_data.items():
            # CAMBIO CLAVE: Solo ignoramos si el valor es estrictamente None
            # Esto permite que el 0 y el False pasen correctamente
            if value is not None:
                setattr(db_product, key, value)
        
        # Recalculamos el booleano basado en el nuevo stock
        db_product.stockProduct = db_product.stock > 0
        
        db.commit()
        db.refresh(db_product)
        
    return db_product

def delete_product(db:Session, product_id: int):
    product= db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return None  
      
    product.is_active = False
    product.delete_at = datetime.utcnow()

    db.commit()
    db.refresh(product)
    return product
    


