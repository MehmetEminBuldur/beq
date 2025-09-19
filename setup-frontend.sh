#!/bin/bash

# BeQ Frontend Setup Script
# This script helps you set up the Next.js frontend application

echo "🎨 BeQ Frontend Setup"
echo "===================="

# Function to check if Node.js is installed
check_nodejs() {
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js 18+ first."
        echo "   Download from: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo "❌ Node.js v$NODE_VERSION is too old. Please upgrade to Node.js 18+."
        exit 1
    fi
    
    echo "✅ Node.js $(node --version) found"
}

# Function to check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is not installed. Please install npm."
        exit 1
    fi
    
    echo "✅ npm $(npm --version) found"
}

# Check Node.js and npm
check_nodejs
check_npm

echo ""
echo "📦 Installing Frontend Dependencies:"
echo "==================================="

cd clients/web

# Install dependencies
echo "Installing npm packages..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed successfully!"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo ""
echo "🔍 Checking Environment File:"
echo "============================="

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found"
    echo "   Please run '../setup-env.sh' first to create environment files"
    echo "   Or copy .env.local.example to .env.local and fill in your values"
    exit 1
else
    echo "✅ .env.local found"
fi

echo ""
echo "🔧 Building Frontend Application:"
echo "================================="

# Build the application
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build completed successfully!"
else
    echo "❌ Frontend build failed"
    exit 1
fi

echo ""
echo "🎯 Choose how to run the frontend:"
echo "=================================="
echo "1. Development mode (with hot reload)"
echo "2. Production mode"
echo "3. Just verify setup (don't start yet)"
read -p "Enter choice (1, 2, or 3): " run_choice

case $run_choice in
    1)
        echo ""
        echo "🚀 Starting Frontend in Development Mode:"
        echo "========================================="
        
        echo "Starting Next.js development server..."
        echo "Frontend will be available at: http://localhost:3000"
        echo ""
        echo "Press Ctrl+C to stop the development server"
        echo ""
        
        # Start development server
        npm run dev
        ;;
        
    2)
        echo ""
        echo "🚀 Starting Frontend in Production Mode:"
        echo "========================================"
        
        echo "Starting Next.js production server..."
        echo "Frontend will be available at: http://localhost:3000"
        echo ""
        
        # Start production server
        npm start
        ;;
        
    3)
        echo ""
        echo "✅ Frontend setup verification complete!"
        echo ""
        echo "🎯 Ready to run frontend. You can:"
        echo "1. Run 'npm run dev' for development"
        echo "2. Run 'npm run build && npm start' for production"
        echo "3. Move to core features implementation"
        ;;
        
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

cd - > /dev/null
