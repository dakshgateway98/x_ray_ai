from typing import Dict, Any, Optional, List
import base64
import os
from PIL import Image
import io
from openai import OpenAI
import google.generativeai as genai
from utils.config import settings
import logging 
import json

logger = logging.getLogger(__name__)

class VisionService:
    def __init__(self):
        self.openai_client = None
        self.gemini_model = None
        self._init_models()
    
    def _init_models(self):
        """Initialize vision models"""
        if settings.OPENAI_API_KEY:
            try:
                logger.info(f"Initializing OpenAI Vision client with API key: {settings.OPENAI_API_KEY}")
                self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("OpenAI Vision client initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI Vision client: {e}")
                self.openai_client = None
        
        if settings.GEMINI_API_KEY:
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)


                self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')
                logger.info("Gemini Vision model initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini Vision model: {e}")
                self.gemini_model = None
    
    def analyze_xray(self, image_path: str) -> Dict[str, Any]:
        """Analyze X-ray image using vision models with fallback"""
        try:
            # Validate image file exists
            if not os.path.exists(image_path):
                raise FileNotFoundError(f"Image file not found: {image_path}")
            
            # Prepare image for analysis
            image_data = self._prepare_image(image_path)
            logger.info(f"Starting X-ray analysis for: {image_path}")
            
            # Try OpenAI Vision first
            if self.openai_client:
                try:
                    logger.info("Attempting analysis with OpenAI Vision")
                    result = self._analyze_with_openai(image_data)
                    logger.info("OpenAI Vision analysis completed successfully")
                    return result
                except Exception as e:
                    logger.warning(f"OpenAI Vision failed: {e}")
                    # Continue to Gemini fallback
            
            # Fallback to Gemini Vision
            if self.gemini_model:
                try:
                    logger.info("Attempting analysis with Gemini Vision")
                    result = self._analyze_with_gemini(image_path)
                    logger.info("Gemini Vision analysis completed successfully")
                    return result
                except Exception as e:
                    logger.warning(f"Gemini Vision failed: {e}")
            
            # If both fail, return basic analysis
            logger.warning("All vision models failed, using basic analysis")
            return self._basic_analysis(image_path)
            
        except Exception as e:
            logger.error(f"Vision analysis failed: {e}")
            return {
                "analysis": f"Failed to analyze image: {str(e)}",
                "confidence": "low",
                "model_used": "none",
                "findings": []
            }
    
    def _prepare_image(self, image_path: str) -> str:
        """Prepare image for OpenAI API (base64 encoding)"""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    
    def _analyze_with_openai(self, image_data: str) -> Dict[str, Any]:
        """Analyze image using OpenAI Vision with coordinate-based findings"""
        prompt = """
        You are a medical expert radiologist. Analyze the given X-ray image carefully. Identify any visible abnormalities or pathologies. For each finding, return the following:

        Diagnosis/Observation – concise medical description of the issue.
        Coordinates – give the location of the issue using relative coordinates, where (0,0) is top-left and (100,100) is bottom-right of the image.
        Format: [x1, y1, x2, y2] representing the top-left and bottom-right corners of a rectangular region around the finding.

        You may return multiple such diagnosis blocks if multiple issues are found.

        Respond in JSON format as:
        {
          "findings": [
            {
              "diagnosis": "Mild cardiomegaly",
              "coordinates": [20, 30, 50, 60]
            },
            {
              "diagnosis": "Right lower lobe consolidation",
              "coordinates": [60, 70, 85, 90]
            }
          ]
        }

        Also provide a general analysis of the image including:
        - Anatomical Assessment
        - Radiologic Findings
        - Image Quality Evaluation
        - Impression/Conclusion
        - Recommendations

        Format your complete response as:
        {
          "findings": [...],
          "analysis": "detailed analysis text",
          "confidence": "high/medium/low"
        }
        """
        
        response = self.openai_client.chat.completions.create(
            model="gpt-4-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_data}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=1500
        )
        
        result_text = response.choices[0].message.content
        
        # Parse the response to extract findings and analysis
        try:
            # Try to extract JSON from the response
            if "{" in result_text and "}" in result_text:
                start = result_text.find("{")
                end = result_text.rfind("}") + 1
                json_str = result_text[start:end]
                parsed = json.loads(json_str)
                
                return {
                    "analysis": parsed.get("analysis", result_text),
                    "confidence": parsed.get("confidence", "high"),
                    "model_used": "openai_vision",
                    "findings": parsed.get("findings", [])
                }
            else:
                # If no JSON found, return as text with empty findings
                return {
                    "analysis": result_text,
                    "confidence": "high",
                    "model_used": "openai_vision",
                    "findings": []
                }
        except json.JSONDecodeError:
            # Return as text if JSON parsing fails
            return {
                "analysis": result_text,
                "confidence": "high",
                "model_used": "openai_vision",
                "findings": []
            }
    
    def _analyze_with_gemini(self, image_path: str) -> Dict[str, Any]:
        """Analyze image using Gemini Vision with coordinate-based findings"""
        prompt = """
        You are a medical expert radiologist. Analyze the given X-ray image carefully. Identify any visible abnormalities or pathologies. For each finding, return the following:

        Diagnosis/Observation – concise medical description of the issue.
        Coordinates – give the location of the issue using relative coordinates, where (0,0) is top-left and (100,100) is bottom-right of the image.
        Format: [x1, y1, x2, y2] representing the top-left and bottom-right corners of a rectangular region around the finding.

        You may return multiple such diagnosis blocks if multiple issues are found.

        Respond in JSON format as:
        {
          "findings": [
            {
              "diagnosis": "Mild cardiomegaly",
              "coordinates": [20, 30, 50, 60]
            },
            {
              "diagnosis": "Right lower lobe consolidation",
              "coordinates": [60, 70, 85, 90]
            }
          ]
        }

        Also provide a general analysis of the image including:
        - Anatomical Assessment
        - Radiologic Findings
        - Image Quality Evaluation
        - Impression/Conclusion
        - Recommendations

        Format your complete response as:
        {
          "findings": [...],
          "analysis": "detailed analysis text",
          "confidence": "high/medium/low"
        }
        """
        
        logger.info(f"Gemini Vision model: {self.gemini_model}")
        logger.info(f"Image path: {image_path}")

        # Load image for Gemini
        image = Image.open(image_path)
        
        response = self.gemini_model.generate_content([prompt, image])
        
        logger.info(f"Gemini Vision analysis completed successfully")
        logger.info(f"Gemini Vision analysis: {response.text}")

        result_text = response.text
        
        # Parse the response to extract findings and analysis
        try:
            # Try to extract JSON from the response
            if "{" in result_text and "}" in result_text:
                start = result_text.find("{")
                end = result_text.rfind("}") + 1
                json_str = result_text[start:end]
                parsed = json.loads(json_str)
                
                return {
                    "analysis": parsed.get("analysis", result_text),
                    "confidence": parsed.get("confidence", "high"),
                    "model_used": "gemini_vision",
                    "findings": parsed.get("findings", [])
                }
            else:
                # If no JSON found, return as text with empty findings
                return {
                    "analysis": result_text,
                    "confidence": "high",
                    "model_used": "gemini_vision",
                    "findings": []
                }
        except json.JSONDecodeError:
            # Return as text if JSON parsing fails
            return {
                "analysis": result_text,
                "confidence": "high",
                "model_used": "gemini_vision",
                "findings": []
            }
    
    def _basic_analysis(self, image_path: str) -> Dict[str, Any]:
        """Basic image analysis when AI models are not available"""
        try:
            with Image.open(image_path) as img:
                width, height = img.size
                format_type = img.format
                mode = img.mode
                
                return {
                    "analysis": f"Basic image analysis: {format_type} image, {width}x{height} pixels, {mode} color mode. AI analysis not available.",
                    "confidence": "low",
                    "model_used": "basic",
                    "findings": [],
                    "image_info": {
                        "width": width,
                        "height": height,
                        "format": format_type,
                        "mode": mode
                    }
                }
        except Exception as e:
            return {
                "analysis": f"Failed to perform basic analysis: {str(e)}",
                "confidence": "low",
                "model_used": "none",
                "findings": []
            }


# Global vision service instance
vision_service = VisionService() 