from sqlalchemy.orm import Session
from models.model import Client

def get_client_by_dni(db:Session ,dni: str):
    return db.query(Client).filter(Client.dni == dni).first()

def get_client_by_email(db: Session, email: str):
    return db.query(Client).filter(Client.email == email).first()

def get_clients(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Client).order_by(Client.id).offset(skip).limit(limit).all()

def create_client(db:Session, client_data):
    db_client = Client(
        dni=client_data.dni,
        full_name=client_data.full_name,
        address=client_data.address,
        phone=client_data.phone,
        email=client_data.email
    )
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client