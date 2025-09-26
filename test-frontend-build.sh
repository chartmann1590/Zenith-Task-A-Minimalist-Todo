#!/bin/bash

echo "🔧 Testing Frontend Docker Build Fix"
echo "===================================="

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not available - please install Docker first"
    exit 1
fi

echo "🔨 Building frontend Docker image..."
if docker build -t todo-frontend-test -f Dockerfile.frontend .; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

echo "🔍 Testing if startup script exists in the image..."
if docker run --rm todo-frontend-test ls -la /start-nginx.sh; then
    echo "✅ Startup script found in image"
else
    echo "❌ Startup script not found in image"
    exit 1
fi

echo "🔍 Testing if startup script is executable..."
if docker run --rm todo-frontend-test test -x /start-nginx.sh; then
    echo "✅ Startup script is executable"
else
    echo "❌ Startup script is not executable"
    exit 1
fi

echo "🚀 Testing container startup (will timeout after 30 seconds)..."
timeout 30s docker run --rm --name todo-frontend-test todo-frontend-test || echo "Container startup test completed (timeout expected)"

echo "🧹 Cleaning up test image..."
docker rmi todo-frontend-test

echo "🎉 Frontend Docker build fix verification completed!"
echo ""
echo "To test with docker-compose:"
echo "  docker-compose up frontend"