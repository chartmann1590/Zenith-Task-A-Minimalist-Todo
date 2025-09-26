#!/bin/bash

echo "=== Testing Docker Compose Configuration ==="
echo ""

# Clean up any existing containers
echo "Cleaning up existing containers..."
docker-compose down --remove-orphans 2>/dev/null || true

# Remove any existing images to force rebuild
echo "Removing existing images..."
docker rmi $(docker images -q todo-frontend todo-backend 2>/dev/null) 2>/dev/null || true

echo ""
echo "Building and starting services..."
echo "This may take a few minutes on first run..."

# Build and start services
if docker-compose up -d --build; then
    echo ""
    echo "✅ Services started successfully!"
    echo ""
    echo "Checking service status..."
    docker-compose ps
    
    echo ""
    echo "Checking service health..."
    sleep 10
    
    # Check if services are healthy
    if docker-compose ps | grep -q "Up (healthy)"; then
        echo "✅ At least one service is healthy"
    else
        echo "⚠️  Services may still be starting up"
    fi
    
    echo ""
    echo "Service URLs:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend: http://localhost:3001"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop services: docker-compose down"
    
else
    echo ""
    echo "❌ Failed to start services"
    echo ""
    echo "Checking logs for errors..."
    docker-compose logs --tail=50
    exit 1
fi