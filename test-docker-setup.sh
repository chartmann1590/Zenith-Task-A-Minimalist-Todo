#!/bin/bash

# Test script for Docker setup
echo "Testing Docker setup for Todo App..."

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    echo "Please install Docker and Docker Compose to test the setup"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available"
    echo "Please install Docker Compose to test the setup"
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose down 2>/dev/null || docker compose down 2>/dev/null

# Build the containers
echo "🔨 Building containers..."
if docker-compose build; then
    echo "✅ Containers built successfully"
elif docker compose build; then
    echo "✅ Containers built successfully"
else
    echo "❌ Failed to build containers"
    exit 1
fi

# Start the services
echo "🚀 Starting services..."
if docker-compose up -d; then
    echo "✅ Services started successfully"
elif docker compose up -d; then
    echo "✅ Services started successfully"
else
    echo "❌ Failed to start services"
    exit 1
fi

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
echo "Checking backend health..."
for i in {1..30}; do
  if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend is ready"
    break
  fi
  echo "Backend not ready yet, waiting... ($i/30)"
  sleep 2
done

echo "Checking frontend..."
for i in {1..15}; do
  if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is ready"
    break
  fi
  echo "Frontend not ready yet, waiting... ($i/15)"
  sleep 2
done

# Test backend health
echo "🔍 Testing backend health..."
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    echo "Backend logs:"
    docker-compose logs backend 2>/dev/null || docker compose logs backend 2>/dev/null
fi

# Test frontend
echo "🔍 Testing frontend..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible"
    echo "Frontend logs:"
    docker-compose logs frontend 2>/dev/null || docker compose logs frontend 2>/dev/null
fi

# Test API proxy
echo "🔍 Testing API proxy..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ API proxy is working"
else
    echo "❌ API proxy is not working"
    echo "Debugging information:"
    echo "Container status:"
    docker-compose ps 2>/dev/null || docker compose ps 2>/dev/null
    echo ""
    echo "Backend logs:"
    docker-compose logs backend 2>/dev/null || docker compose logs backend 2>/dev/null
    echo ""
    echo "Frontend logs:"
    docker-compose logs frontend 2>/dev/null || docker compose logs frontend 2>/dev/null
    echo ""
    echo "Network information:"
    docker network ls 2>/dev/null
    echo ""
    echo "Backend container network:"
    docker inspect todo-backend --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null || echo "Backend container not found"
fi

# Test client-errors endpoint
echo "🔍 Testing client-errors endpoint..."
if curl -f -X POST http://localhost:3000/api/client-errors \
    -H "Content-Type: application/json" \
    -d '{"message":"Test error","level":"error","category":"test"}' > /dev/null 2>&1; then
    echo "✅ Client-errors endpoint is working"
else
    echo "❌ Client-errors endpoint is not working"
fi

echo "🎉 Docker setup test completed!"
echo ""
echo "You can now access the app at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:3001"
echo "  API via proxy: http://localhost:3000/api"
echo ""
echo "To stop the services, run:"
echo "  docker-compose down"
echo "  or"
echo "  docker compose down"