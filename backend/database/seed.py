from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from models.model import PaymentMethod, User, Roles, PurchaseStatus
from auth.security import get_password_hash
from crud.settings_crud import (
    DEFAULT_PAYMENT_METHODS,
    seed_default_payment_methods,
)


def ensure_payment_method_columns(db: Session):
    inspector = inspect(db.bind)

    if "payment_methods" not in inspector.get_table_names():
        return

    columns = {
        column["name"]
        for column in inspector.get_columns("payment_methods")
    }

    if "display_order" not in columns:
        db.execute(
            text("""
                ALTER TABLE payment_methods
                ADD display_order INT DEFAULT 0
            """)
        )
        db.commit()


def ensure_settings_integration_columns(db: Session):
    inspector = inspect(db.bind)

    tables = inspector.get_table_names()

    table_columns = {
        table: {
            column["name"]
            for column in inspector.get_columns(table)
        }
        for table in ("orders", "purchases")
        if table in tables
    }

    column_sql = {
        "document_number": "VARCHAR(50)",
        "subtotal_amount": "NUMERIC(10,2) DEFAULT 0",
        "tax_amount": "NUMERIC(10,2) DEFAULT 0",
        "igv_percent": "NUMERIC(5,2) DEFAULT 18",
    }

    for table, columns in table_columns.items():

        for column_name, column_type in column_sql.items():

            if column_name not in columns:
                db.execute(
                    text(
                        f"ALTER TABLE {table} "
                        f"ADD {column_name} {column_type}"
                    )
                )

        if table == "orders" and "discount_amount" not in columns:
            db.execute(
                text("""
                    ALTER TABLE orders
                    ADD discount_amount NUMERIC(10,2) DEFAULT 0
                """)
            )

    db.commit()


def create_initial_admin(db: Session):

    for role_name in ("admin", "vendedor", "supervisor"):

        if not db.query(Roles).filter(
            Roles.name == role_name
        ).first():
            db.add(Roles(name=role_name))

    db.commit()

    existing_user = db.query(User).first()

    if existing_user:
        return

    admin_role = db.query(Roles).filter(
        Roles.name == "admin"
    ).first()

    if not admin_role:
        admin_role = Roles(name="admin")
        db.add(admin_role)
        db.commit()
        db.refresh(admin_role)

    admin_user = User(
        username="admin",
        fullname="Luis Alvarez Julca",
        hashed_password=get_password_hash("123456"),
        id_role=admin_role.id,
        is_active=True,
    )

    db.add(admin_user)
    db.commit()

    print("ADMIN INICIAL CREADO")


PURCHASE_STATUSES = [
    "BORRADOR",
    "RECIBIDA",
    "CANCELADA",
]


def seed_purchase_statuses(db: Session):

    for name in PURCHASE_STATUSES:

        exists = (
            db.query(PurchaseStatus)
            .filter(PurchaseStatus.name_status == name)
            .first()
        )

        if not exists:
            db.add(PurchaseStatus(name_status=name))

    db.commit()


def seed_payment_methods(db: Session):

    seed_default_payment_methods(db)

    methods = (
        db.query(PaymentMethod)
        .filter(PaymentMethod.display_order == 0)
        .order_by(PaymentMethod.id.asc())
        .all()
    )

    next_order = len(DEFAULT_PAYMENT_METHODS) + 1

    for method in methods:
        method.display_order = next_order
        next_order += 1

    db.commit()