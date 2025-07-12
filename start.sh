#!/bin/bash

echo "🚀 Starting X-ray Diagnosis System..."
echo "======================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
    echo "📝 Please edit .env file with your API keys before continuing."
    echo "   Required keys: OPENAI_API_KEY, GEMINI_API_KEY (optional), SERPAPI_API_KEY (optional)"
    read -p "Press Enter to continue after editing .env file..."
fi

# Build and start containers
echo "🔨 Building and starting containers..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if API is responding
echo "🔍 Checking API health..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null; then
        echo "✅ API is ready!"
        break
    fi
    echo "⏳ Waiting for API... (attempt $i/30)"
    sleep 2
done

if [ $i -eq 30 ]; then
    echo "❌ API failed to start. Check logs with: docker-compose logs api"
    exit 1
fi

echo ""
echo "🎉 X-ray Diagnosis System is running!"
echo "======================================"
echo "📊 API Server:     http://localhost:8000"
echo "📖 API Docs:       http://localhost:8000/docs"
echo "🔍 Health Check:   http://localhost:8000/health"
echo "🌸 Celery Flower:  http://localhost:5555"
echo "🗄️  Database:       localhost:5432"
echo "🔴 Redis:          localhost:6379"
echo ""
echo "📋 Useful commands:"
echo "  View logs:       docker-compose logs -f"
echo "  Stop system:     docker-compose down"
echo "  Restart:         docker-compose restart"
echo "  Test system:     python test_system.py"
echo ""
echo "🔧 Next steps:"
echo "1. Upload medical books: POST /books/upload"
echo "2. Create patients: POST /patients/"
echo "3. Upload X-rays: POST /xray/"
echo "4. Monitor tasks: http://localhost:5555" 