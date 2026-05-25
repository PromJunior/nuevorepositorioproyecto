from sqlalchemy.orm import Session
from models.model import User, Roles
from auth.security import get_password_hash

def create_initial_admin(db: Session):

    existing_user = db.query(User).first()
# es la linea principal que verifica si existe un usuario
    if existing_user:
        return
# es la linea principal que busca si existe un rol admin
    admin_role = db.query(Roles).filter(
        Roles.name == "admin"
    ).first()
# es la linea principal que verifica si existe un rol admin
    if not admin_role:
        admin_role = Roles(name="admin")
        db.add(admin_role)
        db.commit()
        db.refresh(admin_role)
    # es la linea principal que crea un usuario admin
    admin_user = User(
        username="admin",
        fullname="Luis Alvarez Julca",
        hashed_password=get_password_hash("123456"),
        id_role=admin_role.id,
        is_active=True
    )

    db.add(admin_user)
    db.commit()

    print("ADMIN INICIAL CREADO")