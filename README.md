# X-ray Diagnosis System

A comprehensive, AI-powered X-ray diagnosis system with a modern web interface, built with FastAPI, PostgreSQL, Celery, and React. The system uses OpenAI/Gemini vision models for X-ray analysis and provides a complete patient management solution with real-time diagnosis capabilities.

## 🚀 Features

- **Modern Web Interface**: React-based frontend with intuitive patient and X-ray management
- **AI-Powered X-ray Analysis**: Uses OpenAI Vision or Gemini Vision for detailed X-ray image analysis
- **Patient Management**: Complete CRUD operations for patients with demographic information
- **X-ray Upload & Diagnosis**: Drag-and-drop file upload with real-time diagnosis processing
- **Clinical Notes**: Store and display clinical notes for each X-ray
- **Vector Search**: ChromaDB/FAISS/Pinecone integration for medical literature retrieval
- **Background Processing**: Celery-based asynchronous task processing
- **Fallback Search**: Web search integration when AI models fail
- **Book Upload & Embedding**: Process medical books (PDF, TXT, DOCX) into searchable embeddings
- **Docker Containerization**: Complete containerized setup with Docker Compose
- **Production Ready**: PostgreSQL database, Redis broker, health checks

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React         │    │   FastAPI       │    │   Celery        │
│   Frontend      │    │   (Port 8000)   │    │   Worker        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   Database      │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │     Redis       │
                    │   (Broker)      │
                    └─────────────────┘
```

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python 3.10+
- **Database**: PostgreSQL 15
- **Message Broker**: Redis 7
- **Background Tasks**: Celery
- **AI Models**: OpenAI GPT-4 Vision, Gemini Pro Vision
- **Vector Store**: ChromaDB (default), FAISS, Pinecone
- **Document Processing**: LangChain, PyPDF, python-docx
- **Containerization**: Docker, Docker Compose

## 📋 Prerequisites

- Docker and Docker Compose
- OpenAI API key (optional)
- Gemini API key (optional)
- SerpAPI key (optional, for fallback search)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd x_ray_doc
```

### 2. Environment Configuration

Copy the environment example and configure your API keys:

```bash
cp env.example .env
```

Edit `.env` file with your API keys:

```env
# AI Model Configuration
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
SERPAPI_API_KEY=your_serpapi_key_here

# Vector Store Configuration
VECTOR_STORE_TYPE=chroma  # Options: chroma, faiss, pinecone
```

### 3. Start the System

```bash
docker-compose up --build
```

This will start:
- **Frontend**: http://localhost:3000
- **API Server**: http://localhost:8000
- **Celery Worker**: Background task processing
- **PostgreSQL**: Database on port 5432
- **Redis**: Message broker on port 6379
- **Flower**: Celery monitoring on http://localhost:5555

### 4. Verify Installation

Check the API health:
```bash
curl http://localhost:8000/health
```

Access the web interface:
- Frontend: http://localhost:3000
- API Documentation: http://localhost:8000/docs

## 📚 Web Interface Usage

### 1. Patient Management

- **Create Patient**: Navigate to "New Patient" page
  - Enter patient name, date of birth, and gender
  - Age is automatically calculated from date of birth
  - Patient ID is generated automatically

- **View Patients**: Browse all patients with search and filter capabilities
- **Edit Patient**: Update patient information
- **Delete Patient**: Remove patient and all associated X-rays (with confirmation)

### 2. X-ray Upload & Diagnosis

- **Upload X-ray**: 
  - Navigate to patient's X-rays page
  - Drag and drop or click to upload X-ray images
  - Supported formats: JPG, PNG, JPEG
  - Add clinical notes during upload

- **View Diagnosis**:
  - Real-time status updates during processing
  - Detailed diagnosis report with patient information
  - Clinical notes display
  - Image preview with zoom capabilities

- **Manage X-rays**:
  - View all X-rays for a patient
  - Delete individual X-rays with confirmation
  - Navigate between patient and diagnosis views

### 3. Book Upload (Admin)

- Upload medical books (PDF, TXT, DOCX) for AI training
- Books are processed into searchable embeddings
- Used to enhance diagnosis accuracy

## 📚 API Usage

### 1. Create a Patient

```bash
curl -X POST "http://localhost:8000/patients/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "date_of_birth": "1980-05-15",
    "gender": "male"
  }'
```

### 2. Upload X-ray for Diagnosis

```bash
curl -X POST "http://localhost:8000/xray/" \
  -F "patient_id=1" \
  -F "file=@chest_xray.jpg" \
  -F "clinical_notes=Patient reports chest pain"
```

