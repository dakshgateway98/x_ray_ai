from typing import List, Dict, Any, Optional
from langchain.llms import OpenAI
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain.schema import Document
import google.generativeai as genai
from utils.config import settings
import requests
import json
import logging

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.openai_llm = None
        self.gemini_model = None
        self._init_models()
    
    def _init_models(self):
        """Initialize AI models"""
        if settings.OPENAI_API_KEY:
            try:
                self.openai_llm = ChatOpenAI(
                    openai_api_key=settings.OPENAI_API_KEY,
                    model_name="gpt-4",
                    temperature=0.1
                )
                logger.info("OpenAI model initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI model: {e}")
                self.openai_llm = None
        
        if settings.GEMINI_API_KEY:
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.gemini_model = genai.GenerativeModel('gemini-pro')
                logger.info("Gemini model initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini model: {e}")
                self.gemini_model = None
    
    def generate_diagnosis(self, vision_analysis: str, vector_results: List[Document], patient_info: Optional[Dict] = None) -> Dict[str, Any]:
        """Generate final diagnosis using LLM with vector search results and patient information"""
        # Prepare context from vector search
        context = self._prepare_context(vector_results)
        
        # Create prompt template
        patient_section = ""
        if patient_info:
            patient_section = f"""
            Patient Information:
            - Name: {patient_info.get('name', 'Not provided')}
            - Patient ID: {patient_info.get('patient_id', 'Not provided')}
            - Age: {patient_info.get('age', 'Not provided')}
            - Gender: {patient_info.get('gender', 'Not provided')}
            """
        
        prompt_template = PromptTemplate(
            input_variables=["vision_analysis", "context", "patient_info"],
            template=f"""
            You are an expert radiologist. Analyze the following X-ray image analysis and medical literature context to provide a comprehensive diagnosis.
            
            {patient_section}
            
            Vision Analysis:
            {{vision_analysis}}
            
            Relevant Medical Literature:
            {{context}}
            
            Please provide:
            1. Primary diagnosis with confidence level
            2. Differential diagnoses
            3. Key findings from the X-ray
            4. Recommended next steps
            
            Format your response as JSON with the following structure:
            {{
                "primary_diagnosis": "diagnosis name",
                "confidence_level": "high/medium/low",
                "differential_diagnoses": ["diagnosis1", "diagnosis2"],
                "key_findings": ["finding1", "finding2"],
                "recommendations": ["recommendation1", "recommendation2"]
            }}
            """
        )
        
        # Try OpenAI first
        if self.openai_llm:
            try:
                logger.info("Attempting diagnosis with OpenAI")
                chain = LLMChain(llm=self.openai_llm, prompt=prompt_template)
                result = chain.run({
                    "vision_analysis": vision_analysis,
                    "context": context,
                    "patient_info": patient_info or {}
                })
                logger.info("OpenAI diagnosis completed successfully")
                return self._parse_diagnosis_result(result)
            except Exception as e:
                logger.warning(f"OpenAI diagnosis failed: {e}")
                # Continue to Gemini fallback
        
        # Fallback to Gemini
        if self.gemini_model:
            logger.info(f"Gemini model: {self.gemini_model}")
            try:
                logger.info("Attempting diagnosis with Gemini")
                prompt = prompt_template.format(
                    vision_analysis=vision_analysis,
                    context=context,
                    patient_info=patient_info or {}
                )
                response = self.gemini_model.generate_content(prompt)
                logger.info("Gemini diagnosis completed successfully")
                return self._parse_diagnosis_result(response.text)
            except Exception as e:
                logger.warning(f"Gemini diagnosis failed: {e}")
        
        # Final fallback
        logger.warning("All AI models failed, using fallback analysis")
        return self._fallback_analysis(vision_analysis)
    
    def _prepare_context(self, vector_results: List[Document]) -> str:
        """Prepare context from vector search results"""
        if not vector_results:
            return "No relevant medical literature found."
        
        context_parts = []
        for i, doc in enumerate(vector_results[:3]):  # Use top 3 results
            context_parts.append(f"Source {i+1}:\n{doc.page_content}\n")
        
        return "\n".join(context_parts)
    
    def _parse_diagnosis_result(self, result: str) -> Dict[str, Any]:
        """Parse LLM diagnosis result"""
        try:
            # Try to extract JSON from the response
            if "{" in result and "}" in result:
                start = result.find("{")
                end = result.rfind("}") + 1
                json_str = result[start:end]
                parsed = json.loads(json_str)
                return parsed
            else:
                # If no JSON found, return as text
                return {
                    "primary_diagnosis": "Analysis completed",
                    "confidence_level": "medium",
                    "differential_diagnoses": [],
                    "key_findings": [result],
                    "recommendations": ["Consult with a radiologist for detailed review"]
                }
        except json.JSONDecodeError:
            # Return as text if JSON parsing fails
            return {
                "primary_diagnosis": "Analysis completed",
                "confidence_level": "medium",
                "differential_diagnoses": [],
                "key_findings": [result],
                "recommendations": ["Consult with a radiologist for detailed review"]
            }
    
    def _fallback_analysis(self, vision_analysis: str) -> Dict[str, Any]:
        """Fallback analysis when all AI models fail"""
        return {
            "primary_diagnosis": "Analysis completed (fallback)",
            "confidence_level": "low",
            "differential_diagnoses": [],
            "key_findings": [vision_analysis],
            "recommendations": ["Consult with a radiologist for detailed review"]
        }
    
    def _fallback_web_search(self, vision_analysis: str) -> Dict[str, Any]:
        """Fallback to web search if LLM fails"""
        if not settings.SERPAPI_API_KEY:
            return {
                "primary_diagnosis": "Analysis completed",
                "confidence_level": "low",
                "differential_diagnoses": [],
                "key_findings": [vision_analysis],
                "recommendations": ["Consult with a radiologist for detailed review"]
            }
        
        try:
            # Use SerpAPI for web search
            search_query = f"X-ray diagnosis {vision_analysis}"
            url = "https://serpapi.com/search"
            params = {
                "q": search_query,
                "api_key": settings.SERPAPI_API_KEY,
                "engine": "google",
                "num": 5
            }
            
            response = requests.get(url, params=params)
            results = response.json()
            
            # Extract relevant information from search results
            snippets = []
            if "organic_results" in results:
                for result in results["organic_results"][:3]:
                    if "snippet" in result:
                        snippets.append(result["snippet"])
            
            return {
                "primary_diagnosis": "Analysis completed (web search)",
                "confidence_level": "low",
                "differential_diagnoses": [],
                "key_findings": [vision_analysis] + snippets,
                "recommendations": ["Consult with a radiologist for detailed review"]
            }
            
        except Exception as e:
            return {
                "primary_diagnosis": "Analysis completed",
                "confidence_level": "low",
                "differential_diagnoses": [],
                "key_findings": [vision_analysis],
                "recommendations": ["Consult with a radiologist for detailed review"]
            }


# Global AI service instance
ai_service = AIService() 