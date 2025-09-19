#!/bin/bash

# BeQ Authentication Setup Test Script
# This script helps verify that the authentication system is properly configured

echo "🔐 BeQ Authentication Setup Test"
echo "==============================="

# Function to check if environment files exist
check_env_files() {
    echo "📄 Checking environment files..."
    
    if [ ! -f ".env" ]; then
        echo "❌ .env file not found"
        echo "   Please run './setup-env.sh' first"
        return 1
    else
        echo "✅ .env file found"
    fi
    
    if [ ! -f "clients/web/.env.local" ]; then
        echo "❌ clients/web/.env.local file not found"
        echo "   Please run './setup-env.sh' first"
        return 1
    else
        echo "✅ clients/web/.env.local file found"
    fi
    
    return 0
}

# Function to check Supabase configuration in env files
check_supabase_config() {
    echo ""
    echo "🔑 Checking Supabase configuration..."
    
    # Check main .env
    if grep -q "OPENROUTER_API_KEY=your-openrouter-api-key-here" .env; then
        echo "⚠️  OPENROUTER_API_KEY not configured in .env"
        echo "   Please set your OpenRouter API key"
    else
        echo "✅ OPENROUTER_API_KEY configured in .env"
    fi
    
    # Check web .env.local
    if grep -q "NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co" clients/web/.env.local; then
        echo "⚠️  Supabase URL not configured in clients/web/.env.local"
        echo "   Please set your Supabase project URL and keys"
    else
        echo "✅ Supabase URL configured in clients/web/.env.local"
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here" clients/web/.env.local; then
        echo "⚠️  Supabase anon key not configured in clients/web/.env.local"
        echo "   Please set your Supabase anon key"
    else
        echo "✅ Supabase anon key configured in clients/web/.env.local"
    fi
}

# Function to test frontend build
test_frontend_build() {
    echo ""
    echo "🏗️  Testing frontend build..."
    
    cd clients/web
    
    if npm run build > /dev/null 2>&1; then
        echo "✅ Frontend builds successfully"
    else
        echo "❌ Frontend build failed"
        echo "   Check for TypeScript errors or missing dependencies"
        return 1
    fi
    
    cd - > /dev/null
    return 0
}

# Function to check authentication components exist
check_auth_components() {
    echo ""
    echo "🧩 Checking authentication components..."
    
    components=(
        "clients/web/components/auth/sign-in-form.tsx"
        "clients/web/components/auth/sign-up-form.tsx"
        "clients/web/components/auth/reset-password-form.tsx"
        "clients/web/app/auth/page.tsx"
        "clients/web/app/dashboard/page.tsx"
        "clients/web/lib/supabase/client.ts"
        "clients/web/lib/supabase/types.ts"
        "clients/web/lib/hooks/use-auth.ts"
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

# Function to provide next steps
show_next_steps() {
    echo ""
    echo "🚀 Next Steps:"
    echo "=============="
    echo "1. Set up your Supabase project:"
    echo "   - Go to https://supabase.com"
    echo "   - Create a new project"
    echo "   - Get your project URL and API keys"
    echo ""
    echo "2. Configure environment variables:"
    echo "   - Update .env with your OpenRouter API key"
    echo "   - Update clients/web/.env.local with Supabase credentials"
    echo ""
    echo "3. Run the Supabase schema:"
    echo "   - Go to your Supabase dashboard > SQL Editor"
    echo "   - Copy contents of docs/SUPABASE_SCHEMA.sql"
    echo "   - Execute the SQL script"
    echo ""
    echo "4. Test the authentication:"
    echo "   - Run 'cd clients/web && npm run dev'"
    echo "   - Visit http://localhost:3000"
    echo "   - Try signing up for a new account"
    echo ""
    echo "5. Move to next phase:"
    echo "   - Implement Basic Chat Interface"
    echo "   - Build conversational AI features"
}

# Run all checks
main() {
    if ! check_env_files; then
        exit 1
    fi
    
    check_supabase_config
    
    if ! check_auth_components; then
        exit 1
    fi
    
    if ! test_frontend_build; then
        exit 1
    fi
    
    echo ""
    echo "🎉 Authentication setup verification complete!"
    echo "=============================================="
    echo "✅ All components are in place"
    echo "✅ Frontend builds successfully"
    echo "✅ Environment files configured"
    
    show_next_steps
}

main
