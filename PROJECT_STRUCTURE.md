# X-ray Diagnosis System - Project Structure

```
x_ray_ai/
├── 📁 api/                          # FastAPI routers
│   ├── __init__.py
│   ├── patients.py                  # Patient management endpoints
│   ├── xray.py                      # X-ray upload and diagnosis endpoints
│   └── books.py                     # Book upload and management endpoints
│
├── 📁 db/                           # Database layer
│   ├── __init__.py
│   ├── database.py                  # Database connection and session
│   ├── models.py                    # SQLAlchemy models
│   └── schemas.py                   # Pydantic schemas
│
├── 📁 services/                     # Business logic services
│   ├── __init__.py
│   ├── ai_service.py                # LLM and AI model integration
│   └── vision_service.py            # Vision model for X-ray analysis
│
├── 📁 vector_store/                 # Vector database integration
│   ├── __init__.py
│   └── vector_store.py              # ChromaDB/FAISS/Pinecone wrapper
│
├── 📁 tasks/                        # Celery background tasks
│   ├── __init__.py
│   ├── diagnosis_tasks.py           # X-ray diagnosis processing
│   └── book_tasks.py                # Book embedding processing
│
├── 📁 utils/                        # Utilities and configuration
│   ├── __init__.py
│   └── config.py                    # Environment configuration
│
├── 🐳 Dockerfile                    # Container definition
├── 🐳 docker-compose.yml            # Multi-container orchestration
├── 📋 requirements.txt              # Python dependencies
├── 🔧 env.example                   # Environment variables template
├── 🚀 start.sh                      # Startup script
├── 🧪 test_system.py                # System testing script
├── 📖 README.md                     # Comprehensive documentation
├── 📁 PROJECT_STRUCTURE.md          # This file
└── 🚫 .gitignore                    # Git ignore rules
```

## 🏗️ Architecture Overview

### Core Components

1. **FastAPI Application** (`main.py`)
   - Main application entry point
   - CORS middleware
   - Router registration
   - Health check endpoints

2. **Database Layer** (`db/`)
   - PostgreSQL with SQLAlchemy ORM
   - Models: Patient, XRay, Book
   - Pydantic schemas for validation

3. **API Endpoints** (`api/`)
   - RESTful CRUD operations
   - File upload handling
   - Background task triggering

4. **AI Services** (`services/`)
   - OpenAI/Gemini vision models
   - LangChain integration
   - Fallback search logic

5. **Vector Store** (`vector_store/`)
   - Multi-vector store support (ChromaDB, FAISS, Pinecone)
   - Document embedding and retrieval
   - Similarity search

6. **Background Tasks** (`tasks/`)
   - Celery task definitions
   - Asynchronous processing
   - Progress tracking

### Data Flow

```
1. X-ray Upload → FastAPI → Database → Celery Task
2. Vision Analysis → AI Service → Vector Search → Diagnosis Generation
3. Book Upload → Document Processing → Embedding → Vector Store
4. Diagnosis Query → Vector Retrieval → LLM → Final Diagnosis
```

### Technology Stack

- **Backend**: FastAPI, Python 3.10+
- **Database**: PostgreSQL 15
- **Message Broker**: Redis 7
- **Background Tasks**: Celery
- **AI Models**: OpenAI GPT-4 Vision, Gemini Pro Vision
- **Vector Store**: ChromaDB (default), FAISS, Pinecone
- **Document Processing**: LangChain, PyPDF, python-docx
- **Containerization**: Docker, Docker Compose

### Key Features

✅ **Production Ready**: Docker containerization, health checks, monitoring
✅ **Scalable**: Background processing, multiple vector store options
✅ **AI-Powered**: Vision analysis, LLM diagnosis, vector search
✅ **Fallback Logic**: Web search when AI models fail
✅ **Monitoring**: Celery Flower dashboard, comprehensive logging
✅ **Documentation**: Interactive API docs, comprehensive README

### Services

- **API Server**: Port 8000 (FastAPI)
- **Celery Worker**: Background task processing
- **PostgreSQL**: Port 5432 (Database)
- **Redis**: Port 6379 (Message broker)
- **Flower**: Port 5555 (Celery monitoring)

### Environment Variables

Key configuration options:
- `OPENAI_API_KEY`: OpenAI API access
- `GEMINI_API_KEY`: Gemini API access
- `SERPAPI_API_KEY`: Fallback web search
- `VECTOR_STORE_TYPE`: chroma/faiss/pinecone
- `DATABASE_URL`: PostgreSQL connection
- `REDIS_URL`: Redis connection

### Quick Start Commands

```bash
# Start the system
./start.sh

# Or manually
docker-compose up --build

# Test the system
python test_system.py

# View logs
docker-compose logs -f

# Stop the system
docker-compose down
```

This system provides a complete, production-ready X-ray diagnosis backend with AI-powered analysis, vector search capabilities, and robust background processing. 