# Interactive Setup Features

This document describes the enhanced interactive features added to the Docker setup script.

## 🎯 New Interactive Features

### 1. Environment File Detection
- **Automatic Detection**: Script detects if `.env` files already exist
- **Smart Options**: Offers three choices when files exist:
  - **Use existing** - Keep current configuration
  - **Recreate** - Start fresh with new configuration
  - **Edit manually** - Open in text editor for manual editing

### 2. Guided Configuration Process
The script now provides step-by-step guidance for all environment variables:

#### SMTP Configuration
- **SMTP Host**: Default `smtp.gmail.com`, with examples for other providers
- **SMTP Port**: Default `587`, with validation for port numbers
- **SMTP Username**: Email address with validation
- **SMTP Password**: Secure input (hidden) with Gmail App Password instructions
- **From Name**: Sender display name
- **From Email**: Sender email address with validation

#### Rate Limiting (Optional)
- **Rate Limit Window**: Time window in milliseconds
- **Max Requests**: Maximum requests per window

### 3. Input Validation
- **Email Validation**: Ensures proper email format
- **Port Validation**: Validates port numbers (1-65535)
- **Required Fields**: Ensures all necessary fields are filled
- **Error Handling**: Clear error messages with retry options

### 4. Configuration Summary
- **Preview**: Shows all configuration before saving
- **Confirmation**: Asks for final confirmation
- **Reconfiguration**: Option to start over if needed

### 5. Helpful Guidance
- **Gmail Instructions**: Step-by-step Gmail App Password setup
- **Provider Examples**: Common SMTP settings for different providers
- **Security Notes**: Reminders about using App Passwords

## 🔧 Usage Examples

### First Time Setup
```bash
./docker-setup.sh
```
The script will:
1. Detect no `.env` files exist
2. Guide through interactive configuration
3. Create both frontend and backend `.env` files
4. Start the application

### Existing Configuration
```bash
./docker-setup.sh
```
When `.env` files exist, you'll see:
```
[WARNING] Environment file (.env) already exists!

Current configuration:
======================
SMTP_HOST=***
SMTP_PORT=***
SMTP_USER=***
...

Do you want to (u)se existing config, (r)ecreate it, or (e)dit manually? [u/r/e]:
```

### Manual Editing
If you choose to edit manually:
- Script opens `.env` in your preferred editor (nano, vim, vi)
- Falls back to showing file location if no editor found
- Continues with setup after editing

## 📋 Configuration Options

### Gmail Setup (Recommended)
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Pass: [App Password - not your regular password]
```

### Outlook/Hotmail
```
SMTP Host: smtp-mail.outlook.com
SMTP Port: 587
SMTP User: your-email@outlook.com
SMTP Pass: [Your password]
```

### Yahoo
```
SMTP Host: smtp.mail.yahoo.com
SMTP Port: 587
SMTP User: your-email@yahoo.com
SMTP Pass: [App Password]
```

### Custom SMTP
```
SMTP Host: your-smtp-server.com
SMTP Port: 587 (or 465 for SSL)
SMTP User: your-username
SMTP Pass: your-password
```

## 🛡️ Security Features

### Password Security
- **Hidden Input**: SMTP passwords are entered securely (not visible)
- **App Password Guidance**: Clear instructions for Gmail App Passwords
- **No Storage in Logs**: Passwords are never logged or displayed

### File Security
- **Proper Permissions**: `.env` files created with appropriate permissions
- **Separate Files**: Frontend and backend have separate `.env` files
- **Timestamped**: Files include generation timestamp

## 🧪 Testing

The interactive setup has been tested with:
- ✅ New environment (no existing files)
- ✅ Existing environment (files already present)
- ✅ Use existing configuration option
- ✅ Recreate configuration option
- ✅ Input validation (email, port numbers)
- ✅ Configuration summary and confirmation
- ✅ File creation and content verification

## 🚀 Benefits

1. **User-Friendly**: No need to manually edit configuration files
2. **Error-Proof**: Validation prevents common configuration mistakes
3. **Flexible**: Multiple options for different user preferences
4. **Secure**: Proper handling of sensitive information
5. **Complete**: Sets up both frontend and backend configurations
6. **Guided**: Step-by-step process with helpful instructions

The interactive setup makes the Docker configuration process much more accessible and user-friendly!

## Related Documentation

- [Main README](../README.md) - Project overview and quick start
- [Docker Setup Guide](./DOCKER_SETUP.md) - Complete Docker setup instructions
- [Docker Files Summary](./DOCKER_FILES_SUMMARY.md) - Overview of all Docker files
- [Email Setup Guide](./EMAIL_SETUP_GUIDE.md) - SMTP configuration details