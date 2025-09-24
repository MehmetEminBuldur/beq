#!/bin/bash

# BeQ Docker Services Test Script
# This script tests that all services are working correctly in Docker

echo "🐳 BeQ Docker Services Test"
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test service health
test_service() {
    local service_name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    echo -n "Testing $service_name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ OK${NC} (HTTP $response)"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC} (HTTP $response)"
        return 1
    fi
}

# Function to test if container is running
test_container() {
    local container_name="$1"
    echo -n "Testing container $container_name... "
    
    if docker ps --filter "name=$container_name" --filter "status=running" --format "{{.Names}}" | grep -q "$container_name"; then
        echo -e "${GREEN}✅ RUNNING${NC}"
        return 0
    else
        echo -e "${RED}❌ NOT RUNNING${NC}"
        return 1
    fi
}

echo ""
echo "📋 Testing Container Status"
echo "----------------------------"

# Test if containers are running
test_container "beq-orchestrator"
test_container "beq-scheduler" 
test_container "beq-rag-recommender"
test_container "beq-calendar-integration"
test_container "beq-web"
test_container "beq-qdrant"

echo ""
echo "🔗 Testing Service Health Endpoints"
echo "------------------------------------"

# Test service health endpoints
test_service "Orchestrator" "http://localhost:8000/health"
test_service "Scheduler" "http://localhost:8001/health"
test_service "RAG Recommender" "http://localhost:8002/health"
test_service "Calendar Integration" "http://localhost:8003/health"
test_service "Qdrant" "http://localhost:6333/health"

echo ""
echo "🌐 Testing Frontend"
echo "-------------------"

test_service "Web Frontend" "http://localhost:3000"

echo ""
echo "🔌 Testing API Endpoints"
echo "------------------------"

# Test some API endpoints
test_service "Orchestrator API" "http://localhost:8000/api/v1/status" "200"

echo ""
echo "📊 Docker Service Logs (last 5 lines)"
echo "======================================="

for service in orchestrator scheduler rag-recommender calendar-integration web; do
    echo ""
    echo -e "${YELLOW}📝 $service logs:${NC}"
    docker logs "beq-$service" --tail 5 2>/dev/null || echo "❌ No logs available"
done

echo ""
echo "🏁 Test Complete!"
echo ""
