#!/bin/bash

# Todo App Development Startup Script
echo "🚀 Starting Todo App with Email Reminders..."

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "❌ Backend directory not found!"
    exit 1
fi

# Install backend dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

# Check if .env file exists in backend
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Backend .env file not found!"
    echo "📝 Please copy backend/.env.example to backend/.env and configure your SMTP settings"
    echo "   cp backend/.env.example backend/.env"
    echo ""
    echo "🔧 For Gmail setup:"
    echo "   1. Enable 2-Factor Authentication"
    echo "   2. Generate an App Password"
    echo "   3. Use the App Password in your .env file"
    echo ""
    read -p "Press Enter to continue anyway (SMTP won't work without proper config)..."
fi

# Start backend server in background
echo "🔧 Starting backend server on port 3001..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo "❌ Backend server failed to start!"
    echo "   Check backend logs for errors"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Backend server started successfully!"

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start frontend development server
echo "🎨 Starting frontend development server on port 3000..."
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo "   Health Check: http://localhost:3001/api/health"
echo ""
echo "📧 To test email functionality:"
echo "   1. Go to Settings page in the app"
echo "   2. Configure your SMTP settings"
echo "   3. Test the connection and send a test email"
echo ""
echo "🛑 Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    echo "✅ All servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start frontend server
npm run dev

# If frontend exits, cleanup
cleanup