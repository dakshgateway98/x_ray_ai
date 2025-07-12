from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime, date
import uuid


class PatientCreate(BaseModel):
    name: str
    date_of_birth: date
    gender: str
    
    @validator('date_of_birth')
    def validate_date_of_birth(cls, v):
        if v > date.today():
            raise ValueError('Date of birth cannot be in the future')
        return v


class PatientBase(BaseModel):
    name: str
    age: int
    gender: str
    patient_id: str


class Patient(PatientBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class XRayFindingBase(BaseModel):
    diagnosis: str
    x1: float
    y1: float
    x2: float
    y2: float
    confidence: str = "medium"


class XRayFindingCreate(XRayFindingBase):
    pass


class XRayFinding(XRayFindingBase):
    id: int
    xray_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class XRayBase(BaseModel):
    patient_id: str
    clinical_notes: Optional[str] = None


class XRayCreate(XRayBase):
    pass


class XRay(XRayBase):
    id: int
    image_path: str
    image_url: Optional[str] = None  # Computed field for frontend access
    uploaded_at: datetime
    clinical_notes: Optional[str] = None
    diagnosis_status: str
    vision_analysis: Optional[str] = None
    vector_search_results: Optional[str] = None
    final_diagnosis: Optional[str] = None
    confidence_score: Optional[str] = None
    processing_error: Optional[str] = None
    findings: List[XRayFinding] = []
    
    class Config:
        from_attributes = True


class XRayUpdate(BaseModel):
    clinical_notes: Optional[str] = None


class BookBase(BaseModel):
    filename: str
    file_type: str


class BookCreate(BookBase):
    pass


class Book(BookBase):
    id: int
    file_path: str
    uploaded_at: datetime
    processing_status: str
    chunks_count: int
    embeddings_count: int
    processing_error: Optional[str] = None
    
    class Config:
        from_attributes = True


class DiagnosisResult(BaseModel):
    xray_id: int
    status: str
    vision_analysis: Optional[str] = None
    vector_search_results: Optional[str] = None
    final_diagnosis: Optional[str] = None
    confidence_score: Optional[str] = None
    error: Optional[str] = None 