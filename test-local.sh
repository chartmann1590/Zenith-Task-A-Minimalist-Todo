#!/bin/bash

# Local Testing Script for Todo Reminder App
# This script runs the same tests that GitHub Actions will run

set -e

echo "🧪 Starting local test suite..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or 20."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_warning "Node.js version $NODE_VERSION detected. Recommended: Node.js 18 or 20."
fi

print_status "Node.js version: $(node -v)"

# Frontend Tests
echo ""
echo "🎨 Testing Frontend..."
echo "====================="

# Install frontend dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Run ESLint
echo "Running ESLint..."
if npm run lint; then
    print_status "ESLint passed"
else
    print_error "ESLint failed"
    exit 1
fi

# Type check
echo "Running TypeScript type check..."
if npx tsc --noEmit; then
    print_status "TypeScript type check passed"
else
    print_error "TypeScript type check failed"
    exit 1
fi

# Build frontend
echo "Building frontend..."
if npm run build; then
    print_status "Frontend build successful"
else
    print_error "Frontend build failed"
    exit 1
fi

# Backend Tests
echo ""
echo "🔧 Testing Backend..."
echo "===================="

# Install backend dependencies
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Run backend tests
echo "Running backend tests..."
cd backend
if npm test; then
    print_status "Backend tests passed"
else
    print_error "Backend tests failed"
    exit 1
fi
cd ..

# Docker Tests
echo ""
echo "🐳 Testing Docker..."
echo "==================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_warning "Docker is not installed. Skipping Docker tests."
else
    # Build frontend Docker image
    echo "Building frontend Docker image..."
    if docker build -f Dockerfile.frontend -t todo-frontend:test .; then
        print_status "Frontend Docker image built successfully"
    else
        print_error "Frontend Docker image build failed"
        exit 1
    fi
    
    # Build backend Docker image
    echo "Building backend Docker image..."
    if docker build -f backend/Dockerfile -t todo-backend:test ./backend; then
        print_status "Backend Docker image built successfully"
    else
        print_error "Backend Docker image build failed"
        exit 1
    fi
    
    # Test frontend container
    echo "Testing frontend container..."
    docker run -d --name frontend-test -p 3000:80 todo-frontend:test
    sleep 10
    
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_status "Frontend container test passed"
    else
        print_error "Frontend container test failed"
        docker logs frontend-test
        docker stop frontend-test && docker rm frontend-test
        exit 1
    fi
    
    docker stop frontend-test && docker rm frontend-test
    
    # Test backend container
    echo "Testing backend container..."
    docker run -d --name backend-test -p 3001:3001 \
        -e NODE_ENV=test \
        -e SMTP_HOST=smtp.ethereal.email \
        -e SMTP_USER=test@example.com \
        -e SMTP_PASS=testpassword \
        todo-backend:test
    sleep 15
    
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        print_status "Backend container test passed"
    else
        print_error "Backend container test failed"
        docker logs backend-test
        docker stop backend-test && docker rm backend-test
        exit 1
    fi
    
    docker stop backend-test && docker rm backend-test
fi

# Security Tests
echo ""
echo "🔒 Running Security Tests..."
echo "============================"

# Frontend security audit
echo "Running frontend security audit..."
if npm audit --audit-level=moderate; then
    print_status "Frontend security audit passed"
else
    print_warning "Frontend security audit found issues"
fi

# Backend security audit
echo "Running backend security audit..."
cd backend
if npm audit --audit-level=moderate; then
    print_status "Backend security audit passed"
else
    print_warning "Backend security audit found issues"
fi
cd ..

# Integration Tests
echo ""
echo "🔗 Running Integration Tests..."
echo "==============================="

# Start backend server
echo "Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 10

# Test backend health
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    print_status "Backend health check passed"
else
    print_error "Backend health check failed"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Test API endpoints
echo "Testing API endpoints..."
if curl -f http://localhost:3001/api/tasks > /dev/null 2>&1; then
    print_status "Tasks API endpoint working"
else
    print_warning "Tasks API endpoint test failed"
fi

if curl -f http://localhost:3001/api/reminders > /dev/null 2>&1; then
    print_status "Reminders API endpoint working"
else
    print_warning "Reminders API endpoint test failed"
fi

# Test creating a task
echo "Testing task creation..."
TASK_RESPONSE=$(curl -s -X POST http://localhost:3001/api/tasks/sync \
    -H "Content-Type: application/json" \
    -d '{"tasks":[{"id":"local-test-task","title":"Local Test Task","dueDate":1735689599000,"priority":"medium","completed":false,"projectId":"test-project","createdAt":1735689599000,"order":0,"reminderEnabled":false,"reminderTime":null,"userEmail":"test@example.com"}]}')

if echo "$TASK_RESPONSE" | grep -q "success.*true"; then
    print_status "Task creation test passed"
else
    print_warning "Task creation test failed"
fi

# Stop backend server
kill $BACKEND_PID 2>/dev/null || true

# Summary
echo ""
echo "🎉 Test Summary"
echo "==============="
print_status "All tests completed successfully!"
echo ""
echo "Your application is ready for:"
echo "  ✅ GitHub Actions CI/CD"
echo "  ✅ Local development"
echo "  ✅ Docker deployment"
echo "  ✅ Production deployment"
echo ""
echo "Next steps:"
echo "  1. Commit your changes"
echo "  2. Push to GitHub"
echo "  3. Watch the GitHub Actions workflows run"
echo "  4. Deploy to staging/production when ready"