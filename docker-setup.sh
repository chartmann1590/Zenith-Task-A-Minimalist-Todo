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

# Function to validate email address
validate_email() {
    local email=$1
    if [[ $email =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to validate port number
validate_port() {
    local port=$1
    if [[ $port =~ ^[0-9]+$ ]] && [ $port -ge 1 ] && [ $port -le 65535 ]; then
        return 0
    else
        return 1
    fi
}

# Function to get user input with default value
get_input() {
    local prompt=$1
    local default=$2
    local var_name=$3
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " input
        eval "$var_name=\${input:-$default}"
    else
        read -p "$prompt: " input
        eval "$var_name=\"$input\""
    fi
}

# Function to get SMTP configuration interactively
get_smtp_config() {
    print_header "SMTP Configuration"
    echo -e "${CYAN}Configure your SMTP settings for email reminders${NC}"
    echo ""
    
    # SMTP Host
    get_input "SMTP Host (e.g., smtp.gmail.com)" "smtp.gmail.com" "SMTP_HOST"
    
    # SMTP Port
    while true; do
        get_input "SMTP Port" "587" "SMTP_PORT"
        if validate_port "$SMTP_PORT"; then
            break
        else
            print_error "Invalid port number. Please enter a number between 1 and 65535."
        fi
    done
    
    # SMTP User (Email)
    while true; do
        get_input "SMTP Username (your email address)" "" "SMTP_USER"
        if validate_email "$SMTP_USER"; then
            break
        else
            print_error "Invalid email address. Please enter a valid email."
        fi
    done
    
    # SMTP Password
    echo -e "${YELLOW}Note: For Gmail, use an App Password, not your regular password${NC}"
    echo -e "${YELLOW}To create an App Password:${NC}"
    echo -e "${YELLOW}1. Enable 2-Factor Authentication on your Google account${NC}"
    echo -e "${YELLOW}2. Go to Google Account → Security → 2-Step Verification → App passwords${NC}"
    echo -e "${YELLOW}3. Generate a new app password for 'Mail'${NC}"
    echo ""
    read -s -p "SMTP Password (App Password for Gmail): " SMTP_PASS
    echo ""
    
    # From Name
    get_input "From Name (sender display name)" "Todo Reminder" "FROM_NAME"
    
    # From Email
    while true; do
        get_input "From Email (sender email address)" "$SMTP_USER" "FROM_EMAIL"
        if validate_email "$FROM_EMAIL"; then
            break
        else
            print_error "Invalid email address. Please enter a valid email."
        fi
    done
    
    # Rate Limiting (optional)
    echo ""
    print_status "Rate Limiting Configuration (optional)"
    get_input "Rate Limit Window (milliseconds)" "900000" "RATE_LIMIT_WINDOW_MS"
    get_input "Max Requests per Window" "100" "RATE_LIMIT_MAX_REQUESTS"
}

# Function to display configuration summary
show_config_summary() {
    print_header "Configuration Summary"
    echo -e "${CYAN}SMTP Host:${NC} $SMTP_HOST"
    echo -e "${CYAN}SMTP Port:${NC} $SMTP_PORT"
    echo -e "${CYAN}SMTP User:${NC} $SMTP_USER"
    echo -e "${CYAN}SMTP Password:${NC} ${SMTP_PASS:0:4}****"
    echo -e "${CYAN}From Name:${NC} $FROM_NAME"
    echo -e "${CYAN}From Email:${NC} $FROM_EMAIL"
    echo -e "${CYAN}Rate Limit Window:${NC} $RATE_LIMIT_WINDOW_MS ms"
    echo -e "${CYAN}Max Requests:${NC} $RATE_LIMIT_MAX_REQUESTS"
    echo ""
}

# Function to create environment file
setup_environment() {
    print_header "Setting up Environment Configuration"
    
    if [ -f .env ]; then
        print_warning "Environment file (.env) already exists!"
        echo ""
        echo "Current configuration:"
        echo "======================"
        if [ -f .env ]; then
            grep -E "^[A-Z_]+" .env | sed 's/=.*/=***/' | head -10
        fi
        echo ""
        
        while true; do
            read -p "Do you want to (u)se existing config, (r)ecreate it, or (e)dit manually? [u/r/e]: " choice
            case $choice in
                [Uu]* )
                    print_success "Using existing environment configuration!"
                    return 0
                    ;;
                [Rr]* )
                    print_status "Recreating environment configuration..."
                    break
                    ;;
                [Ee]* )
                    print_status "Opening .env file for manual editing..."
                    if command_exists nano; then
                        nano .env
                    elif command_exists vim; then
                        vim .env
                    elif command_exists vi; then
                        vi .env
                    else
                        print_warning "No text editor found. Please edit .env manually."
                        print_status "Environment file location: $(pwd)/.env"
                    fi
                    print_success "Environment configuration updated!"
                    return 0
                    ;;
                * )
                    print_error "Please enter 'u' for use existing, 'r' for recreate, or 'e' for edit manually."
                    ;;
            esac
        done
    fi
    
    # Get SMTP configuration interactively
    get_smtp_config
    
    # Show configuration summary
    show_config_summary
    
    # Confirm configuration
    while true; do
        read -p "Is this configuration correct? [y/n]: " confirm
        case $confirm in
            [Yy]* )
                break
                ;;
            [Nn]* )
                print_status "Let's reconfigure..."
                get_smtp_config
                show_config_summary
                ;;
            * )
                print_error "Please enter 'y' for yes or 'n' for no."
                ;;
        esac
    done
    
    # Create .env file
    print_status "Creating .env file..."
    cat > .env << EOF
# Todo App Environment Configuration
# Generated by docker-setup.sh on $(date)

# SMTP Configuration for Email Reminders
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS

# Email Settings
FROM_NAME=$FROM_NAME
FROM_EMAIL=$FROM_EMAIL

# Rate Limiting (optional)
RATE_LIMIT_WINDOW_MS=$RATE_LIMIT_WINDOW_MS
RATE_LIMIT_MAX_REQUESTS=$RATE_LIMIT_MAX_REQUESTS

# Application Settings
NODE_ENV=production
EOF
    
    # Also create backend .env file
    print_status "Creating backend .env file..."
    cat > backend/.env << EOF
# Backend Environment Configuration
# Generated by docker-setup.sh on $(date)

# SMTP Configuration for Email Reminders
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS

# Email Settings
FROM_NAME=$FROM_NAME
FROM_EMAIL=$FROM_EMAIL

# Rate Limiting (optional)
RATE_LIMIT_WINDOW_MS=$RATE_LIMIT_WINDOW_MS
RATE_LIMIT_MAX_REQUESTS=$RATE_LIMIT_MAX_REQUESTS

# Application Settings
NODE_ENV=production
PORT=3001
EOF
    
    print_success "Environment files created successfully!"
    print_status "Frontend .env: $(pwd)/.env"
    print_status "Backend .env: $(pwd)/backend/.env"
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