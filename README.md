# Zenith Task: A Minimalist Todo Platform with Email Reminders

Zenith Task is a visually stunning, minimalist, and highly interactive todo list application designed to enhance productivity through an elegant and intuitive user experience. The application features a clean two-column layout: a sidebar for project navigation and a main content area for managing tasks. Users can create projects, add tasks with details like priority and due dates, and track their progress seamlessly. The entire experience is enhanced with subtle micro-interactions and smooth animations, making task management not just efficient, but delightful.

## Key Features

### ✨ Core Functionality
- **Minimalist & Modern UI**: A clean, uncluttered interface with custom favicon and professional branding
- **Complete Project Management**: Create, rename, and **delete projects** with full CRUD operations
- **Full Task CRUD**: Create, read, update, and delete tasks with drag-and-drop reordering
- **Email Reminders**: Get email notifications for your tasks with customizable reminder times
- **SMTP Integration**: Full SMTP support with connection testing and beautiful HTML email templates

### 🌐 Connectivity & Access
- **Remote Access Ready**: Works seamlessly from any device on your network (LAN/WiFi)
- **Cross-Platform Compatibility**: Optimized for both HTTP and HTTPS contexts
- **CORS-Enabled**: Proper cross-origin support for remote access and API integration

### 🎨 User Experience
- **Interactive Experience**: Smooth animations, hover states, and micro-interactions powered by Framer Motion
- **Drag & Drop**: Intuitive task reordering with @dnd-kit integration
- **Responsive Design**: Flawless performance and layout across all device sizes, from mobile to desktop
- **Professional Branding**: Custom "Zenith Task" favicon and optimized page titles

### 🔧 Technical Excellence
- **Docker Ready**: Complete containerization with automated setup scripts
- **Database Persistence**: SQLite backend with full data persistence and integrity
- **Modern Stack**: React + TypeScript + Tailwind CSS + shadcn/ui components
- **Performance Optimized**: Fast loading, efficient state management with Zustand

## Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite 6
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **State Management**: Zustand with Immer middleware
- **Animations**: Framer Motion for micro-interactions
- **Drag & Drop**: @dnd-kit for task reordering
- **Icons**: Lucide React
- **Notifications**: Sonner for toast messages

### Backend
- **Runtime**: Node.js + Express.js
- **Database**: SQLite with custom abstraction layer
- **Email**: Nodemailer with HTML templates and SMTP
- **Scheduling**: Node-cron for automated reminders
- **Security**: Helmet, CORS, rate limiting, input validation

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (production)
- **Package Managers**: Bun (frontend), npm (backend)
- **Development**: Hot module replacement, auto-restart

## Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Bun](https://bun.sh/) installed on your machine (for frontend)
- [Node.js](https://nodejs.org/) installed on your machine (for backend)
- SMTP email account (Gmail recommended)

## 🐳 Docker Setup (Recommended)

The easiest way to get started is using Docker. This will automatically handle all dependencies and setup:

```bash
# Run the automated Docker setup script
./docker-setup.sh
```

This script will:
- Detect your operating system
- Install Docker if not present
- **Interactively configure environment variables** (SMTP settings, email configuration)
- Set up the complete application environment
- Start all services automatically

**Application URLs after setup:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

### 🌐 Remote Access
The application supports remote access from other devices on your network:
- **LAN Access**: `http://[YOUR_IP]:3000` (e.g., `http://192.168.1.100:3000`)
- **Mobile Devices**: Works perfectly on smartphones and tablets
- **Cross-Origin**: Automatic CORS configuration for network access

For detailed Docker setup instructions, see [DOCKER_SETUP.md](./docs/DOCKER_SETUP.md). For complete documentation, see [Documentation Index](./docs/README.md).

### Docker Commands

```bash
# Start the application
docker compose up -d

# Stop the application
docker compose down

# View logs
docker compose logs -f

# Test the setup
./test-docker-setup.sh
```

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/chartmann1590/Zenith-Task-A-Minimalist-Todo.git
   cd zenith-task
   ```

2. **Start both frontend and backend:**
   ```bash
   ./start-dev.sh
   ```

This will automatically:
- Install backend dependencies
- Start the backend server on port 3001
- Start the frontend development server on port 3000
- Open the application in your browser

### Manual Setup

If you prefer to set up manually:

1. **Install frontend dependencies:**
   ```bash
   bun install
   ```

2. **Set up backend:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your SMTP settings
   npm run dev
   ```

3. **Start frontend:**
   ```bash
   bun run dev
   ```

### Email Configuration

1. **Gmail Setup (Recommended):**
   - Enable 2-Factor Authentication on your Google account
   - Generate an App Password: Google Account → Security → 2-Step Verification → App passwords
   - Use the App Password in your backend `.env` file

2. **Configure SMTP in the app:**
   - Go to Settings page
   - Enter your SMTP details
   - Test the connection
   - Send a test email

## Development

The application consists of two parts:

- **Frontend**: React app running on `http://localhost:3000`
- **Backend**: Node.js API server running on `http://localhost:3001`

## 📋 Usage Guide

### Project Management
- **Create Projects**: Click the "+" button in the sidebar to add new projects
- **Rename Projects**: Right-click on any project and select "Rename"
- **Delete Projects**: Right-click on any project (except Inbox) and select "Delete Project"
  - ⚠️ **Warning**: Deleting a project permanently removes all associated tasks
  - Projects are deleted from the database with cascade deletion of all tasks

### Task Management
- **Add Tasks**: Use the task input field in any project
- **Drag & Drop**: Reorder tasks by dragging them up or down
- **Task Details**: Set priority levels (low, medium, high) and due dates
- **Edit Tasks**: Click on any task to edit its title inline
- **Delete Tasks**: Use the task context menu or delete button

### Email Reminders
- **Setup**: Configure SMTP settings in the Settings page
- **Enable**: Set reminder times on individual tasks
- **Automation**: Backend automatically sends emails at specified times
- **Templates**: Beautiful HTML email templates with task details and priorities

### Project Structure

-   `src/`: Contains the frontend React application, including pages, components, and the Zustand store.
-   `shared/`: Contains shared TypeScript types used by the application to ensure type safety.

## 🚀 Deployment

### Docker Production Deployment (Recommended)
```bash
# Build and deploy with Docker Compose
docker compose up -d --build

# The application will be available at:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:3001
```

### Static Hosting Deployment
For frontend-only deployment to static hosting platforms:

1.  **Build the project:**
    ```bash
    bun run build
    ```

2.  **Deploy to your preferred platform:**
    Deploy the built files from the `dist` directory to platforms like Vercel, Netlify, GitHub Pages, etc.

**Note**: For full functionality including email reminders and data persistence, you'll need to deploy both frontend and backend with database support.

## 🔧 Troubleshooting

### Common Issues

**1. Remote Access Issues**
```bash
# If you get CORS errors when accessing from another device:
# The app automatically allows network origins, but if issues persist:

# Check your firewall settings
# Ensure ports 3000 and 3001 are accessible on your network
# Try accessing with your actual IP instead of localhost
```

**2. Docker Issues**
```bash
# If containers fail to start:
docker compose down
docker compose up -d --build --force-recreate

# Check container logs:
docker compose logs -f
```

**3. Email Reminders Not Working**
- Verify SMTP settings in the Settings page
- Test the connection using the "Test Connection" button
- For Gmail: Use App Passwords, not your regular password
- Check that the backend server is running (port 3001)

**4. JavaScript Module Errors**
- The app includes crypto.randomUUID fallback for HTTP contexts
- If you see module loading errors, try refreshing the page
- Ensure you're accessing the correct URL (localhost:3000)

## 📚 Documentation

All documentation is organized in the `docs/` folder. See [Documentation Index](./docs/README.md) for a complete overview.

### Quick Links

### Setup & Configuration
- **[Docker Setup Guide](./docs/DOCKER_SETUP.md)** - Complete Docker setup instructions with interactive configuration
- **[Interactive Setup Features](./docs/INTERACTIVE_SETUP_FEATURES.md)** - Detailed guide to the interactive setup process
- **[Email Setup Guide](./docs/EMAIL_SETUP_GUIDE.md)** - SMTP configuration and email reminder setup

### Technical Documentation
- **[Docker Files Summary](./docs/DOCKER_FILES_SUMMARY.md)** - Overview of all Docker-related files and configurations
- **[Backend Documentation](./docs/BACKEND_README.md)** - Backend API documentation and setup

### Development
- **[Prompts](./docs/prompts/)** - AI prompts and usage guidelines
  - [Selection Prompts](./docs/prompts/selection.md)
  - [Usage Prompts](./docs/prompts/usage.md)

## License

This project is licensed under the MIT License.