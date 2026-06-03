import os
from typing import List, Union
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load env file if it exists
load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "CloneMe"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    
    JWT_SECRET: str = "supersecretjwtkeyforclonemedigitaltwinplatformdevelopmentonly123!"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    DATABASE_URL: str = "sqlite:///./cloneme.db"
    
    CHROMA_DB_DIR: str = "./chromadb_store"
    CHROMA_HOST: str = "chromadb"
    CHROMA_PORT: int = 8000
    
    GEMINI_API_KEY: str = ""
    
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173", 
        "http://localhost:5174", 
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000"
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
