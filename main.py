import os

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from api import patients, xray, books
from db.database import engine
from db import models

os.makedirs("uploads", exist_ok=True)

app = FastAPI(
    title="X-Ray Diagnosis API",
    description="Demo RAG + vision pipeline for educational X-ray analysis. Not a medical device.",
)

cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for serving uploaded images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Include routers
app.include_router(patients.router, prefix="/patients", tags=["patients"])
app.include_router(xray.router, prefix="/xray", tags=["xray"])
app.include_router(books.router, prefix="/books", tags=["books"])

@app.get("/health")
def health_check():
    return {"status": "healthy"} 