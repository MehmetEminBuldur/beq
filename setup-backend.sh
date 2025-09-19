#!/bin/bash

# BeQ Backend Services Setup Script
# This script helps you get all FastAPI microservices running

echo "🚀 BeQ Backend Services Setup"
echo "============================="


# Function to install dependencies for a service
install_service_deps() {
    local service_name=$1
    local service_path=$2
    
    echo "📦 Installing dependencies for $service_name..."
    
    if [ -f "$service_path/requirements.txt" ]; then
        cd "$service_path"
        pip3 install -r requirements.txt
        if [ $? -eq 0 ]; then
            echo "✅ $service_name dependencies installed"
        else
            echo "❌ Failed to install $service_name dependencies"
            return 1
        fi
        cd - > /dev/null
    else
        echo "⚠️  No requirements.txt found for $service_name"
    fi
}

# Function to check if .env file exists
check_env_file() {
    local env_file=$1
    local service_name=$2
    
    if [ ! -f "$env_file" ]; then
        echo "⚠️  $env_file not found for $service_name"
        echo "   Please run './setup-env.sh' first to create environment files"
        return 1
    fi
    return 0
}

# Check Python installation
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

python_version=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "✅ Found Python $python_version"

echo ""
echo "🔧 Installing Backend Services Dependencies:"
echo "==========================================="

# Install orchestrator dependencies
install_service_deps "Orchestrator" "services/orchestrator" || exit 1

# Install scheduler dependencies
install_service_deps "Scheduler" "services/scheduler" || exit 1

# Install RAG recommender dependencies
install_service_deps "RAG Recommender" "services/rag-recommender" || exit 1

# Install calendar integration dependencies
install_service_deps "Calendar Integration" "services/calendar-integration" || exit 1

echo ""
echo "🔍 Checking Environment Files:"
echo "=============================="

# Check main .env file
check_env_file ".env" "Main Orchestrator" || exit 1

# Check service .env files
check_env_file "services/scheduler/.env" "Scheduler" || exit 1
check_env_file "services/rag-recommender/.env" "RAG Recommender" || exit 1
check_env_file "services/calendar-integration/.env" "Calendar Integration" || exit 1

echo ""
echo "🎯 Choose how to run the services:"
echo "=================================="
echo "1. Run services individually (recommended for development)"
echo "2. Run all services with Docker Compose"
echo "3. Just verify setup (don't start services yet)"
read -p "Enter choice (1, 2, or 3): " run_choice

case $run_choice in
    1)
        echo ""
        echo "🚀 Starting Services Individually:"
        echo "=================================="
        
        # Function to start a service
        start_service() {
            local service_name=$1
            local service_path=$2
            local port=$3
            
            echo "Starting $service_name on port $port..."
            cd "$service_path"
            
            # Start service in background
            python3 -m uvicorn main:app --host 0.0.0.0 --port $port --reload &
            local pid=$!
            echo "$service_name started with PID: $pid"
            
            cd - > /dev/null
            
            # Store PID for later
            eval "${service_name// /_}_PID=$pid"
        }
        
        # Start orchestrator
        start_service "Orchestrator" "services/orchestrator" "8000"
        
        # Start scheduler
        start_service "Scheduler" "services/scheduler" "8001"
        
        # Start RAG recommender
        start_service "RAG Recommender" "services/rag-recommender" "8002"
        
        # Start calendar integration
        start_service "Calendar Integration" "services/calendar-integration" "8003"
        
        echo ""
        echo "✅ All services started!"
        echo ""
        echo "🌐 Service URLs:"
        echo "================"
        echo "Orchestrator:     http://localhost:8000"
        echo "Scheduler:        http://localhost:8001"
        echo "RAG Recommender:  http://localhost:8002"
        echo "Calendar Integration: http://localhost:8003"
        echo ""
        echo "📚 API Documentation:"
        echo "====================="
        echo "Orchestrator:     http://localhost:8000/docs"
        echo "Scheduler:        http://localhost:8001/docs"
        echo "RAG Recommender:  http://localhost:8002/docs"
        echo "Calendar Integration: http://localhost:8003/docs"
        echo ""
        echo "🛑 To stop all services:"
        echo "kill $ORCHESTRATOR_PID $SCHEDULER_PID $RAG_RECOMMENDER_PID $CALENDAR_INTEGRATION_PID"
        ;;
        
    2)
        echo ""
        echo "🐳 Starting Services with Docker Compose:"
        echo "========================================="
        
        # Check if Docker is running
        if ! docker info > /dev/null 2>&1; then
            echo "❌ Docker is not running. Please start Docker first."
            exit 1
        fi
        
        echo "Building and starting all services..."
        docker-compose up --build -d orchestrator scheduler rag-recommender calendar-integration
        
        echo ""
        echo "✅ Services started with Docker!"
        echo ""
        echo "🌐 Service URLs:"
        echo "================"
        echo "Orchestrator:     http://localhost:8000"
        echo "Scheduler:        http://localhost:8001"
        echo "RAG Recommender:  http://localhost:8002"
        echo "Calendar Integration: http://localhost:8003"
        echo ""
        echo "📋 To view logs:"
        echo "docker-compose logs -f [service-name]"
        echo ""
        echo "🛑 To stop services:"
        echo "docker-compose down"
        ;;
        
    3)
        echo ""
        echo "✅ Setup verification complete!"
        echo ""
        echo "🎯 Ready to run services. You can:"
        echo "1. Run './setup-backend.sh' again and choose option 1 or 2"
        echo "2. Start services manually with Docker Compose"
        echo "3. Move to frontend setup"
        ;;
        
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🚀 Next: Frontend Dependencies Setup!"
echo "Run './setup-frontend.sh' to set up the Next.js application."
