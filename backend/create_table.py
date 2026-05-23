from database.database import engine, Base
from models.model import *  # IMPORTAR MODELOS

Base.metadata.create_all(bind=engine)

print("Tablas creadas correctamente")