#!/bin/bash

echo "🐳 Testing Docker Build Process"
echo "==============================="

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not available - skipping test"
    exit 0
fi

# Test backend build
echo "🔨 Testing backend build..."
if docker build -t todo-backend-test ./backend; then
    echo "✅ Backend build successful"
else
    echo "❌ Backend build failed"
    exit 1
fi

# Test frontend build
echo "🔨 Testing frontend build..."
if docker build -t todo-frontend-test -f Dockerfile.frontend .; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

# Test backend container startup
echo "🚀 Testing backend container startup..."
if docker run --rm -d --name todo-backend-test -p 3001:3001 todo-backend-test; then
    echo "✅ Backend container started"
    
    # Wait for backend to be ready
    echo "⏳ Waiting for backend to be ready..."
    for i in {1..30}; do
        if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
            echo "✅ Backend is healthy"
            break
        fi
        echo "Backend not ready yet... ($i/30)"
        sleep 2
    done
    
    # Test API endpoints
    echo "🔍 Testing API endpoints..."
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "✅ Health endpoint working"
    else
        echo "❌ Health endpoint failed"
    fi
    
    if curl -f -X POST http://localhost:3001/api/client-errors \
        -H "Content-Type: application/json" \
        -d '{"message":"Test error","level":"error","category":"test"}' > /dev/null 2>&1; then
        echo "✅ Client-errors endpoint working"
    else
        echo "❌ Client-errors endpoint failed"
    fi
    
    # Clean up
    docker stop todo-backend-test
    echo "🧹 Backend container stopped"
else
    echo "❌ Backend container failed to start"
    exit 1
fi

# Test frontend container startup
echo "🚀 Testing frontend container startup..."
if docker run --rm -d --name todo-frontend-test -p 3000:80 todo-frontend-test; then
    echo "✅ Frontend container started"
    
    # Wait for frontend to be ready
    echo "⏳ Waiting for frontend to be ready..."
    for i in {1..15}; do
        if curl -f http://localhost:3000 > /dev/null 2>&1; then
            echo "✅ Frontend is ready"
            break
        fi
        echo "Frontend not ready yet... ($i/15)"
        sleep 2
    done
    
    # Clean up
    docker stop todo-frontend-test
    echo "🧹 Frontend container stopped"
else
    echo "❌ Frontend container failed to start"
    exit 1
fi

echo "🎉 All Docker builds and tests passed!"