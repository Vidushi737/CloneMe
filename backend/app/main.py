import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base
from app.routes import auth, journals, goals, habits, moods, ai

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables in development (SQLite/Postgres)
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CloneMe - AI-Powered Digital Twin Platform API",
    version="1.0.0",a
    lifespan=lifespan
)

# Parse CORS Origins if passed as JSON string
origins = settings.CORS_ORIGINS
if isinstance(origins, str):
    try:
        origins = json.loads(origins)
    except json.JSONDecodeError:
        origins = [o.strip() for o in origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(journals.router, prefix=settings.API_V1_STR)
app.include_router(goals.router, prefix=settings.API_V1_STR)
app.include_router(habits.router, prefix=settings.API_V1_STR)
app.include_router(moods.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "docs_url": "/docs",
        "api_v1_url": f"{settings.API_V1_STR}"
    }
