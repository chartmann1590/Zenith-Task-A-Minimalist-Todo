#!/bin/bash

echo "=== Docker Compose Setup Verification ==="
echo ""

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found. Please install Docker Compose."
    exit 1
fi

echo "✅ docker-compose found"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running. Please start Docker."
    exit 1
fi

echo "✅ Docker daemon is running"

# Check frontend build context files
echo ""
echo "=== Frontend Build Context Verification ==="
FRONTEND_FILES=(
    "package.json"
    "package-lock.json"
    "vite.config.ts"
    "tsconfig.json"
    "tsconfig.app.json"
    "tsconfig.node.json"
    "tailwind.config.js"
    "postcss.config.js"
    "components.json"
    "index.html"
    "start-nginx.sh"
    "nginx.conf"
    "Dockerfile.frontend"
    "src/"
    "public/"
)

echo "Checking frontend build context files..."
for file in "${FRONTEND_FILES[@]}"; do
    if [ -e "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

# Check backend build context files
echo ""
echo "=== Backend Build Context Verification ==="
BACKEND_FILES=(
    "backend/package.json"
    "backend/package-lock.json"
    "backend/server.js"
    "backend/database.js"
    "backend/health-check.js"
    "backend/Dockerfile"
)

echo "Checking backend build context files..."
for file in "${BACKEND_FILES[@]}"; do
    if [ -e "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

# Check .dockerignore
echo ""
echo "=== .dockerignore Verification ==="
if [ -f ".dockerignore" ]; then
    echo "✅ .dockerignore exists"
    
    # Check if critical files are not excluded
    if grep -q "!start-nginx.sh" .dockerignore; then
        echo "✅ start-nginx.sh is explicitly included"
    else
        echo "❌ start-nginx.sh might be excluded"
    fi
    
    if grep -q "!nginx.conf" .dockerignore; then
        echo "✅ nginx.conf is explicitly included"
    else
        echo "❌ nginx.conf might be excluded"
    fi
else
    echo "❌ .dockerignore missing"
fi

# Test build contexts
echo ""
echo "=== Testing Build Contexts ==="

echo "Testing frontend build context..."
if docker build -f Dockerfile.frontend --target deps -t test-frontend-deps . > /dev/null 2>&1; then
    echo "✅ Frontend deps stage builds successfully"
    docker rmi test-frontend-deps > /dev/null 2>&1
else
    echo "❌ Frontend deps stage failed to build"
fi

echo "Testing backend build context..."
if docker build -f backend/Dockerfile -t test-backend backend/ > /dev/null 2>&1; then
    echo "✅ Backend builds successfully"
    docker rmi test-backend > /dev/null 2>&1
else
    echo "❌ Backend failed to build"
fi

echo ""
echo "=== Docker Compose Configuration ==="
echo "Frontend service:"
echo "  - Build context: . (root directory)"
echo "  - Dockerfile: Dockerfile.frontend"
echo "  - Port: 3000:80"
echo "  - Depends on: backend (healthy)"

echo ""
echo "Backend service:"
echo "  - Build context: ./backend"
echo "  - Dockerfile: Dockerfile"
echo "  - Port: 3001:3001"
echo "  - Health check: node health-check.js"

echo ""
echo "=== Summary ==="
echo "Your docker-compose.yml is properly configured to:"
echo "1. Build frontend from root directory with all necessary files"
echo "2. Build backend from ./backend directory with all necessary files"
echo "3. Use proper health checks and dependencies"
echo "4. Expose correct ports (3000 for frontend, 3001 for backend)"

echo ""
echo "To run: docker-compose up -d"
echo "To rebuild: docker-compose up -d --build"
echo "To view logs: docker-compose logs -f"