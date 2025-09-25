# Zenith Task: A Minimalist Todo Platform with Email Reminders

Zenith Task is a visually stunning, minimalist, and highly interactive todo list application designed to enhance productivity through an elegant and intuitive user experience. The application features a clean two-column layout: a sidebar for project navigation and a main content area for managing tasks. Users can create projects, add tasks with details like priority and due dates, and track their progress seamlessly. The entire experience is enhanced with subtle micro-interactions and smooth animations, making task management not just efficient, but delightful.

## Key Features

- **Minimalist & Modern UI**: A clean, uncluttered interface that helps you focus on your tasks.
- **Project Management**: Organize your tasks into different projects for better clarity.
- **Full Task CRUD**: Create, read, update, and delete tasks with ease.
- **Email Reminders**: Get email notifications for your tasks with customizable reminder times.
- **SMTP Integration**: Full SMTP support with connection testing and email templates.
- **Interactive Experience**: Smooth animations, hover states, and micro-interactions make using the app a delight.
- **Responsive Design**: Flawless performance and layout across all device sizes, from mobile to desktop.
- **Fast & Responsive**: Optimized for speed and performance across all devices.

## Technology Stack

- **Frontend**: React, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, Nodemailer
- **State Management**: Zustand
- **Storage**: Local storage and state management
- **UI & Animation**: Framer Motion, Lucide React
- **Email**: SMTP with HTML templates and cron jobs
- **Language**: TypeScript
- **Runtime & Package Manager**: Bun (frontend), npm (backend)

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
- Set up the complete application environment
- Start all services automatically

**Application URLs after setup:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

For detailed Docker setup instructions, see [DOCKER_SETUP.md](./DOCKER_SETUP.md).

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

### Email Reminders

- Set reminder times on your tasks
- Enable reminders in the task settings
- The backend automatically sends emails at the specified times
- Beautiful HTML email templates with task details

### Project Structure

-   `src/`: Contains the frontend React application, including pages, components, and the Zustand store.
-   `shared/`: Contains shared TypeScript types used by the application to ensure type safety.

## Deployment

This project is designed for easy deployment to any static hosting platform.

1.  **Build the project:**
    This command bundles the React application for deployment.
    ```bash
    bun run build
    ```

2.  **Deploy to your preferred platform:**
    You can deploy the built files from the `dist` directory to any static hosting platform like Vercel, Netlify, GitHub Pages, or any other hosting service.

## License

This project is licensed under the MIT License.