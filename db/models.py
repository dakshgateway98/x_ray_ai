from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.database import Base


class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship with cascade delete
    xrays = relationship("XRay", back_populates="patient", cascade="all, delete-orphan")


class XRay(Base):
    __tablename__ = "xrays"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False)
    image_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Clinical notes
    clinical_notes = Column(Text, nullable=True)
    
    # Diagnosis fields
    diagnosis_status = Column(String, default="pending")  # pending, processing, completed, failed
    vision_analysis = Column(Text, nullable=True)
    vector_search_results = Column(Text, nullable=True)
    final_diagnosis = Column(Text, nullable=True)
    confidence_score = Column(String, nullable=True)
    processing_error = Column(Text, nullable=True)
    
    # Relationships
    patient = relationship("Patient", back_populates="xrays")
    findings = relationship("XRayFinding", back_populates="xray", cascade="all, delete-orphan")


class XRayFinding(Base):
    __tablename__ = "xray_findings"
    
    id = Column(Integer, primary_key=True, index=True)
    xray_id = Column(Integer, ForeignKey("xrays.id", ondelete="CASCADE"), nullable=False)
    diagnosis = Column(Text, nullable=False)
    x1 = Column(Float, nullable=False)  # Top-left X coordinate (0-100)
    y1 = Column(Float, nullable=False)  # Top-left Y coordinate (0-100)
    x2 = Column(Float, nullable=False)  # Bottom-right X coordinate (0-100)
    y2 = Column(Float, nullable=False)  # Bottom-right Y coordinate (0-100)
    confidence = Column(String, default="medium")  # high, medium, low
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    xray = relationship("XRay", back_populates="findings")


class Book(Base):
    __tablename__ = "books"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # pdf, txt, docx
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Processing status
    processing_status = Column(String, default="pending")  # pending, processing, completed, failed
    chunks_count = Column(Integer, default=0)
    embeddings_count = Column(Integer, default=0)
    processing_error = Column(Text, nullable=True) 