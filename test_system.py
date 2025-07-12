#!/usr/bin/env python3
"""
Test script for X-ray Diagnosis System
Run this after starting the Docker containers to verify everything works.
"""

import requests
import json
import time
import os

BASE_URL = "http://localhost:8000"

def test_health():
    """Test API health endpoint"""
    print("🔍 Testing API health...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ API is healthy")
            return True
        else:
            print(f"❌ API health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API health check failed: {e}")
        return False

def test_create_patient():
    """Test patient creation"""
    print("\n👤 Testing patient creation...")
    patient_data = {
        "patient_id": "TEST001",
        "name": "Test Patient",
        "age": 35,
        "gender": "female"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/patients/",
            json=patient_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            patient = response.json()
            print(f"✅ Patient created: {patient['name']} (ID: {patient['patient_id']})")
            return patient['patient_id']
        else:
            print(f"❌ Patient creation failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Patient creation failed: {e}")
        return None

def test_get_patients():
    """Test getting patients"""
    print("\n📋 Testing get patients...")
    try:
        response = requests.get(f"{BASE_URL}/patients/")
        if response.status_code == 200:
            patients = response.json()
            print(f"✅ Found {len(patients)} patients")
            return True
        else:
            print(f"❌ Get patients failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Get patients failed: {e}")
        return False

def test_upload_book():
    """Test book upload (requires a test file)"""
    print("\n📚 Testing book upload...")
    
    # Create a simple test text file
    test_file_path = "test_medical_book.txt"
    test_content = """
    Medical Textbook Sample
    
    Chapter 1: Introduction to Radiology
    
    X-ray imaging is a fundamental diagnostic tool in modern medicine. 
    It uses electromagnetic radiation to create images of internal body structures.
    
    Common findings in chest X-rays include:
    - Pneumonia: Characterized by infiltrates in lung fields
    - Pneumothorax: Air in pleural space
    - Cardiomegaly: Enlarged heart shadow
    - Pleural effusion: Fluid in pleural space
    
    Chapter 2: Chest X-ray Interpretation
    
    When interpreting chest X-rays, radiologists examine:
    1. Cardiac silhouette
    2. Lung fields
    3. Mediastinum
    4. Diaphragm
    5. Bony structures
    """
    
    try:
        with open(test_file_path, "w") as f:
            f.write(test_content)
        
        with open(test_file_path, "rb") as f:
            files = {"file": (test_file_path, f, "text/plain")}
            response = requests.post(f"{BASE_URL}/books/upload", files=files)
        
        if response.status_code == 200:
            book = response.json()
            print(f"✅ Book uploaded: {book['filename']} (ID: {book['id']})")
            return book['id']
        else:
            print(f"❌ Book upload failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Book upload failed: {e}")
        return None
    finally:
        # Clean up test file
        if os.path.exists(test_file_path):
            os.remove(test_file_path)

def test_get_books():
    """Test getting books"""
    print("\n📖 Testing get books...")
    try:
        response = requests.get(f"{BASE_URL}/books/")
        if response.status_code == 200:
            books = response.json()
            print(f"✅ Found {len(books)} books")
            return True
        else:
            print(f"❌ Get books failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Get books failed: {e}")
        return False

def test_api_documentation():
    """Test API documentation endpoints"""
    print("\n📖 Testing API documentation...")
    
    endpoints = [
        "/docs",  # Swagger UI
        "/redoc",  # ReDoc
        "/openapi.json"  # OpenAPI schema
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}")
            if response.status_code == 200:
                print(f"✅ {endpoint} accessible")
            else:
                print(f"❌ {endpoint} failed: {response.status_code}")
        except Exception as e:
            print(f"❌ {endpoint} failed: {e}")

def main():
    """Run all tests"""
    print("🚀 Starting X-ray Diagnosis System Tests")
    print("=" * 50)
    
    # Test API health
    if not test_health():
        print("\n❌ System is not ready. Please check if Docker containers are running.")
        return
    
    # Test patient operations
    patient_id = test_create_patient()
    test_get_patients()
    
    # Test book operations
    book_id = test_upload_book()
    test_get_books()
    
    # Test API documentation
    test_api_documentation()
    
    print("\n" + "=" * 50)
    print("🎉 System test completed!")
    
    if patient_id:
        print(f"📝 Test patient ID: {patient_id}")
    if book_id:
        print(f"📚 Test book ID: {book_id}")
    
    print("\n📋 Next steps:")
    print("1. Upload an X-ray image using: POST /xray/")
    print("2. Check diagnosis status using: GET /xray/{id}")
    print("3. Monitor Celery tasks at: http://localhost:5555")
    print("4. View API docs at: http://localhost:8000/docs")

if __name__ == "__main__":
    main() 