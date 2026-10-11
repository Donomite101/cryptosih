import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    ETHERSCAN_API_KEY: str = ""  # required - set in .env (free key: https://etherscan.io/apis)
    TRONGRID_API_KEY: str = ""  # optional, raises TronGrid rate limits
    DATABASE_URL: str = "sqlite:///./tech_titans.db"
    CORS_ORIGINS: str = "http://localhost:5173"
    APP_ENV: str = "development"
    VASP_LABELS_FILE: str = str(BASE_DIR / "data" / "vasp_labels.csv")
    PORT: int = 8000

    class Config:
        env_file = str(BASE_DIR / ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
