from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional
import os

class Settings(BaseSettings):
    database_url: str = Field(
        validation_alias="DATABASE_URL"
    )
    apiperu_token: str = Field(
        default="",
        validation_alias="APIPERU_TOKEN"
    )
    # ── Autenticación máquina-a-máquina para n8n ──────────────────────────────
    # Configura N8N_SERVICE_SECRET en .env con una clave larga y aleatoria.
    # Si no se configura, la rama X-N8N-Secret queda deshabilitada (retorna 401).
    n8n_service_secret: Optional[str] = Field(
        default=None,
        validation_alias="N8N_SERVICE_SECRET"
    )

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
