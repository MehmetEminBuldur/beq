#!/bin/bash

# BeQ Development Process Cleanup Script
# Usage: ./scripts/cleanup-dev.sh

echo "🧹 Cleaning up BeQ development processes..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Kill processes on common development ports
echo "📡 Checking development ports..."

ports=(3000 3001 8000 8001 8002 8003 5432)

for port in "${ports[@]}"; do
    if lsof -ti:$port >/dev/null 2>&1; then
        echo "🔴 Port $port is in use, killing process..."
        kill -9 $(lsof -ti:$port) 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "✅ Killed process on port $port"
        fi
    else
        echo "✅ Port $port is free"
    fi
done

# Kill Next.js development processes
echo "⚛️  Looking for Next.js processes..."
if pgrep -f "next-dev" >/dev/null; then
    echo "🔴 Found Next.js dev processes, killing..."
    pkill -f "next-dev"
    echo "✅ Next.js dev processes killed"
else
    echo "✅ No Next.js dev processes found"
fi

# Kill any remaining node processes that might be hanging
echo "🟡 Checking for hanging Node.js processes..."
hanging_processes=$(ps aux | grep -E "(node.*next|npm.*dev)" | grep -v grep | awk '{print $2}')

if [ -n "$hanging_processes" ]; then
    echo "🔴 Found hanging processes: $hanging_processes"
    echo "$hanging_processes" | xargs kill -9 2>/dev/null
    echo "✅ Cleaned up hanging processes"
else
    echo "✅ No hanging processes found"
fi

# Clear npm cache if needed
echo "📦 Clearing npm cache..."
npm cache clean --force >/dev/null 2>&1

# Remove Next.js cache
echo "🗂️  Clearing Next.js cache..."
rm -rf .next 2>/dev/null

echo "✨ Cleanup complete! You can now run 'npm run dev' safely."
echo ""
echo "💡 Remember to use Ctrl+C (not Ctrl+Z) to stop development server properly!"