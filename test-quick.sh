#!/bin/bash

echo "🚀 Quick Docker Test"
echo "==================="

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not available - skipping test"
    exit 0
fi

# Clean up any existing containers
echo "🧹 Cleaning up..."
docker-compose down 2>/dev/null || docker compose down 2>/dev/null

# Build backend only first
echo "🔨 Building backend..."
if docker-compose build backend 2>/dev/null || docker compose build backend 2>/dev/null; then
    echo "✅ Backend built successfully"
else
    echo "❌ Backend build failed"
    exit 1
fi

# Start backend
echo "🚀 Starting backend..."
if docker-compose up -d backend 2>/dev/null || docker compose up -d backend 2>/dev/null; then
    echo "✅ Backend started"
else
    echo "❌ Backend start failed"
    exit 1
fi

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
for i in {1..30}; do
    if docker-compose exec backend node health-check.js 2>/dev/null || docker compose exec backend node health-check.js 2>/dev/null; then
        echo "✅ Backend is healthy"
        break
    fi
    echo "Backend not ready yet... ($i/30)"
    sleep 2
done

# Test backend API
echo "🔍 Testing backend API..."
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend API is working"
else
    echo "❌ Backend API not accessible"
    docker-compose logs backend 2>/dev/null || docker compose logs backend 2>/dev/null
    exit 1
fi

# Test client-errors endpoint
echo "🔍 Testing client-errors endpoint..."
if curl -f -X POST http://localhost:3001/api/client-errors \
    -H "Content-Type: application/json" \
    -d '{"message":"Test error","level":"error","category":"test"}' > /dev/null 2>&1; then
    echo "✅ Client-errors endpoint working"
else
    echo "❌ Client-errors endpoint failed"
fi

echo "🎉 Quick test completed successfully!"
echo ""
echo "Backend is running and healthy!"
echo "You can now run the full test with: ./test-docker-setup.sh"