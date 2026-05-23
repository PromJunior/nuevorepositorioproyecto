from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload

from models.model import Category, Product
from schemas.category_schema import CategoryData, CategoryResponse

def get_category(db:Session):
    return db.query(Product).options(joinedload(Product.category)).all()

def create_category(db: Session, category: CategoryData):
    db_category = Category(name_category=category.name_category)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def update_category(db: Session, category_id: int, category_data: CategoryData):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if db_category:
        db_category.name_category = category_data.name_category
        db.commit()
        db.refresh(db_category)
    return db_category

def delete_category(db: Session, category_id: int):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if db_category:
        db.delete(db_category)
        db.commit()
        return True
    return False


