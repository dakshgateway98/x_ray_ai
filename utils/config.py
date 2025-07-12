from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://xray_user:xray_password@db:5432/xray_diagnosis"
    POSTGRES_DB: str = "xray_diagnosis"
    POSTGRES_USER: str = "xray_user"
    POSTGRES_PASSWORD: str = "xray_password"
    
    # Redis
    REDIS_URL: str = "redis://redis:6379/0"
    
    # Celery
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/0"
    
    # AI Models
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    SERPAPI_API_KEY: Optional[str] = None
    
    # Vector Store
    VECTOR_STORE_TYPE: str = "chroma"  # chroma, faiss, pinecone
    CHROMA_PERSIST_DIRECTORY: str = "/app/vector_store"
    PINECONE_API_KEY: Optional[str] = None
    PINECONE_ENVIRONMENT: Optional[str] = None
    PINECONE_INDEX_NAME: str = "xray-diagnosis"
    
    # Application
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    
    # File Storage
    UPLOAD_DIR: str = "/app/uploads"
    MAX_FILE_SIZE: int = 10485760  # 10MB
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()