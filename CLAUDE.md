# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (React + Vite + TypeScript)
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run lint` - Run ESLint with caching and JSON output
- `npm run preview` - Build and preview production build

### Backend (Node.js + Express)
- `cd backend && npm run dev` - Start backend development server with nodemon
- `cd backend && npm start` - Start production server
- `cd backend && npm test` - Run backend tests
- `cd backend && npm run build` - Backend build (echo message only)

### Integrated Development
- `./start-dev.sh` - Start both frontend and backend servers simultaneously
- `./docker-setup.sh` - Interactive Docker setup with environment configuration
- `docker compose up -d` - Start containerized application
- `docker compose down` - Stop containerized application
- `./test-docker-setup.sh` - Test Docker setup
- `./verify-docker-setup.sh` - Verify Docker configuration

## Architecture Overview

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 6 with hot module replacement
- **UI Library**: shadcn/ui (Radix UI primitives + Tailwind CSS)
- **State Management**: Zustand with Immer middleware for immutable updates
- **Routing**: React Router DOM
- **Animations**: Framer Motion for micro-interactions
- **Drag & Drop**: @dnd-kit for task reordering
- **Styling**: Tailwind CSS with custom configuration
- **Icons**: Lucide React
- **Notifications**: Sonner for toast notifications

### Backend Stack
- **Runtime**: Node.js with ES modules
- **Framework**: Express.js with security middleware
- **Database**: SQLite with custom database.js abstraction
- **Email**: Nodemailer with SMTP support and HTML templates
- **Scheduling**: Node-cron for automated email reminders
- **Security**: Helmet, CORS, express-rate-limit
- **Validation**: Joi schemas
- **Environment**: dotenv for configuration

### Key Architectural Patterns

#### State Management (Zustand Store)
- Centralized application state in `src/store/appStore.ts`
- Immutable updates using Immer middleware
- Async actions for API communication with backend
- Real-time sync between frontend state and backend database
- Automatic task synchronization for email reminders

#### API Communication
- RESTful API with `/api` prefix
- Environment-aware base URL (development vs production)
- Frontend communicates with backend on port 3001
- Automatic fallback and error handling

#### Component Architecture
- Reusable UI components in `src/components/ui/` (shadcn/ui)
- Feature components in `src/components/` (TaskItem, Sidebar, etc.)
- Page components in `src/pages/` (HomePage, SettingsPage)
- Shared TypeScript types in `shared/types.ts`

#### Email Reminder System
- SMTP configuration stored in backend database
- Cron jobs scan for tasks with due reminders
- HTML email templates with task details
- Frontend settings page for SMTP configuration and testing

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components (autoconfigured)
│   ├── TaskView.tsx    # Main task display and management
│   ├── Sidebar.tsx     # Project navigation sidebar
│   └── ...             # Other feature components
├── pages/              # Route components
├── store/              # Zustand state management
├── hooks/              # Custom React hooks
└── lib/                # Utility functions and configurations

backend/
├── server.js           # Express server with API routes
├── database.js         # SQLite database abstraction
└── health-check.js     # Docker health check endpoint

shared/
└── types.ts            # Shared TypeScript interfaces
```

## Development Workflow

### Local Development
1. Use `./start-dev.sh` to run both frontend and backend
2. Frontend runs on http://localhost:3000
3. Backend API runs on http://localhost:3001
4. Backend must be running for full functionality (project persistence, email reminders)

### Docker Development
1. Use `./docker-setup.sh` for guided setup with SMTP configuration
2. Application runs containerized with nginx serving frontend
3. Frontend accessible at http://localhost:3000, backend at http://localhost:3001

### Code Style and Linting
- ESLint configuration in `eslint.config.js` with TypeScript rules
- React hooks and import rules enforced
- `npm run lint` runs linting with caching for performance
- No specific formatting rules - team should establish Prettier if needed

### Testing
- Backend has basic test suite (`npm test` in backend directory)
- Frontend currently has no test framework configured
- Docker setup includes verification scripts for integration testing

## Key Technical Details

### State Synchronization
- Zustand store automatically syncs tasks with backend via `syncTasksWithBackend()`
- Real-time updates ensure email reminders stay current
- Frontend state persists through page reloads via backend API calls

### SMTP Configuration
- Email settings configurable via Settings page UI
- SMTP connection testing built into backend API
- Settings persist in backend SQLite database
- Test email functionality for validation

### Task Management
- Drag-and-drop reordering with @dnd-kit
- Task priorities (low, medium, high) with visual indicators
- Due date management with date picker
- Email reminder scheduling with cron jobs

### Environment Configuration
- Frontend uses environment-aware API URLs
- Backend supports `.env` configuration for SMTP and other settings
- Docker environment variables for production deployment
- Rate limiting and security headers configured for production