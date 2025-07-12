from celery_worker import celery
from sqlalchemy.orm import Session
from db.database import SessionLocal
from db.models import XRay, Patient, XRayFinding
from services.vision_service import vision_service
from services.ai_service import ai_service
from vector_store.vector_store import vector_store
import json
import traceback
import logging

logger = logging.getLogger(__name__)

@celery.task(bind=True)
def process_xray_diagnosis(self, xray_id: int):
    """Process X-ray diagnosis in background with fallback support"""
    db = SessionLocal()
    xray = None
    
    try:
        # Get X-ray record with patient information
        xray = db.query(XRay).filter(XRay.id == xray_id).first()
        if not xray:
            raise Exception(f"X-ray with ID {xray_id} not found")
        
        # Get patient information
        patient = db.query(Patient).filter(Patient.patient_id == xray.patient_id).first()
        if not patient:
            logger.warning(f"Patient not found for X-ray ID {xray_id}")
            patient = None
        
        logger.info(f"Starting diagnosis for X-ray ID: {xray_id}")
        
        # Update status to processing
        xray.diagnosis_status = "processing"
        db.commit()
        
        # Step 1: Vision Analysis
        self.update_state(
            state="PROGRESS",
            meta={"current": 1, "total": 2, "status": "Analyzing X-ray image..."}
        )
        
        logger.info(f"Starting vision analysis for X-ray ID: {xray_id}")
        vision_result = vision_service.analyze_xray(xray.image_path)
        xray.vision_analysis = vision_result["analysis"]
        logger.info(f"Vision analysis completed for X-ray ID: {xray_id}, model used: {vision_result.get('model_used', 'unknown')}")
        
        # Store findings from vision analysis
        findings = vision_result.get("findings", [])
        logger.info(f"Found {len(findings)} findings in vision analysis for X-ray ID: {xray_id}")
        
        # If no findings in vision_result, try to parse from vision_analysis
        if not findings and vision_result.get("analysis"):
            try:
                # Try to extract JSON from the vision analysis
                analysis_text = vision_result["analysis"]
                if "{" in analysis_text and "}" in analysis_text:
                    start = analysis_text.find("{")
                    end = analysis_text.rfind("}") + 1
                    json_str = analysis_text[start:end]
                    parsed = json.loads(json_str)
                    findings = parsed.get("findings", [])
                    logger.info(f"Extracted {len(findings)} findings from vision analysis JSON for X-ray ID: {xray_id}")
            except Exception as e:
                logger.error(f"Failed to parse findings from vision analysis for X-ray ID {xray_id}: {e}")
        
        # Clear existing findings and add new ones
        db.query(XRayFinding).filter(XRayFinding.xray_id == xray_id).delete()
        
        for finding in findings:
            try:
                # Extract coordinates from the finding
                coordinates = finding.get("coordinates", [])
                if len(coordinates) == 4:
                    x1, y1, x2, y2 = coordinates
                    diagnosis = finding.get("diagnosis", "Unknown finding")
                    
                    # Create new finding record
                    new_finding = XRayFinding(
                        xray_id=xray_id,
                        diagnosis=diagnosis,
                        x1=float(x1),
                        y1=float(y1),
                        x2=float(x2),
                        y2=float(y2),
                        confidence="high"  # Default confidence for AI findings
                    )
                    db.add(new_finding)
                    logger.info(f"Added finding: {diagnosis} at coordinates [{x1}, {y1}, {x2}, {y2}]")
                else:
                    logger.warning(f"Invalid coordinates format for finding: {finding}")
            except Exception as e:
                logger.error(f"Error processing finding: {e}")
                continue
        
        db.commit()
        logger.info(f"Stored {len(findings)} findings for X-ray ID: {xray_id}")
        
        # Step 2: Generate Final Diagnosis (renumbered from Step 3)
        self.update_state(
            state="PROGRESS",
            meta={"current": 2, "total": 2, "status": "Generating diagnosis..."}
        )
        
        logger.info(f"Starting final diagnosis generation for X-ray ID: {xray_id}")
        
        # Prepare patient information
        patient_info = None
        if patient:
            patient_info = {
                "name": patient.name,
                "patient_id": patient.patient_id,
                "age": patient.age,
                "gender": patient.gender
            }
        
        # Pass empty list for vector_results since we're not using vector search
        diagnosis_result = ai_service.generate_diagnosis(
            vision_result["analysis"],
            [],  # Empty list instead of vector_results
            patient_info
        )
        
        # Include clinical notes in the diagnosis if available
        if xray.clinical_notes:
            logger.info(f"Including clinical notes in diagnosis for X-ray ID: {xray_id}")
            # You can modify the diagnosis result to include clinical notes
            # For now, we'll just log that clinical notes are available
            logger.info(f"Clinical notes available: {xray.clinical_notes[:100]}...")
        
        # Store diagnosis results
        xray.final_diagnosis = json.dumps(diagnosis_result)
        xray.confidence_score = diagnosis_result.get("confidence_level", "medium")
        xray.diagnosis_status = "completed"
        db.commit()
        
        logger.info(f"Diagnosis completed successfully for X-ray ID: {xray_id}")
        
        return {
            "status": "completed",
            "xray_id": xray_id,
            "diagnosis": diagnosis_result,
            "findings_count": len(findings)
        }
        
    except Exception as e:
        logger.error(f"Diagnosis failed for X-ray ID {xray_id}: {e}")
        logger.error(traceback.format_exc())
        
        if xray:
            xray.diagnosis_status = "failed"
            xray.processing_error = str(e)
            db.commit()
        
        return {
            "status": "failed",
            "xray_id": xray_id,
            "error": str(e)
        }
    
    finally:
        db.close() 