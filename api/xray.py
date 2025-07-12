from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import XRay, Patient, XRayFinding
from db.schemas import XRay as XRaySchema
from services.vision_service import vision_service
from tasks.diagnosis_tasks import process_xray_diagnosis
import os
import shutil
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

def add_image_url(xray: XRay) -> XRaySchema:
    """Add image URL to X-ray object"""
    if xray.image_path:
        # Construct URL for frontend access
        xray.image_url = f"/uploads/{os.path.basename(xray.image_path)}"
    
    # Convert to schema
    return XRaySchema.model_validate(xray)

@router.post("/", response_model=XRaySchema)
def upload_xray(
    patient_id: str = Form(...),
    file: UploadFile = File(...),
    clinical_notes: str = Form(None),
    db: Session = Depends(get_db)
):
    """Upload X-ray image for diagnosis"""
    logger.info(f"Uploading X-ray for patient: {patient_id}")
    
    # Validate patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )
    
    # Create uploads directory if it doesn't exist
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"xray_{patient_id}_{timestamp}{file_extension}"
    file_path = os.path.join(upload_dir, filename)
    
    try:
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"File saved to: {file_path}")
        
        # Create X-ray record
        xray = XRay(
            patient_id=patient_id,
            image_path=file_path,
            clinical_notes=clinical_notes,
            diagnosis_status="pending"
        )
        
        db.add(xray)
        db.commit()
        db.refresh(xray)
        
        logger.info(f"X-ray record created with ID: {xray.id}")
        
        # Trigger background diagnosis task
        try:
            process_xray_diagnosis.delay(xray.id)
            logger.info(f"Diagnosis task triggered for X-ray ID: {xray.id}")
        except Exception as e:
            logger.error(f"Failed to trigger diagnosis task: {e}")
            # Don't fail the upload if task creation fails
            # The diagnosis can be retried later
        
        return add_image_url(xray)
        
    except Exception as e:
        logger.error(f"Failed to upload X-ray: {e}")
        # Clean up file if it was created
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail="Failed to upload X-ray")

@router.get("/{xray_id}", response_model=XRaySchema)
def get_xray(xray_id: int, db: Session = Depends(get_db)):
    """Get X-ray details with findings"""
    logger.info(f"Fetching X-ray with ID: {xray_id}")
    
    xray = db.query(XRay).filter(XRay.id == xray_id).first()
    if not xray:
        raise HTTPException(status_code=404, detail="X-ray not found")
    
    # Load findings for this X-ray
    findings = db.query(XRayFinding).filter(XRayFinding.xray_id == xray_id).all()
    xray.findings = findings
    
    logger.info(f"Found {len(findings)} findings for X-ray ID: {xray_id}")
    
    return add_image_url(xray)

@router.get("/patient/{patient_id}", response_model=list[XRaySchema])
def get_patient_xrays(patient_id: str, db: Session = Depends(get_db)):
    """Get all X-rays for a patient"""
    logger.info(f"Fetching X-rays for patient: {patient_id}")
    
    # Validate patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    xrays = db.query(XRay).filter(XRay.patient_id == patient_id).all()
    
    # Load findings for each X-ray
    for xray in xrays:
        findings = db.query(XRayFinding).filter(XRayFinding.xray_id == xray.id).all()
        xray.findings = findings
    
    logger.info(f"Found {len(xrays)} X-rays for patient: {patient_id}")
    
    return [add_image_url(xray) for xray in xrays]

@router.delete("/{xray_id}")
def delete_xray(xray_id: int, db: Session = Depends(get_db)):
    """Delete X-ray and associated findings"""
    logger.info(f"Deleting X-ray with ID: {xray_id}")
    
    xray = db.query(XRay).filter(XRay.id == xray_id).first()
    if not xray:
        raise HTTPException(status_code=404, detail="X-ray not found")
    
    try:
        # Delete associated findings (cascade should handle this, but being explicit)
        db.query(XRayFinding).filter(XRayFinding.xray_id == xray_id).delete()
        
        # Delete file from filesystem
        if os.path.exists(xray.image_path):
            os.remove(xray.image_path)
            logger.info(f"Deleted file: {xray.image_path}")
        
        # Delete X-ray record
        db.delete(xray)
        db.commit()
        
        logger.info(f"Successfully deleted X-ray ID: {xray_id}")
        return {"message": "X-ray deleted successfully"}
        
    except Exception as e:
        logger.error(f"Failed to delete X-ray {xray_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete X-ray")

@router.post("/{xray_id}/rediagnose", response_model=XRaySchema)
def rediagnose_xray(xray_id: int, db: Session = Depends(get_db)):
    """Re-diagnose an X-ray"""
    logger.info(f"Re-diagnosing X-ray with ID: {xray_id}")
    
    xray = db.query(XRay).filter(XRay.id == xray_id).first()
    if xray is None:
        raise HTTPException(status_code=404, detail="X-ray not found")
    
    # Reset diagnosis status and clear previous results
    xray.diagnosis_status = "pending"
    xray.vision_analysis = None
    xray.vector_search_results = None
    xray.final_diagnosis = None
    xray.confidence_score = None
    xray.processing_error = None
    
    # Clear existing findings
    db.query(XRayFinding).filter(XRayFinding.xray_id == xray_id).delete()
    
    db.commit()
    db.refresh(xray)
    
    # Trigger background diagnosis task
    try:
        process_xray_diagnosis.delay(xray.id)
        logger.info(f"Re-diagnosis task triggered for X-ray ID: {xray_id}")
    except Exception as e:
        # Update status to failed if task creation fails
        xray.diagnosis_status = "failed"
        xray.processing_error = f"Failed to start re-diagnosis task: {str(e)}"
        db.commit()
        logger.error(f"Failed to trigger re-diagnosis for X-ray ID {xray_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to start re-diagnosis processing")
    
    return add_image_url(xray) 