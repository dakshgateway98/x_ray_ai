from celery_worker import celery
from sqlalchemy.orm import Session
from db.database import SessionLocal
from db.models import Book
from vector_store.vector_store import vector_store
from langchain.schema import Document
from langchain.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
import os
import traceback


@celery.task(bind=True)
def process_book_upload(self, book_id: int):
    """Process book upload and create embeddings in background"""
    db = SessionLocal()
    
    try:
        # Get book record
        book = db.query(Book).filter(Book.id == book_id).first()
        if not book:
            raise Exception(f"Book with ID {book_id} not found")
        
        # Update status to processing
        book.processing_status = "processing"
        db.commit()
        
        # Step 1: Load and parse document
        self.update_state(
            state="PROGRESS",
            meta={"current": 1, "total": 3, "status": "Loading document..."}
        )
        
        documents = load_document(book.file_path, book.file_type)
        book.chunks_count = len(documents)
        db.commit()
        
        # Step 2: Create embeddings
        self.update_state(
            state="PROGRESS",
            meta={"current": 2, "total": 3, "status": "Creating embeddings..."}
        )
        
        # Add metadata to documents
        for doc in documents:
            doc.metadata.update({
                "source": book.filename,
                "book_id": book_id,
                "file_type": book.file_type
            })
        
        # Add to vector store
        embeddings_count = vector_store.add_documents(documents)
        book.embeddings_count = embeddings_count
        db.commit()
        
        # Step 3: Complete processing
        self.update_state(
            state="PROGRESS",
            meta={"current": 3, "total": 3, "status": "Finalizing..."}
        )
        
        book.processing_status = "completed"
        db.commit()
        
        return {
            "status": "completed",
            "book_id": book_id,
            "chunks_count": book.chunks_count,
            "embeddings_count": book.embeddings_count
        }
        
    except Exception as e:
        # Update status to failed
        if book:
            book.processing_status = "failed"
            book.processing_error = str(e)
            db.commit()
        
        error_msg = f"Failed to process book {book_id}: {str(e)}"
        print(error_msg)
        print(traceback.format_exc())
        
        return {
            "status": "failed",
            "book_id": book_id,
            "error": str(e)
        }
    
    finally:
        db.close()


def load_document(file_path: str, file_type: str) -> list[Document]:
    """Load document based on file type"""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    try:
        if file_type.lower() == "pdf":
            loader = PyPDFLoader(file_path)
            return loader.load()
        
        elif file_type.lower() == "txt":
            loader = TextLoader(file_path)
            return loader.load()
        
        elif file_type.lower() == "docx":
            loader = Docx2txtLoader(file_path)
            return loader.load()
        
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
    
    except Exception as e:
        raise Exception(f"Failed to load document {file_path}: {str(e)}") 