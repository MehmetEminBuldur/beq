#!/bin/bash

# BeQ Database Setup Script
# This script helps you set up the database for BeQ development

echo "🗄️  BeQ Database Setup"
echo "======================"

# Check if we're using Supabase or local PostgreSQL
echo "Choose your database setup:"
echo "1. Supabase (recommended for production/development)"
echo "2. Local PostgreSQL (for local development)"
read -p "Enter choice (1 or 2): " db_choice

if [ "$db_choice" = "1" ]; then
    echo ""
    echo "📋 Supabase Setup Steps:"
    echo "========================"
    echo "1. Go to https://supabase.com and create a new project"
    echo "2. Wait for the project to be fully initialized (5-10 minutes)"
    echo "3. Go to Settings > API in your Supabase dashboard"
    echo "4. Copy the following values:"
    echo "   - Project URL"
    echo "   - Anon public key"
    echo "   - Service role key"
    echo ""
    echo "5. Update your .env files with these values:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL=your-project-url"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
    echo "   - SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    echo ""
    
    read -p "Do you have your Supabase project ready? (y/n): " supabase_ready
    
    if [ "$supabase_ready" = "y" ]; then
        echo ""
        echo "🚀 Applying BeQ Schema to Supabase:"
        echo "===================================="
        echo "1. Go to your Supabase dashboard"
        echo "2. Navigate to SQL Editor"
        echo "3. Copy the contents of docs/SUPABASE_SCHEMA.sql"
        echo "4. Paste and execute the SQL script"
        echo ""
        echo "✅ After running the schema, your database will be ready!"
    else
        echo "Please complete the Supabase setup first, then run this script again."
        exit 0
    fi

elif [ "$db_choice" = "2" ]; then
    echo ""
    echo "🐘 Local PostgreSQL Setup:"
    echo "=========================="
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker first."
        exit 1
    fi
    
    echo "Starting local PostgreSQL database..."
    docker-compose --profile local-db up -d postgres
    
    echo "Waiting for PostgreSQL to be ready..."
    sleep 10
    
    # Check if database is ready
    if docker-compose exec postgres pg_isready -U beq > /dev/null 2>&1; then
        echo "✅ PostgreSQL is running!"
        echo ""
        echo "📊 Database Connection Details:"
        echo "==============================="
        echo "Host: localhost"
        echo "Port: 5432"
        echo "Database: beq_local"
        echo "Username: beq"
        echo "Password: beq_password"
        echo ""
        echo "🔧 Update your .env files with these connection strings:"
        echo "DATABASE_URL=postgresql+asyncpg://beq:beq_password@localhost:5432/beq_local"
        echo ""
        echo "📝 Note: The database is empty. You'll need to create tables manually or"
        echo "         switch to Supabase for the full schema with RLS policies."
    else
        echo "❌ Failed to start PostgreSQL. Check Docker logs:"
        echo "docker-compose logs postgres"
        exit 1
    fi
else
    echo "❌ Invalid choice. Please run the script again and choose 1 or 2."
    exit 1
fi

echo ""
echo "🎯 Next Steps:"
echo "=============="
echo "1. Update your .env files with the correct database URLs"
echo "2. Test the database connection by running one of the services"
echo "3. If using Supabase, verify tables were created in the SQL editor"
echo ""
echo "🚀 Ready to proceed to backend services setup!"
