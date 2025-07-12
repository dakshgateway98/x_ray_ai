from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os

from api import patients, xray, books
from db.database import engine
from db import models

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

app = FastAPI(title="X-Ray Diagnosis API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
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