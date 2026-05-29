from sqlalchemy.orm import Session
from models.model import Supplier
from schemas.supplier_schema import SupplierCreate, SupplierUpdate


def get_supplier(db: Session, supplier_id: int):
    return db.query(Supplier).filter(Supplier.id == supplier_id).first()


def get_supplier_by_ruc(db: Session, ruc: str):
    return db.query(Supplier).filter(Supplier.ruc == ruc).first()


def get_suppliers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Supplier).order_by(Supplier.id.desc()).offset(skip).limit(limit).all()


def create_supplier_db_record(db: Session, supplier: SupplierCreate):
    try:
        new_supplier = Supplier(
            ruc=supplier.ruc,
            company_name=supplier.company_name,
            phone=supplier.phone,
            email=supplier.email,
        )
        db.add(new_supplier)
        db.commit()
        db.refresh(new_supplier)
        return new_supplier
    except Exception as e:
        db.rollback()
        raise e


def update_supplier(db: Session, supplier_id: int, data: SupplierUpdate):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        return None
    if data.company_name is not None:
        supplier.company_name = data.company_name
    if data.phone is not None:
        supplier.phone = data.phone
    if data.email is not None:
        supplier.email = data.email
    db.commit()
    db.refresh(supplier)
    return supplier
