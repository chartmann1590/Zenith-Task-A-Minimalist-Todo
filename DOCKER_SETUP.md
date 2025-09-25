# Docker Setup Guide for Todo App

This guide provides comprehensive instructions for setting up the Todo App using Docker. The setup includes automatic Docker installation detection and a complete containerized environment.

## Quick Start

The easiest way to get started is to run the automated setup script:

```bash
./docker-setup.sh
```

This script will:
- Detect your operating system
- Install Docker if not present
- Set up the complete application environment
- Start all services automatically

## Prerequisites

- Linux, macOS, or Windows
- Internet connection for downloading Docker and dependencies
- At least 2GB of available RAM
- At least 1GB of available disk space

## Manual Setup

If you prefer to set up manually or need to troubleshoot:

### 1. Install Docker

#### Linux (Ubuntu/Debian)
```bash
# Update package index
sudo apt-get update

# Install required packages
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Add Docker's GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

#### macOS
```bash
# Using Homebrew
brew install --cask docker

# Or download from: https://www.docker.com/products/docker-desktop/
```

#### Windows
Download and install Docker Desktop from: https://www.docker.com/products/docker-desktop/

### 2. Configure Environment

Copy the environment template and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your SMTP settings for email reminders:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Settings
FROM_NAME=Todo Reminder
FROM_EMAIL=your-email@gmail.com
```

### 3. Build and Start

```bash
# Build the containers
docker compose build

# Start the services
docker compose up -d

# Check status
docker compose ps
```

## Application URLs

Once running, the application will be available at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## Email Configuration

### Gmail Setup (Recommended)

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. Use the App Password in your `.env` file

### Other SMTP Providers

The app supports any SMTP provider. Common configurations:

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

#### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
```

#### Custom SMTP
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
```

## Docker Commands

### Basic Operations

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Restart services
docker compose restart

# Rebuild and start
docker compose up --build -d
```

### Development Commands

```bash
# View container status
docker compose ps

# Execute commands in containers
docker compose exec frontend sh
docker compose exec backend sh

# View resource usage
docker stats

# Clean up
docker compose down -v
docker system prune -f
```

### Testing

Run the test suite to verify everything is working:

```bash
./test-docker-setup.sh
```

## Troubleshooting

### Common Issues

#### Docker not starting
```bash
# Check Docker service status
sudo systemctl status docker

# Start Docker service
sudo systemctl start docker

# Enable Docker on boot
sudo systemctl enable docker
```

#### Permission denied
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Or run with sudo
sudo docker compose up -d
```

#### Port already in use
```bash
# Check what's using the port
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :3001

# Stop conflicting services or change ports in docker-compose.yml
```

#### Containers not starting
```bash
# Check logs
docker compose logs

# Check container status
docker compose ps

# Rebuild containers
docker compose build --no-cache
```

### Health Checks

The application includes health checks for monitoring:

```bash
# Check backend health
curl http://localhost:3001/api/health

# Check frontend
curl http://localhost:3000

# Check container health
docker compose ps
```

### Logs and Debugging

```bash
# View all logs
docker compose logs

# View specific service logs
docker compose logs frontend
docker compose logs backend

# Follow logs in real-time
docker compose logs -f

# View detailed container info
docker inspect todo-frontend
docker inspect todo-backend
```

## Production Deployment

For production deployment, consider:

1. **Environment Variables**: Use secure environment variable management
2. **SSL/TLS**: Set up reverse proxy with SSL certificates
3. **Database**: Replace in-memory storage with persistent database
4. **Monitoring**: Add monitoring and logging solutions
5. **Backup**: Implement backup strategies for data persistence

### Production Docker Compose

```yaml
version: '3.8'
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
      - "443:443"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
    volumes:
      - backend-data:/app/data
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  backend-data:
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **SMTP Credentials**: Use app passwords, not main account passwords
3. **Network Security**: Use Docker networks for service isolation
4. **Updates**: Regularly update Docker images and dependencies
5. **Access Control**: Implement proper authentication for production use

## Support

If you encounter issues:

1. Check the logs: `docker compose logs`
2. Run the test suite: `./test-docker-setup.sh`
3. Verify Docker installation: `docker --version`
4. Check system resources: `docker stats`

For additional help, refer to the main README.md or create an issue in the project repository.