### 3. Get Patient's X-rays

```bash
curl "http://localhost:8000/xray/patient/1"
```

### 4. Get Diagnosis Details

```bash
curl "http://localhost:8000/xray/1"
```

### 5. Delete Patient (with cascade)

```bash
curl -X DELETE "http://localhost:8000/patients/1"
```

## 🔧 Configuration Options

### Vector Store Types

1. **ChromaDB** (Default): Local vector store
   ```env
   VECTOR_STORE_TYPE=chroma
   CHROMA_PERSIST_DIRECTORY=/app/vector_store
   ```

2. **FAISS**: High-performance similarity search
   ```env
   VECTOR_STORE_TYPE=faiss
   ```

3. **Pinecone**: Cloud vector database
   ```env
   VECTOR_STORE_TYPE=pinecone
   PINECONE_API_KEY=your_key
   PINECONE_ENVIRONMENT=your_env
   PINECONE_INDEX_NAME=xray-diagnosis
   ```

### AI Model Priority

The system uses the following fallback order:
1. OpenAI GPT-4 Vision
2. Gemini Pro Vision
3. Basic image analysis
4. Web search (if SerpAPI configured)

## 📊 Monitoring

### Celery Flower Dashboard

Access the Celery monitoring dashboard at http://localhost:5555 to:
- Monitor task progress
- View task history
- Check worker status
- Inspect task results

### Database Monitoring

Connect to PostgreSQL:
```bash
docker-compose exec db psql -U xray_user -d xray_diagnosis
```

### Logs

View logs for specific services:
```bash
# API logs
docker-compose logs api

# Celery logs
docker-compose logs celery

# Frontend logs
docker-compose logs frontend
```

## 🔍 Enhanced Diagnosis Process

When an X-ray is uploaded, the system follows this comprehensive workflow:

1. **Image Upload & Validation**: 
   - File type and size validation
   - Secure file storage in uploads directory
   - X-ray record creation with patient association

2. **Background Processing**: 
   - Celery task triggered for asynchronous processing
   - Real-time status updates via API

3. **Patient Information Retrieval**: 
   - Fetch complete patient demographics
   - Include patient details in diagnosis context

4. **Vision Analysis**: 
   - AI model analyzes the X-ray image
   - Detailed image description and findings

5. **Vector Search**: 
   - Relevant medical literature retrieved from uploaded books
   - Context-aware search based on image analysis

6. **Diagnosis Generation**: 
   - LLM combines vision analysis with literature
   - Patient-specific diagnosis with clinical context
   - Structured output with findings and recommendations

7. **Fallback Search**: 
   - Web search integration if AI models fail
   - Ensures diagnosis completion

8. **Result Storage**: 
   - Final diagnosis saved to database
   - Clinical notes preserved
   - Image URLs properly constructed for frontend display

## 🛡️ Security Considerations

- API keys are stored in environment variables
- File uploads are validated for type and size
- Database connections use environment-based configuration
- CORS is configured for development (adjust for production)
- Patient data is properly sanitized and validated

## 🚀 Production Deployment

For production deployment:

1. **Update Environment Variables**:
   - Use strong database passwords
   - Configure proper CORS origins
   - Set up SSL certificates

2. **Database Migration**:
   ```bash
   # Run migrations if needed
   docker-compose exec api alembic upgrade head
   ```

3. **Monitoring**:
   - Set up proper logging
   - Configure health checks
   - Monitor resource usage

4. **Scaling**:
   - Scale Celery workers: `docker-compose up --scale celery=3`
   - Use external PostgreSQL/Redis for production
   - Consider load balancing for API

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**:
   ```bash
   docker-compose down -v
   docker-compose up --build
   ```

2. **Celery Tasks Not Processing**:
   - Check Redis connection
   - Verify Celery worker is running
   - Check task logs

3. **AI Model Errors**:
   - Verify API keys are correct
   - Check API quota limits
   - Review error logs

4. **Frontend Issues**:
   - Check browser console for errors
   - Verify API connectivity
   - Clear browser cache

5. **Image Display Issues**:
   - Verify static file serving is configured
   - Check file permissions in uploads directory
   - Ensure proper image URL construction

6. **Patient Creation Errors**:
   - Verify required fields (name, date_of_birth, gender)
   - Check database schema matches API expectations
   - Run database migrations if needed

### Debug Mode

Enable debug logging:
```bash
docker-compose exec api python -c "import logging; logging.basicConfig(level=logging.DEBUG)"
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review the API documentation
- Open an issue on GitHub 