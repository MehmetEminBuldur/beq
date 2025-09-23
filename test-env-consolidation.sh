#!/bin/bash

# Test script for environment variable consolidation
echo "🧪 Testing Environment Variable Consolidation"
echo "============================================="

# Check if global.env.example exists
if [ ! -f "global.env.example" ]; then
    echo "❌ global.env.example not found"
    exit 1
fi
echo "✅ global.env.example exists"

# Check if setup script exists
if [ ! -f "setup-env.sh" ]; then
    echo "❌ setup-env.sh not found"
    exit 1
fi
echo "✅ setup-env.sh exists"

# Test setup script
echo ""
echo "🔧 Testing setup script..."
if [ ! -f "global.env" ]; then
    echo "Creating global.env from example..."
    ./setup-env.sh
fi

# Check if global.env was created
if [ ! -f "global.env" ]; then
    echo "❌ setup-env.sh failed to create global.env"
    exit 1
fi
echo "✅ global.env created successfully"

# Validate docker-compose syntax
echo ""
echo "🐳 Validating Docker Compose configuration..."
if docker-compose config --quiet; then
    echo "✅ docker-compose.yml syntax is valid"
else
    echo "❌ docker-compose.yml has syntax errors"
    exit 1
fi

# Check that all services use env_file
echo ""
echo "📋 Checking service configurations..."

services=("orchestrator" "scheduler" "rag-recommender" "calendar-integration" "web")
for service in "${services[@]}"; do
    if grep -A 5 "$service:" docker-compose.yml | grep -q "env_file:"; then
        echo "✅ $service uses env_file configuration"
    else
        echo "❌ $service does not use env_file configuration"
    fi
done

# Check that environment blocks are removed
echo ""
echo "🔍 Checking for leftover environment blocks..."
if grep -q "environment:" docker-compose.yml; then
    echo "⚠️  Found leftover environment blocks in docker-compose.yml"
    echo "   This might be intentional (e.g., for qdrant service)"
else
    echo "✅ No environment blocks found in docker-compose.yml"
fi

# Check Dockerfile hardcoded values
echo ""
echo "📄 Checking Dockerfiles for hardcoded environment variables..."

# Check web Dockerfile
if grep -q "ENV NEXT_PUBLIC" clients/web/Dockerfile; then
    echo "❌ Found hardcoded NEXT_PUBLIC variables in web Dockerfile"
else
    echo "✅ No hardcoded NEXT_PUBLIC variables in web Dockerfile"
fi

# Check Python service Dockerfiles for app-specific ENV
python_services=("orchestrator" "scheduler" "rag-recommender" "calendar-integration")
for service in "${python_services[@]}"; do
    if grep -q "ENV OPENAI_API_KEY\|ENV DATABASE_URL\|ENV SUPABASE" "services/$service/Dockerfile"; then
        echo "❌ Found hardcoded app variables in $service Dockerfile"
    else
        echo "✅ No hardcoded app variables in $service Dockerfile"
    fi
done

# Count variables in global.env.example
echo ""
echo "📊 Environment variable statistics:"
if [ -f "global.env.example" ]; then
    total_vars=$(grep -c "^[A-Z]" global.env.example || echo "0")
    echo "   Total variables in global.env.example: $total_vars"
fi

# Check .gitignore
echo ""
echo "🔒 Checking .gitignore configuration..."
if grep -q "global.env" .gitignore && ! grep -q "!global.env.example" .gitignore; then
    echo "⚠️  global.env is ignored but global.env.example might not be explicitly allowed"
elif grep -q "global.env" .gitignore && grep -q "!global.env.example" .gitignore; then
    echo "✅ Proper .gitignore configuration for environment files"
else
    echo "❌ .gitignore not properly configured for environment files"
fi

echo ""
echo "🎉 Environment consolidation test completed!"
echo ""
echo "📝 Next steps:"
echo "1. Edit global.env with your actual API keys and secrets"
echo "2. Run: docker-compose up -d"
echo "3. Check logs: docker-compose logs"
echo "4. Test endpoints to ensure all services are working"
