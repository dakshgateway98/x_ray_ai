from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
import logging

from db.database import get_db
from db.models import Book
from db.schemas import Book as BookSchema
from utils.config import settings
from tasks.book_tasks import process_book_upload

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/upload", response_model=BookSchema)
async def upload_book(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a medical book for embedding"""
    # Validate file type
    allowed_types = ['.pdf', '.txt', '.docx']
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not supported. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Validate file size
    if file.size and file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")
    
    # Create unique filename
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Create book record
    book = Book(
        filename=file.filename,
        file_path=file_path,
        file_type=file_extension[1:],  # Remove the dot
        processing_status="pending"
    )
    db.add(book)
    db.commit()
    db.refresh(book)
    
    # Trigger background processing task
    try:
        process_book_upload.delay(book.id)
    except Exception as e:
        # Update status to failed if task creation fails
        book.processing_status = "failed"
        book.processing_error = f"Failed to start processing task: {str(e)}"
        db.commit()
        raise HTTPException(status_code=500, detail="Failed to start book processing")
    
    return book


@router.get("/", response_model=List[BookSchema])
def get_books(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all books"""
    books = db.query(Book).offset(skip).limit(limit).all()
    return books


@router.get("/{book_id}", response_model=BookSchema)
def get_book(book_id: int, db: Session = Depends(get_db)):
    """Get a specific book by ID"""
    book = db.query(Book).filter(Book.id == book_id).first()
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@router.delete("/{book_id}")
def delete_book(book_id: int, db: Session = Depends(get_db)):
    """Delete a book"""
    book = db.query(Book).filter(Book.id == book_id).first()
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Delete file if it exists
    if os.path.exists(book.file_path):
        try:
            os.remove(book.file_path)
        except Exception as e:
            logger.error(f"Failed to delete file {book.file_path}: {e}")
    
    db.delete(book)
    db.commit()
    return {"message": "Book deleted successfully"} 