# Database Implementation

## Overview

The todo app now uses SQLite for persistent data storage instead of in-memory storage. This ensures that all tasks, projects, and settings persist across server restarts and page refreshes.

## Database Schema

### Tables

1. **projects** - Stores project information
   - `id` (TEXT PRIMARY KEY) - Unique project identifier
   - `name` (TEXT NOT NULL) - Project name
   - `created_at` (INTEGER NOT NULL) - Creation timestamp

2. **tasks** - Stores task information
   - `id` (TEXT PRIMARY KEY) - Unique task identifier
   - `title` (TEXT NOT NULL) - Task title
   - `completed` (INTEGER NOT NULL DEFAULT 0) - Completion status (0/1)
   - `project_id` (TEXT NOT NULL) - Foreign key to projects table
   - `created_at` (INTEGER NOT NULL) - Creation timestamp
   - `due_date` (INTEGER) - Due date timestamp (nullable)
   - `priority` (TEXT) - Priority level ('low', 'medium', 'high', nullable)
   - `order_index` (INTEGER NOT NULL) - Display order
   - `reminder_enabled` (INTEGER NOT NULL DEFAULT 0) - Reminder status (0/1)
   - `reminder_time` (INTEGER) - Reminder timestamp (nullable)
   - `user_email` (TEXT NOT NULL) - User email for reminders

3. **reminders** - Stores reminder information
   - `id` (INTEGER PRIMARY KEY AUTOINCREMENT) - Auto-incrementing ID
   - `task_id` (TEXT NOT NULL) - Foreign key to tasks table
   - `user_email` (TEXT NOT NULL) - User email
   - `reminder_time` (INTEGER NOT NULL) - When to send reminder
   - `sent` (INTEGER NOT NULL DEFAULT 0) - Whether reminder was sent (0/1)

4. **smtp_settings** - Stores SMTP configuration
   - `id` (INTEGER PRIMARY KEY DEFAULT 1) - Single row constraint
   - `host` (TEXT) - SMTP host
   - `port` (INTEGER) - SMTP port
   - `user` (TEXT) - SMTP username
   - `pass` (TEXT) - SMTP password

## File Structure

- **Database file**: `/workspace/backend/data/todo.db`
- **Database module**: `/workspace/backend/database.js`
- **Updated server**: `/workspace/backend/server.js`

## Key Features

### Data Persistence
- All data is stored in SQLite database
- Data persists across server restarts
- Docker volume mount ensures data survives container restarts

### Default Data
- Two default projects are created on first run: "Inbox" and "Work"
- SMTP settings are loaded from environment variables on startup

### API Endpoints
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks/sync` - Sync tasks from frontend
- `GET /api/reminders` - Get active reminders
- `GET /api/smtp/settings` - Get SMTP settings
- `POST /api/smtp/settings` - Update SMTP settings

### Frontend Integration
- App automatically loads data from backend on startup
- All CRUD operations sync with backend
- Real-time data persistence

## Docker Configuration

The Docker setup includes:
- Volume mount for `/app/data` to persist database
- Proper permissions for the data directory
- Database initialization on container start

## Testing

A comprehensive test was performed to verify:
1. Data can be added to the database
2. Data persists across server restarts
3. All API endpoints work correctly
4. Frontend can load data from backend

## Migration Notes

- No migration needed - database is created fresh on first run
- Default projects are automatically created
- Existing in-memory data will be lost (this is expected for the fix)

## Benefits

1. **Data Persistence**: Tasks and projects no longer disappear on refresh
2. **Reliability**: Server can be restarted without data loss
3. **Scalability**: SQLite can handle larger datasets
4. **Backup**: Database file can be easily backed up
5. **Development**: Data persists during development sessions