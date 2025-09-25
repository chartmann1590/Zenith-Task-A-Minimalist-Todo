# Todo Reminder Backend

A Node.js backend service for handling email reminders for todo list items.

> **Note**: For Docker setup with interactive configuration, see [Docker Setup Guide](./DOCKER_SETUP.md)

## Features

- ✅ SMTP configuration and testing
- ✅ Email reminder system with cron jobs
- ✅ RESTful API for frontend integration
- ✅ Rate limiting and security middleware
- ✅ Beautiful HTML email templates
- ✅ Task synchronization with frontend

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your SMTP settings:

```bash
cp .env.example .env
```

Edit `.env` with your SMTP credentials:

```env
# SMTP Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Server Configuration
PORT=3001
NODE_ENV=development

# Email Configuration
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Todo Reminder App
```

### 3. Gmail Setup (Recommended)

For Gmail, you'll need to:

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password in your `.env` file

### 4. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3001`

### 5. Test SMTP Configuration

```bash
npm test
```

This will send a test email to verify your SMTP settings.

## API Endpoints

### SMTP Configuration

- `GET /api/smtp/settings` - Get current SMTP settings
- `POST /api/smtp/settings` - Update SMTP settings
- `POST /api/smtp/test` - Test SMTP connection
- `POST /api/smtp/test-email` - Send test email

### Task Management

- `GET /api/tasks` - Get all tasks
- `POST /api/tasks/sync` - Sync tasks from frontend
- `GET /api/reminders` - Get active reminders
- `POST /api/reminders/send/:taskId` - Send manual reminder

### Health Check

- `GET /api/health` - Server health status

## Email Templates

The system generates beautiful HTML email templates with:

- Responsive design
- Task details (title, due date, priority)
- Professional styling
- Clear call-to-action

## Cron Jobs

The system runs a cron job every minute to check for due reminders:

- Automatically sends emails for tasks with `reminderEnabled: true`
- Checks `reminderTime` against current time
- Only sends to incomplete tasks
- Marks reminders as sent to prevent duplicates

## Security Features

- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet security headers
- Input validation with Joi
- Error handling middleware

## Development

### Project Structure

```
backend/
├── server.js          # Main server file
├── test-email.js      # SMTP testing utility
├── package.json       # Dependencies
├── .env.example       # Environment template
└── README.md          # This file
```

### Adding New Features

1. Add new routes in `server.js`
2. Update validation schemas
3. Add corresponding frontend integration
4. Test with the test utilities

## Troubleshooting

### Common SMTP Issues

1. **Authentication Failed**
   - Use App Password for Gmail
   - Check username/password
   - Verify 2FA is enabled

2. **Connection Timeout**
   - Check firewall settings
   - Verify SMTP host/port
   - Try different ports (465 for SSL, 587 for TLS)

3. **Emails Not Sending**
   - Check spam folder
   - Verify FROM_EMAIL matches SMTP_USER
   - Check server logs for errors

### Debug Mode

Set `NODE_ENV=development` for detailed logging.

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a process manager like PM2
3. Set up proper logging
4. Configure reverse proxy (nginx)
5. Use environment variables for secrets
6. Set up monitoring and alerts

## Related Documentation

- [Main README](../README.md) - Project overview and quick start
- [Docker Setup Guide](./DOCKER_SETUP.md) - Complete Docker setup with interactive configuration
- [Email Setup Guide](./EMAIL_SETUP_GUIDE.md) - SMTP configuration and email setup
- [Interactive Setup Features](./INTERACTIVE_SETUP_FEATURES.md) - Interactive configuration guide

## License

MIT License - feel free to use in your projects!