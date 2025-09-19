#!/bin/bash

# BeQ Environment Setup Script
# This script helps you set up your environment files from the examples

echo "🚀 BeQ Environment Setup"
echo "========================"

# Function to copy env file if it doesn't exist
copy_env_file() {
    local source=$1
    local target=$2
    local service_name=$3
    
    if [ -f "$target" ]; then
        echo "✅ $service_name .env file already exists"
    elif [ -f "$source" ]; then
        cp "$source" "$target"
        echo "✅ Created $service_name .env file from example"
    else
        echo "❌ $service_name .env.example not found"
    fi
}

# Main orchestrator .env
copy_env_file ".env.example" ".env" "Main Orchestrator"

# Service .env files
copy_env_file "services/scheduler/.env.example" "services/scheduler/.env" "Scheduler Service"
copy_env_file "services/rag-recommender/.env.example" "services/rag-recommender/.env" "RAG Recommender Service"
copy_env_file "services/calendar-integration/.env.example" "services/calendar-integration/.env" "Calendar Integration Service"

# Frontend .env
copy_env_file "clients/web/.env.local.example" "clients/web/.env.local" "Frontend (Next.js)"

echo ""
echo "🎯 Next Steps:"
echo "1. Edit each .env file and replace placeholder values with real ones"
echo "2. Get your OpenRouter API key from https://openrouter.ai/keys"
echo "3. Set up your Supabase project and get the keys"
echo "4. Generate secure SECRET_KEY values using: python -c \"import secrets; print(secrets.token_hex(32))\""
echo ""
echo "📝 Key files to edit:"
echo "   - .env (main orchestrator)"
echo "   - services/*/env (each service)"
echo "   - clients/web/.env.local (frontend)"
