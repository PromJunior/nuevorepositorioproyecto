from sqlalchemy.orm import Session, joinedload
from models.model import Roles, User
from schemas.user_schema import UserUpdate, RoleCreate
# MEJORA 2: Importamos las funciones de encriptación centralizadas de security.py
from auth.password import get_password_hash

# ==============================================================================
# ===                            CRUD DE ROLES                               ===
# ==============================================================================

def get_role_by_id(db: Session, role_id: int):
    return db.query(Roles).filter(Roles.id == role_id).first()


def get_role_by_name(db: Session, role_name: str):
    return db.query(Roles).filter(Roles.name == role_name).first()


def get_all_roles(db: Session):
    return db.query(Roles).order_by(Roles.id.asc()).all()


def create_role(db: Session, role_data: RoleCreate):
    # Estandarizamos el almacenamiento en minúsculas y sin espacios muertos
    db_role = Roles(name=role_data.name.lower().strip())
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role


def delete_role_physical(db: Session, role_id: int):
    db_role = db.query(Roles).filter(Roles.id == role_id).first()
    if db_role:
        db.delete(db_role)
        db.commit()
    return db_role


def resolve_role(db: Session, role_name=None, role_id=None):
    if role_id is not None:
        return get_role_by_id(db, role_id)
    if role_name:
        return get_role_by_name(db, role_name.lower().strip())
    return None


#  RUD DE USUARIOS                             

def get_user_by_username(db: Session, username: str):
    return (
        db.query(User)
        .options(joinedload(User.role))
        .filter(User.username == username)
        .first()
    )


def create_user(db: Session, user_data):
    # Encriptación usando la función importada centralizadamente
    hashed_pwd = get_password_hash(user_data.password)
    role = resolve_role(
        db,
        role_name=user_data.role,
        role_id=getattr(user_data, "id_role", None),
    )
    if role is None:
        raise ValueError("El rol indicado no existe")

    db_user = User(
        username=user_data.username,
        fullname=user_data.fullname,
        hashed_password=hashed_pwd,
        id_role=role.id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_all_users(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(User)
        .options(joinedload(User.role))
        .order_by(User.id.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_user(db: Session, user_id: int, user_data: UserUpdate):
    db_user = db.query(User).filter(User.id == user_id).first()
    
    if db_user:
        # Extraemos solo los campos que el cliente envió en el JSON
        update_data = user_data.model_dump(exclude_unset=True)
        
        # 1. Resolución y actualización de Roles si vienen en el payload
        if "role" in update_data or "id_role" in update_data:
            role = resolve_role(
                db,
                role_name=update_data.pop("role", None),
                role_id=update_data.pop("id_role", None),
            )
            if role is None:
                raise ValueError("El rol indicado no existe")
            db_user.id_role = role.id
            
        # MEJORA 1: Intercepción y cambio de contraseña de manera segura
        if "password" in update_data:
            plain_password = update_data.pop("password")
            if plain_password and plain_password.strip():
                # Encriptamos la contraseña en texto plano antes de persistirla
                db_user.hashed_password = get_password_hash(plain_password)

        # 2. Asignación del resto de campos mutables (fullname, is_active, etc.)
        for key, value in update_data.items():
            setattr(db_user, key, value)
            
        db.commit()
        db.refresh(db_user)
        
    return db_user


def deactivate_user(db: Session, user_id: int):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user:
        db_user.is_active = False
        db.commit()
        db.refresh(db_user)
    return db_user