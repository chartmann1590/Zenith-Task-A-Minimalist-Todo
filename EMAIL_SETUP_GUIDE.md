# Email Reminder Setup Guide

This guide will help you set up email reminders for your Todo app.

## 🚀 Quick Start

### 1. Start the Application

```bash
# Start both frontend and backend
./start-dev.sh

# Or start manually:
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend  
bun install
bun run dev
```

### 2. Configure SMTP Settings

#### Option A: Gmail (Recommended)

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and generate a password
   - Copy the 16-character password

3. **Configure the backend**:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your Gmail settings
   ```

   Example `.env` file:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   FROM_EMAIL=your-email@gmail.com
   FROM_NAME=Todo Reminder App
   ```

#### Option B: Other Email Providers

| Provider | Host | Port | Security |
|----------|------|------|----------|
| Outlook | smtp-mail.outlook.com | 587 | STARTTLS |
| Yahoo | smtp.mail.yahoo.com | 587 | STARTTLS |
| Custom | your-smtp-server.com | 587/465 | STARTTLS/SSL |

### 3. Test Your Configuration

1. **Open the app**: http://localhost:3000
2. **Go to Settings**: Click the settings icon or navigate to `/settings`
3. **Enter SMTP details**:
   - Host: `smtp.gmail.com` (for Gmail)
   - Port: `587`
   - Username: Your email address
   - Password: Your app password
4. **Test Connection**: Click "Test Connection"
5. **Send Test Email**: Enter your email and click "Send Test"

### 4. Create Tasks with Reminders

1. **Add a new task**
2. **Set a due date** (optional)
3. **Enable reminder**: Click the alarm clock icon
4. **Set reminder time**: Choose when you want to be notified
5. **Save the task**

The system will automatically send you an email at the reminder time!

## 🧪 Testing the System

### Backend API Tests

```bash
# Test the complete system
node test-system.js

# Test SMTP configuration only
cd backend
node test-email.js
```

### Manual API Testing

```bash
# Health check
curl http://localhost:3001/api/health

# Get SMTP settings
curl http://localhost:3001/api/smtp/settings

# Test SMTP connection
curl -X POST http://localhost:3001/api/smtp/test

# Send test email
curl -X POST http://localhost:3001/api/smtp/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

## 📧 Email Features

### Automatic Reminders
- ✅ Cron job runs every minute
- ✅ Checks for due reminders
- ✅ Sends emails automatically
- ✅ Marks reminders as sent

### Email Templates
- 🎨 Beautiful HTML design
- 📱 Mobile-responsive
- 📋 Task details included
- 🎯 Priority indicators
- 📅 Due date information

### Manual Reminders
- 🔄 Send reminders on-demand
- 🧪 Test email functionality
- ⚙️ Connection testing

## 🔧 Troubleshooting

### Common Issues

#### 1. "Invalid login" Error
**Solution**: Use App Password instead of regular password
- Enable 2FA on your Google account
- Generate an App Password
- Use the App Password in your configuration

#### 2. "Connection timeout" Error
**Solution**: Check your network and settings
- Verify SMTP host and port
- Check firewall settings
- Try different ports (465 for SSL, 587 for TLS)

#### 3. Emails Not Sending
**Solution**: Check configuration and logs
- Verify FROM_EMAIL matches SMTP_USER
- Check spam folder
- Review server logs for errors

#### 4. Frontend Can't Connect to Backend
**Solution**: Ensure both servers are running
- Backend: http://localhost:3001
- Frontend: http://localhost:3000
- Check CORS settings

### Debug Mode

Enable detailed logging:
```bash
# Set environment variable
export NODE_ENV=development

# Start backend with debug info
cd backend
npm run dev
```

### Logs and Monitoring

Check server logs for:
- SMTP connection status
- Email sending attempts
- Cron job execution
- API request/response

## 🚀 Production Deployment

### Environment Variables
```env
NODE_ENV=production
PORT=3001
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-secure-password
FROM_EMAIL=your-email@domain.com
FROM_NAME=Your App Name
```

### Security Considerations
- ✅ Use environment variables for secrets
- ✅ Enable rate limiting
- ✅ Use HTTPS in production
- ✅ Validate all inputs
- ✅ Monitor for abuse

### Process Management
```bash
# Using PM2
npm install -g pm2
pm2 start backend/server.js --name "todo-backend"
pm2 startup
pm2 save
```

## 📚 API Reference

### SMTP Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/smtp/settings` | Get current SMTP settings |
| POST | `/api/smtp/settings` | Update SMTP settings |
| POST | `/api/smtp/test` | Test SMTP connection |
| POST | `/api/smtp/test-email` | Send test email |

### Task Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks |
| POST | `/api/tasks/sync` | Sync tasks from frontend |
| GET | `/api/reminders` | Get active reminders |
| POST | `/api/reminders/send/:taskId` | Send manual reminder |

## 🎉 Success!

Once configured, your Todo app will:
- ✅ Send beautiful email reminders
- ✅ Work automatically in the background
- ✅ Handle multiple users and tasks
- ✅ Provide a seamless user experience

Enjoy your enhanced productivity with email reminders! 🚀