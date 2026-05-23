from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATA_URL = "mssql+pyodbc://oherasa:123456789@DESKTOP-Q4AGH5P\SQLEXPRESS/ventasdb?driver=ODBC+Driver+17+for+SQL+Server"

engine = create_engine(DATA_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()