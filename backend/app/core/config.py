import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart CSV Data Analyst Agent"
    API_STR: str = "/api"
    VERSION: str = "1.0.0"
    DEBUG: bool = True

    # CORS
    BACKEND_CORS_ORIGINS: Union[str, List[str]] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Directories
    UPLOAD_DIR: str = "./uploads"
    REPORT_DIR: str = "./reports"
    LOG_DIR: str = "./logs"
    MAX_UPLOAD_SIZE_MB: int = 50

    # Ollama / LLM config
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    LLM_MODEL: str = "llama3"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
# Ensure working dirs exist relative to backend
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORT_DIR, exist_ok=True)
os.makedirs(settings.LOG_DIR, exist_ok=True)
