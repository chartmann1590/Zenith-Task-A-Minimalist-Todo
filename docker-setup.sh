#!/bin/bash

# Todo App Docker Setup Script
# This script detects if Docker is installed, installs it if needed, and sets up the entire project

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            OS=$NAME
            VER=$VERSION_ID
        else
            OS="Linux"
            VER="Unknown"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macOS"
        VER=$(sw_vers -productVersion)
    elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        OS="Windows"
        VER="Unknown"
    else
        OS="Unknown"
        VER="Unknown"
    fi
    print_status "Detected OS: $OS $VER"
}

# Function to install Docker on Linux
install_docker_linux() {
    print_header "Installing Docker on Linux"
    
    # Update package index
    print_status "Updating package index..."
    sudo apt-get update
    
    # Install required packages
    print_status "Installing required packages..."
    sudo apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    print_status "Adding Docker's GPG key..."
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up the repository
    print_status "Setting up Docker repository..."
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update package index again
    print_status "Updating package index with Docker repository..."
    sudo apt-get update
    
    # Install Docker Engine
    print_status "Installing Docker Engine..."
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add current user to docker group
    print_status "Adding current user to docker group..."
    sudo usermod -aG docker $USER
    
    print_success "Docker installed successfully!"
    print_warning "Please log out and log back in for group changes to take effect, or run: newgrp docker"
}

# Function to install Docker on macOS
install_docker_macos() {
    print_header "Installing Docker on macOS"
    
    if command_exists brew; then
        print_status "Installing Docker using Homebrew..."
        brew install --cask docker
        print_success "Docker Desktop installed via Homebrew!"
        print_warning "Please start Docker Desktop from Applications folder"
    else
        print_error "Homebrew not found. Please install Docker Desktop manually from:"
        print_error "https://www.docker.com/products/docker-desktop/"
        exit 1
    fi
}

# Function to install Docker on Windows
install_docker_windows() {
    print_header "Installing Docker on Windows"
    print_error "Please install Docker Desktop manually from:"
    print_error "https://www.docker.com/products/docker-desktop/"
    print_error "After installation, restart your computer and run this script again."
    exit 1
}

# Function to check and install Docker
check_and_install_docker() {
    print_header "Checking Docker Installation"
    
    if command_exists docker; then
        print_success "Docker is already installed!"
        docker --version
        
        # Check if Docker daemon is running
        if docker info >/dev/null 2>&1; then
            print_success "Docker daemon is running!"
        else
            print_warning "Docker is installed but daemon is not running."
            print_status "Attempting to start Docker daemon..."
            
            if [[ "$OSTYPE" == "linux-gnu"* ]]; then
                sudo systemctl start docker
                sudo systemctl enable docker
                print_success "Docker daemon started!"
            elif [[ "$OSTYPE" == "darwin"* ]]; then
                print_warning "Please start Docker Desktop from Applications folder"
                print_status "Waiting for Docker to start..."
                sleep 10
            fi
        fi
    else
        print_warning "Docker is not installed. Installing now..."
        
        case $OS in
            "Ubuntu"*|"Debian"*|"Linux Mint"*)
                install_docker_linux
                ;;
            "macOS")
                install_docker_macos
                ;;
            "Windows")
                install_docker_windows
                ;;
            *)
                print_error "Unsupported operating system: $OS"
                print_error "Please install Docker manually from: https://www.docker.com/get-started"
                exit 1
                ;;
        esac
    fi
}

# Function to check Docker Compose
check_docker_compose() {
    print_header "Checking Docker Compose"
    
    if docker compose version >/dev/null 2>&1; then
        print_success "Docker Compose is available!"
        docker compose version
    else
        print_error "Docker Compose is not available!"
        print_error "Please ensure you have Docker Compose installed."
        exit 1
    fi
}

# Function to create environment file
setup_environment() {
    print_header "Setting up Environment Configuration"
    
    if [ ! -f .env ]; then
        print_status "Creating .env file from template..."
        cp .env.example .env
        print_success "Environment file created!"
        print_warning "Please edit .env file with your SMTP settings for email reminders"
        print_status "You can configure email settings later in the app's Settings page"
    else
        print_success "Environment file already exists!"
    fi
}

