from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
import os
import shutil
from datetime import date

from db.database import get_db
from db.models import Patient, XRay
from db.schemas import PatientCreate, Patient as PatientSchema
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def calculate_age(date_of_birth: date) -> int:
    """Calculate age from date of birth"""
    today = date.today()
    age = today.year - date_of_birth.year
    if today.month < date_of_birth.month or (today.month == date_of_birth.month and today.day < date_of_birth.day):
        age -= 1
    return age


def generate_patient_id() -> str:
    """Generate a unique patient ID"""
    return f"P{str(uuid.uuid4())[:8].upper()}"


@router.post("/", response_model=PatientSchema)
def create_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    """Create a new patient"""
    logger.info(f"Creating patient: {patient.name}")
    
    # Calculate age from date of birth
    age = calculate_age(patient.date_of_birth)
    
    # Generate unique patient ID
    patient_id = generate_patient_id()
    
    # Check if patient_id already exists (very unlikely but safe)
    while db.query(Patient).filter(Patient.patient_id == patient_id).first():
        patient_id = generate_patient_id()
    
    # Create patient record
    db_patient = Patient(
        name=patient.name,
        age=age,
        gender=patient.gender,
        patient_id=patient_id
    )
    
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    
    logger.info(f"Created patient with ID: {patient_id}")
    return db_patient


@router.get("/", response_model=List[PatientSchema])
def get_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all patients"""
    logger.info(f"Getting patients with skip data: {skip} and limit: {limit}")
    patients = db.query(Patient).offset(skip).limit(limit).all()
    return patients


@router.get("/{patient_id}", response_model=PatientSchema)
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    """Get a specific patient by patient_id"""
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.delete("/{patient_id}")
def delete_patient(patient_id: str, db: Session = Depends(get_db)):
    """Delete a patient and all associated X-rays"""
    logger.info(f"Attempting to delete patient: {patient_id}")
    
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Get all X-rays for this patient to delete their files
    xrays = db.query(XRay).filter(XRay.patient_id == patient_id).all()
    logger.info(f"Found {len(xrays)} X-rays to delete for patient {patient_id}")
    
    # Delete X-ray files from disk
    for xray in xrays:
        if xray.image_path and os.path.exists(xray.image_path):
            try:
                os.remove(xray.image_path)
                logger.info(f"Deleted X-ray file: {xray.image_path}")
            except Exception as e:
                logger.error(f"Failed to delete X-ray file {xray.image_path}: {e}")
    
    # Delete the patient (this will cascade delete all X-rays due to the relationship)
    db.delete(patient)
    db.commit()
    
    logger.info(f"Successfully deleted patient {patient_id} and {len(xrays)} associated X-rays")
    return {"message": f"Patient deleted successfully along with {len(xrays)} X-rays"} 