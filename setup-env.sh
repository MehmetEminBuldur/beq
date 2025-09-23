#!/bin/bash

# BeQ Environment Setup Script
# This script helps you set up your global environment file

echo "🚀 BeQ Environment Setup"
echo "========================"

# Check if global.env already exists
if [ -f "global.env" ]; then
    echo "✅ Global environment file already exists"
    echo "ℹ️  Location: global.env"
elif [ -f "global.env.example" ]; then
    cp "global.env.example" "global.env"
    echo "✅ Created global.env from example template"
    echo "ℹ️  Location: global.env"
else
    echo "❌ global.env.example not found"
    exit 1
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Edit global.env and replace placeholder values with real ones"
echo "2. Get your OpenAI API key from https://platform.openai.com/api-keys"
echo "3. Set up your Supabase project and get the keys from your dashboard"
echo "4. Generate secure SECRET_KEY values using: python -c \"import secrets; print(secrets.token_hex(32))\""
echo "5. For Google Calendar: Get OAuth credentials from Google Cloud Console"
echo "6. For Microsoft Calendar: Get OAuth credentials from Azure Portal"
echo ""
echo "📝 Key variables to set in global.env:"
echo "   - OPENAI_API_KEY (required for AI features)"
echo "   - NEXT_PUBLIC_SUPABASE_URL (required for database)"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY (required for database)"
echo "   - SUPABASE_SERVICE_ROLE_KEY (required for backend services)"
echo "   - SECRET_KEY and SESSION_SECRET (required for security)"
echo "   - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (optional, for Google Calendar)"
echo "   - MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET (optional, for Microsoft Calendar)"
echo ""
echo "🐳 All Docker services will now use the single global.env file!"
echo "🔒 Remember to add global.env to .gitignore to keep your secrets safe"