# Function to build and start containers
build_and_start() {
    print_header "Building and Starting Todo App"
    
    print_status "Building Docker images..."
    docker compose build --no-cache
    
    print_status "Starting containers..."
    docker compose up -d
    
    print_success "Todo App is starting up!"
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check if services are running
    if docker compose ps | grep -q "Up"; then
        print_success "Services are running!"
        
        # Display service status
        print_header "Service Status"
        docker compose ps
        
        # Display URLs
        print_header "Application URLs"
        echo -e "${CYAN}Frontend:${NC} http://localhost:3000"
        echo -e "${CYAN}Backend API:${NC} http://localhost:3001"
        echo -e "${CYAN}Health Check:${NC} http://localhost:3001/api/health"
        
        print_header "Next Steps"
        echo -e "${YELLOW}1.${NC} Open http://localhost:3000 in your browser"
        echo -e "${YELLOW}2.${NC} Go to Settings page to configure email reminders"
        echo -e "${YELLOW}3.${NC} Test the email functionality"
        echo ""
        echo -e "${YELLOW}To stop the application:${NC} docker compose down"
        echo -e "${YELLOW}To view logs:${NC} docker compose logs -f"
        echo -e "${YELLOW}To restart:${NC} docker compose restart"
        
    else
        print_error "Failed to start services!"
        print_status "Checking logs..."
        docker compose logs
        exit 1
    fi
}

# Function to test the application
test_application() {
    print_header "Testing Application"
    
    print_status "Testing backend health endpoint..."
    if curl -s http://localhost:3001/api/health > /dev/null; then
        print_success "Backend is responding!"
    else
        print_warning "Backend health check failed, but this might be normal during startup"
    fi
    
    print_status "Testing frontend..."
    if curl -s http://localhost:3000 > /dev/null; then
        print_success "Frontend is responding!"
    else
        print_warning "Frontend might still be starting up"
    fi
}

# Function to show help
show_help() {
    echo "Todo App Docker Setup Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --help, -h          Show this help message"
    echo "  --skip-docker       Skip Docker installation check"
    echo "  --skip-build        Skip building Docker images"
    echo "  --test-only         Only test existing setup"
    echo "  --clean             Clean up existing containers and images"
    echo ""
    echo "Examples:"
    echo "  $0                  # Full setup with Docker installation"
    echo "  $0 --skip-docker    # Setup without checking Docker"
    echo "  $0 --test-only      # Test existing setup"
    echo "  $0 --clean          # Clean up and rebuild"
}

# Function to clean up
cleanup() {
    print_header "Cleaning up existing setup"
    
    print_status "Stopping containers..."
    docker compose down -v
    
    print_status "Removing images..."
    docker compose down --rmi all
    
    print_status "Cleaning up volumes..."
    docker volume prune -f
    
    print_success "Cleanup completed!"
}

# Main function
main() {
    print_header "Todo App Docker Setup"
    echo -e "${CYAN}This script will set up the Todo App with Docker${NC}"
    echo ""
    
    # Parse command line arguments
    SKIP_DOCKER=false
    SKIP_BUILD=false
    TEST_ONLY=false
    CLEAN=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help|-h)
                show_help
                exit 0
                ;;
            --skip-docker)
                SKIP_DOCKER=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --test-only)
                TEST_ONLY=true
                shift
                ;;
            --clean)
                CLEAN=true
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Detect OS
    detect_os
    
    # Clean up if requested
    if [ "$CLEAN" = true ]; then
        cleanup
        if [ "$TEST_ONLY" = true ]; then
            exit 0
        fi
    fi
    
    # Test only mode
    if [ "$TEST_ONLY" = true ]; then
        test_application
        exit 0
    fi
    
    # Check and install Docker
    if [ "$SKIP_DOCKER" = false ]; then
        check_and_install_docker
        check_docker_compose
    else
        print_warning "Skipping Docker installation check"
    fi
    
    # Setup environment
    setup_environment
    
    # Build and start if not skipping build
    if [ "$SKIP_BUILD" = false ]; then
        build_and_start
    else
        print_status "Starting existing containers..."
        docker compose up -d
    fi
    
    # Test the application
    test_application
    
    print_header "Setup Complete!"
    print_success "Todo App is now running in Docker containers!"
    print_status "Visit http://localhost:3000 to start using the app"
}

# Run main function with all arguments
main "$@"