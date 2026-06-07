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
    dialect_name = db.bind.dialect.name

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
        "subtotal_amount": "NUMERIC(10,2) NOT NULL DEFAULT 0" if dialect_name == "mssql" else "NUMERIC(10,2) DEFAULT 0",
        "tax_amount": "NUMERIC(10,2) NOT NULL DEFAULT 0" if dialect_name == "mssql" else "NUMERIC(10,2) DEFAULT 0",
        "igv_percent": "NUMERIC(5,2) NOT NULL DEFAULT 18" if dialect_name == "mssql" else "NUMERIC(5,2) DEFAULT 18",
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
            column_type = (
                "NUMERIC(10,2) NOT NULL DEFAULT 0"
                if dialect_name == "mssql"
                else "NUMERIC(10,2) DEFAULT 0"
            )
            db.execute(
                text(f"ALTER TABLE orders ADD discount_amount {column_type}")
            )

    db.commit()
    ensure_financial_columns_not_null(db)
    ensure_system_settings_automation_columns(db)
    ensure_webhook_log_columns(db)


def ensure_system_settings_automation_columns(db: Session):
    inspector = inspect(db.bind)

    if "system_settings" not in inspector.get_table_names():
        return

    columns = {
        column["name"]
        for column in inspector.get_columns("system_settings")
    }

    if "automations" in columns:
        return

    column_type = "NVARCHAR(MAX)" if db.bind.dialect.name == "mssql" else "JSON"
    db.execute(text(f"ALTER TABLE system_settings ADD automations {column_type}"))
    db.commit()


def ensure_webhook_log_columns(db: Session):
    inspector = inspect(db.bind)

    if "webhook_logs" not in inspector.get_table_names():
        return

    columns = {
        column["name"]
        for column in inspector.get_columns("webhook_logs")
    }

    if "duration_ms" not in columns:
        db.execute(text("ALTER TABLE webhook_logs ADD duration_ms INT"))

    if "payload" not in columns:
        column_type = "NVARCHAR(MAX)" if db.bind.dialect.name == "mssql" else "JSON"
        db.execute(text(f"ALTER TABLE webhook_logs ADD payload {column_type}"))

    db.commit()


def ensure_drive_export_log_columns(db: Session):
    inspector = inspect(db.bind)

    if "drive_export_logs" not in inspector.get_table_names():
        return

    columns = {
        column["name"]
        for column in inspector.get_columns("drive_export_logs")
    }

    if "incremental" not in columns:
        column_type = "BIT NOT NULL DEFAULT 0" if db.bind.dialect.name == "mssql" else "BOOLEAN DEFAULT 0"
        db.execute(text(f"ALTER TABLE drive_export_logs ADD incremental {column_type}"))

    if "rows_count" not in columns:
        column_type = "INT NOT NULL DEFAULT 0" if db.bind.dialect.name == "mssql" else "INTEGER DEFAULT 0"
        db.execute(text(f"ALTER TABLE drive_export_logs ADD rows_count {column_type}"))

    if "last_exported_id" not in columns:
        db.execute(text("ALTER TABLE drive_export_logs ADD last_exported_id INT"))

    db.commit()


def ensure_financial_columns_not_null(db: Session):
    if db.bind.dialect.name != "mssql":
        return

    financial_columns = {
        "orders": {
            "subtotal_amount": ("NUMERIC(10,2)", "0"),
            "tax_amount": ("NUMERIC(10,2)", "0"),
            "igv_percent": ("NUMERIC(5,2)", "18"),
            "discount_amount": ("NUMERIC(10,2)", "0"),
            "total_amount": ("NUMERIC(10,2)", "0"),
        },
        "purchases": {
            "subtotal_amount": ("NUMERIC(10,2)", "0"),
            "tax_amount": ("NUMERIC(10,2)", "0"),
            "igv_percent": ("NUMERIC(5,2)", "18"),
            "total_amount": ("NUMERIC(10,2)", "0"),
        },
    }

    inspector = inspect(db.bind)
    tables = set(inspector.get_table_names())

    for table, columns in financial_columns.items():
        if table not in tables:
            continue

        existing_columns = {
            column["name"]: column
            for column in inspector.get_columns(table)
        }

        for column_name, (column_type, default_value) in columns.items():
            if column_name not in existing_columns:
                db.execute(
                    text(
                        f"ALTER TABLE {table} "
                        f"ADD {column_name} {column_type} NOT NULL DEFAULT {default_value}"
                    )
                )
                continue

            db.execute(
                text(
                    f"UPDATE {table} "
                    f"SET {column_name} = {default_value} "
                    f"WHERE {column_name} IS NULL"
                )
            )

            if existing_columns[column_name].get("nullable", True):
                db.execute(
                    text(
                        f"ALTER TABLE {table} "
                        f"ALTER COLUMN {column_name} {column_type} NOT NULL"
                    )
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
