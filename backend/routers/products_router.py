from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from auth.security import get_current_user, get_current_admin_user
from models.model import User
from schemas.product_schema import ProductData, ProductResponse
from schemas.category_schema import CategoryResponse
from crud.crud_product import create_product, get_product, update_product, delete_product
from crud.category_crud import get_category

router = APIRouter(tags=["Products"])

@router.post("/create_products/", response_model=ProductResponse)
def create_product_db(product: ProductData, db: Session = Depends(get_db), admin_user: User = Depends(get_current_admin_user)):
    return create_product(db=db, product=product)


@router.get("/products/", response_model=list[ProductResponse])
def get_product_db(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_product(db=db, skip=skip, limit=limit)


@router.put("/update_products/{product_id}")
def edit_product_db(product_id: int, product: ProductData, db: Session = Depends(get_db), admin_user: User = Depends(get_current_admin_user)):
    db_product = update_product(db, product_id, product)
    if not db_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return db_product


@router.delete("/delete_product/{product_id}")
def delete_product_db(product_id: int, db: Session = Depends(get_db), admin_user: User = Depends(get_current_admin_user)):
    res = delete_product(db, product_id)
    if not res:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"deleted": res}
    

@router.get("/categories/", response_model=list[CategoryResponse])
def get_categories_db(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_category(db=db)
