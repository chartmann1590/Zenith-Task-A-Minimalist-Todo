#!/bin/bash

# Test script for Docker setup
# This script tests if the Docker setup is working correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_header() {
    echo -e "${YELLOW}================================${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}================================${NC}"
}

# Test Docker installation
test_docker() {
    print_header "Testing Docker Installation"
    
    if command -v docker >/dev/null 2>&1; then
        print_success "Docker is installed"
        docker --version
    else
        print_error "Docker is not installed"
        return 1
    fi
    
    if docker info >/dev/null 2>&1; then
        print_success "Docker daemon is running"
    else
        print_error "Docker daemon is not running"
        return 1
    fi
    
    if docker compose version >/dev/null 2>&1; then
        print_success "Docker Compose is available"
        docker compose version
    else
        print_error "Docker Compose is not available"
        return 1
    fi
}

# Test containers
test_containers() {
    print_header "Testing Containers"
    
    # Check if containers are running
    if docker compose ps | grep -q "Up"; then
        print_success "Containers are running"
        docker compose ps
    else
        print_error "No containers are running"
        return 1
    fi
    
    # Test backend health
    print_status "Testing backend health endpoint..."
    if curl -s http://localhost:3001/api/health > /dev/null; then
        print_success "Backend health endpoint is responding"
    else
        print_error "Backend health endpoint is not responding"
        return 1
    fi
    
    # Test frontend
    print_status "Testing frontend..."
    if curl -s http://localhost:3000 > /dev/null; then
        print_success "Frontend is responding"
    else
        print_error "Frontend is not responding"
        return 1
    fi
}

# Test API endpoints
test_api() {
    print_header "Testing API Endpoints"
    
    # Test health endpoint
    print_status "Testing /api/health..."
    response=$(curl -s http://localhost:3001/api/health)
    if echo "$response" | grep -q "OK"; then
        print_success "Health endpoint working"
    else
        print_error "Health endpoint not working"
        return 1
    fi
    
    # Test SMTP settings endpoint
    print_status "Testing /api/smtp/settings..."
    response=$(curl -s http://localhost:3001/api/smtp/settings)
    if echo "$response" | grep -q "success"; then
        print_success "SMTP settings endpoint working"
    else
        print_error "SMTP settings endpoint not working"
        return 1
    fi
    
    # Test tasks endpoint
    print_status "Testing /api/tasks..."
    response=$(curl -s http://localhost:3001/api/tasks)
    if echo "$response" | grep -q "success"; then
        print_success "Tasks endpoint working"
    else
        print_error "Tasks endpoint not working"
        return 1
    fi
}

# Main test function
main() {
    print_header "Docker Setup Test Suite"
    
    local failed=0
    
    # Run tests
    test_docker || failed=1
    test_containers || failed=1
    test_api || failed=1
    
    # Summary
    print_header "Test Summary"
    if [ $failed -eq 0 ]; then
        print_success "All tests passed! Docker setup is working correctly."
        echo ""
        echo "Application URLs:"
        echo "  Frontend: http://localhost:3000"
        echo "  Backend: http://localhost:3001"
        echo "  Health Check: http://localhost:3001/api/health"
    else
        print_error "Some tests failed. Please check the setup."
        exit 1
    fi
}

# Run main function
main "$@"