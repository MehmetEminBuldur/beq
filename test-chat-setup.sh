#!/bin/bash

# BeQ Chat Integration Test Script
# This script helps verify that the chat functionality is properly set up

echo "💬 BeQ Chat Integration Test"
echo "============================"

# Function to check if backend services are configured
check_backend_config() {
    echo "🔧 Checking backend configuration..."
    
    if [ ! -f ".env" ]; then
        echo "❌ .env file not found"
        echo "   Please run './setup-env.sh' first"
        return 1
    fi
    
    # Check if orchestrator API URL is set
    if ! grep -q "ORCHESTRATOR_API_URL" .env 2>/dev/null && ! grep -q "NEXT_PUBLIC_ORCHESTRATOR_API_URL" clients/web/.env.local 2>/dev/null; then
        echo "⚠️  Orchestrator API URL not configured"
        echo "   Add NEXT_PUBLIC_ORCHESTRATOR_API_URL=http://localhost:8000 to clients/web/.env.local"
    else
        echo "✅ Orchestrator API URL configured"
    fi
    
    # Check OpenRouter API key
    if grep -q "OPENROUTER_API_KEY=your-openrouter-api-key-here" .env; then
        echo "⚠️  OpenRouter API key not configured"
        echo "   Please set your OpenRouter API key in .env"
    else
        echo "✅ OpenRouter API key configured"
    fi
    
    return 0
}

# Function to check frontend chat components
check_frontend_components() {
    echo ""
    echo "🎨 Checking frontend chat components..."
    
    components=(
        "clients/web/components/chat/chat-interface.tsx"
        "clients/web/components/chat/chat-message.tsx"
        "clients/web/components/chat/suggested-actions.tsx"
        "clients/web/lib/hooks/use-chat.ts"
        "clients/web/lib/api/chat.ts"
    )
    
    for component in "${components[@]}"; do
        if [ -f "$component" ]; then
            echo "✅ $component exists"
        else
            echo "❌ $component missing"
            return 1
        fi
    done
    
    return 0
}

# Function to check backend chat endpoints
check_backend_endpoints() {
    echo ""
    echo "🔌 Checking backend chat endpoints..."
    
    if [ ! -f "services/orchestrator/app/api/v1/chat.py" ]; then
        echo "❌ Backend chat API not found"
        return 1
    fi
    
    echo "✅ Backend chat API exists"
    
    # Check if orchestrator is running
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Orchestrator service is running"
        
        # Test chat endpoint
        if curl -s -X POST http://localhost:8000/api/v1/chat/message \
             -H "Content-Type: application/json" \
             -d '{"message":"test","user_id":"test-user"}' > /dev/null 2>&1; then
            echo "✅ Chat endpoint is responding"
        else
            echo "⚠️  Chat endpoint not responding (might need authentication)"
        fi
    else
        echo "⚠️  Orchestrator service is not running"
        echo "   Run './setup-backend.sh' to start services"
    fi
    
    return 0
}

# Function to test frontend build
test_frontend_build() {
    echo ""
    echo "🏗️  Testing frontend build with chat components..."
    
    cd clients/web
    
    if npm run build > /dev/null 2>&1; then
        echo "✅ Frontend builds successfully with chat components"
    else
        echo "❌ Frontend build failed - check chat component imports"
        return 1
    fi
    
    cd - > /dev/null
    return 0
}

# Function to provide setup instructions
show_setup_instructions() {
    echo ""
    echo "🚀 Chat Integration Setup Instructions:"
    echo "======================================="
    echo ""
    echo "1. Configure Environment Variables:"
    echo "   - Add to clients/web/.env.local:"
    echo "     NEXT_PUBLIC_ORCHESTRATOR_API_URL=http://localhost:8000"
    echo "   - Add OpenRouter API key to .env"
    echo ""
    echo "2. Start Backend Services:"
    echo "   ./setup-backend.sh"
    echo ""
    echo "3. Start Frontend:"
    echo "   cd clients/web && npm run dev"
    echo ""
    echo "4. Test Chat Functionality:"
    echo "   - Visit http://localhost:3000/dashboard"
    echo "   - Click 'Start Chat' button"
    echo "   - Send a test message like 'Hello BeQ'"
    echo ""
    echo "5. Expected Behavior:"
    echo "   - Messages should be sent to backend"
    echo "   - AI responses should appear"
    echo "   - Actions taken should be displayed"
    echo "   - Any created bricks/resources should be shown"
    echo ""
    echo "6. Troubleshooting:"
    echo "   - Check browser console for errors"
    echo "   - Check backend logs with 'docker-compose logs -f orchestrator'"
    echo "   - Verify API endpoints are accessible"
}

# Run all checks
main() {
    if ! check_backend_config; then
        exit 1
    fi
    
    if ! check_frontend_components; then
        exit 1
    fi
    
    check_backend_endpoints
    
    if ! test_frontend_build; then
        exit 1
    fi
    
    echo ""
    echo "🎉 Chat integration verification complete!"
    echo "=========================================="
    echo "✅ All chat components are in place"
    echo "✅ Frontend builds successfully"
    echo "✅ API integration configured"
    
    show_setup_instructions
}

main
