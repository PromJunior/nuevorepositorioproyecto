from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
import os

class Settings(BaseSettings):
    database_url: str = Field(
        default="mysql+pymysql://root:root@localhost:3306/ventasdb",
        validation_alias="DATABASE_URL"
    )
    apiperu_token: str = Field(
        default="",
        validation_alias="APIPERU_TOKEN"
    )
    
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
settings = Settings()
