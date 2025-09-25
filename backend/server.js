import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import Joi from 'joi';
import path from 'path';
import Database from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
const db = new Database();

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // For development, allow localhost and network origins
    const allowedOrigins = [
      'http://localhost:3000', 
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow any network origin for development (you can restrict this in production)
    if (origin && (
      allowedOrigins.includes(origin) || 
      origin.startsWith('http://10.') || 
      origin.startsWith('http://192.168.') ||
      origin.startsWith('http://172.')
    )) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// SMTP settings will be loaded from database
let smtpSettings = {
  host: process.env.SMTP_HOST || '',
  port: parseInt(process.env.SMTP_PORT) || 587,
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
  fromEmail: process.env.FROM_EMAIL || '',
  toEmail: process.env.TO_EMAIL || ''
};

// Validation schemas
const smtpSettingsSchema = Joi.object({
  host: Joi.string().required(),
  port: Joi.number().port().required(),
  user: Joi.string().email().required(),
  pass: Joi.string().min(1).required(),
  fromEmail: Joi.string().email().required(),
  toEmail: Joi.string().email().required()
});

const taskSchema = Joi.object({
  id: Joi.string().required(),
  title: Joi.string().required(),
  completed: Joi.boolean().required(),
  projectId: Joi.string().required(),
  createdAt: Joi.number().required(),
  dueDate: Joi.number().allow(null),
  priority: Joi.string().valid('low', 'medium', 'high').allow(null),
  order: Joi.number().required(),
  reminderEnabled: Joi.boolean().required(),
  reminderTime: Joi.number().allow(null),
  userEmail: Joi.string().email().optional()
});

// SMTP Transporter
let transporter = null;

function createTransporter() {
  if (!smtpSettings.host || !smtpSettings.user || !smtpSettings.pass) {
    console.log('SMTP settings not configured');
    return null;
  }

  try {
    return nodemailer.createTransport({
      host: smtpSettings.host,
      port: smtpSettings.port,
      secure: smtpSettings.port === 465,
      auth: {
        user: smtpSettings.user,
        pass: smtpSettings.pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  } catch (error) {
    console.error('Error creating SMTP transporter:', error);
    return null;
  }
}

// Test SMTP connection
async function testSMTPConnection() {
  if (!transporter) {
    transporter = createTransporter();
  }
  
  if (!transporter) {
    return { success: false, error: 'SMTP not configured' };
  }

  try {
    await transporter.verify();
    return { success: true };
  } catch (error) {
    console.error('SMTP connection test failed:', error);
    return { success: false, error: error.message };
  }
}

// Send email function
async function sendEmail(to, subject, html, text) {
  if (!transporter) {
    transporter = createTransporter();
  }
  
  if (!transporter) {
    throw new Error('SMTP not configured');
  }

  const mailOptions = {
    from: `"${process.env.FROM_NAME || 'Todo Reminder'}" <${smtpSettings.fromEmail || smtpSettings.user}>`,
    to,
    subject,
    html,
    text
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Sanitize HTML content to prevent XSS
function sanitizeHtml(html) {
  // Basic HTML sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, '')
    .replace(/<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '');
}

// Escape HTML entities to prevent XSS
function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Generate email template
function generateReminderEmail(task) {
  const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
  const priority = task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Normal';
  
  // Sanitize user input
  const safeTitle = escapeHtml(task.title);
  const safeDueDate = escapeHtml(dueDate);
  const safePriority = escapeHtml(priority);
  const safeReminderTime = escapeHtml(new Date(task.reminderTime).toLocaleString());
  const safePriorityClass = escapeHtml(task.priority || 'normal');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Task Reminder</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .task-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 20px 0; }
        .task-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #2c3e50; }
        .task-details { margin: 15px 0; }
        .detail-item { margin: 8px 0; }
        .label { font-weight: bold; color: #7f8c8d; }
        .priority-high { color: #e74c3c; }
        .priority-medium { color: #f39c12; }
        .priority-low { color: #3498db; }
        .footer { text-align: center; margin-top: 30px; color: #7f8c8d; font-size: 14px; }
        .button { display: inline-block; background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔔 Task Reminder</h1>
        <p>Don't forget about your upcoming task!</p>
      </div>
      <div class="content">
        <div class="task-card">
          <div class="task-title">${safeTitle}</div>
          <div class="task-details">
            <div class="detail-item">
              <span class="label">Due Date:</span> ${safeDueDate}
            </div>
            <div class="detail-item">
              <span class="label">Priority:</span> 
              <span class="priority-${safePriorityClass}">${safePriority}</span>
            </div>
            <div class="detail-item">
              <span class="label">Reminder Time:</span> ${safeReminderTime}
            </div>
          </div>
        </div>
        <p>This is a friendly reminder about your task. Make sure to complete it on time!</p>
        <div class="footer">
          <p>This email was sent from your Todo Reminder App</p>
          <p>If you no longer want to receive reminders, please update your task settings.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Task Reminder: ${task.title}

Due Date: ${dueDate}
Priority: ${priority}
Reminder Time: ${new Date(task.reminderTime).toLocaleString()}

This is a friendly reminder about your task. Make sure to complete it on time!

This email was sent from your Todo Reminder App.
  `;

  // Sanitize the final HTML
  const sanitizedHtml = sanitizeHtml(html);

  return { html: sanitizedHtml, text };
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Get SMTP settings
app.get('/api/smtp/settings', async (req, res) => {
  try {
    const settings = await db.getSmtpSettings();
    res.json({
      success: true,
      data: {
        host: settings.host,
        port: settings.port,
        user: settings.user,
        fromEmail: settings.fromEmail,
        toEmail: settings.toEmail,
        // Don't send password in response
        configured: !!(settings.host && settings.user && settings.pass && settings.fromEmail && settings.toEmail)
      }
    });
  } catch (error) {
    console.error('Error getting SMTP settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get SMTP settings'
    });
  }
});

// Update SMTP settings
app.post('/api/smtp/settings', async (req, res) => {
  try {
    const { error, value } = smtpSettingsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // Save to database
    await db.updateSmtpSettings(value);
    smtpSettings = value;
    transporter = null; // Reset transporter to use new settings

    // Test the connection
    const testResult = await testSMTPConnection();
    
    res.json({
      success: true,
      data: {
        configured: testResult.success,
        testResult
      }
    });
  } catch (error) {
    console.error('Error updating SMTP settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update SMTP settings'
    });
  }
});

// Test SMTP connection
app.post('/api/smtp/test', async (req, res) => {
  try {
    const testResult = await testSMTPConnection();
    res.json({
      success: true,
      data: testResult
    });
  } catch (error) {
    console.error('Error testing SMTP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test SMTP connection'
    });
  }
});

// Send test email
app.post('/api/smtp/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Use provided email or fall back to configured toEmail
    const recipientEmail = email || smtpSettings.toEmail;
    
    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        error: 'Email address is required. Please provide an email or configure a default toEmail in SMTP settings.'
      });
    }

    const testTask = {
      title: 'Test Reminder Email',
      dueDate: Date.now() + 24 * 60 * 60 * 1000, // Tomorrow
      priority: 'medium',
      reminderTime: Date.now()
    };

    const { html, text } = generateReminderEmail(testTask);
    
    await sendEmail(recipientEmail, 'Test Email - Todo Reminder', html, text);
    
    res.json({
      success: true,
      message: `Test email sent successfully to ${recipientEmail}`
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Sync tasks from frontend
app.post('/api/tasks/sync', async (req, res) => {
  try {
    const { tasks: newTasks } = req.body;
    
    if (!Array.isArray(newTasks)) {
      return res.status(400).json({
        success: false,
        error: 'Tasks must be an array'
      });
    }

    // Validate each task
    for (const task of newTasks) {
      const { error } = taskSchema.validate(task);
      if (error) {
        return res.status(400).json({
          success: false,
          error: `Invalid task: ${error.details[0].message}`
        });
      }
    }

    // Sync tasks to database
    const result = await db.syncTasks(newTasks);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error syncing tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync tasks'
    });
  }
});

// Get projects
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await db.getProjects();
    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('Error getting projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get projects'
    });
  }
});

// Add project
app.post('/api/projects', async (req, res) => {
  try {
    const { id, name, createdAt, icon } = req.body;
    
    if (!id || !name || !createdAt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: id, name, createdAt'
      });
    }

    await db.addProject({ id, name, createdAt, icon });
    
    res.json({
      success: true,
      data: { id }
    });
  } catch (error) {
    console.error('Error adding project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add project'
    });
  }
});

// Update project
app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: name'
      });
    }

    await db.updateProject(id, name, icon);
    
    res.json({
      success: true,
      data: { id }
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project'
    });
  }
});

// Get tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await db.getTasks();
    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get tasks'
    });
  }
});

// Get reminders
app.get('/api/reminders', async (req, res) => {
  try {
    const reminders = await db.getReminders();
    res.json({
      success: true,
      data: reminders
    });
  } catch (error) {
    console.error('Error getting reminders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reminders'
    });
  }
});

// Send reminder manually
app.post('/api/reminders/send/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const tasks = await db.getTasks();
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    if (!task.reminderEnabled) {
      return res.status(400).json({
        success: false,
        error: 'Task does not have reminder enabled'
      });
    }

    // Always use the configured default toEmail for reminders
    const recipientEmail = smtpSettings.toEmail;
    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        error: 'No recipient email configured. Please configure toEmail in SMTP settings.'
      });
    }

    // In test environment, skip actual email sending
    if (process.env.NODE_ENV === 'test') {
      res.json({
        success: true,
        message: 'Reminder would be sent (test mode)'
      });
      return;
    }

    const { html, text } = generateReminderEmail(task);
    await sendEmail(recipientEmail, `Reminder: ${task.title}`, html, text);
    
    res.json({
      success: true,
      message: 'Reminder sent successfully'
    });
  } catch (error) {
    console.error('Error sending manual reminder:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Client error reporting endpoint
app.post('/api/client-errors', async (req, res) => {
  try {
    const errorData = req.body;
    
    // Log the error for debugging
    console.log('Client error received:', {
      message: errorData.message,
      level: errorData.level,
      category: errorData.category,
      url: errorData.url,
      timestamp: errorData.timestamp
    });
    
    // In a production app, you might want to store these in a database
    // or send them to an external error tracking service
    
    res.json({
      success: true,
      message: 'Error reported successfully'
    });
  } catch (error) {
    console.error('Error processing client error report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process error report'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Cron job to check for reminders every minute
cron.schedule('* * * * *', async () => {
  try {
    const now = Date.now();
    const reminders = await db.getReminders();
    const tasks = await db.getTasks();
    
    for (const reminder of reminders) {
      if (!reminder.sent && reminder.reminderTime <= now) {
        const task = tasks.find(t => t.id === reminder.taskId);
        
        if (task && !task.completed && task.reminderEnabled) {
          try {
            // Always use the configured default toEmail for reminders
            const recipientEmail = smtpSettings.toEmail;
            
            if (!recipientEmail) {
              console.error(`No recipient email configured for task: ${task.title}`);
              continue;
            }

            // In test environment, skip actual email sending
            if (process.env.NODE_ENV === 'test') {
              await db.markReminderSent(reminder.taskId);
              console.log(`Reminder would be sent for task: ${task.title} to ${recipientEmail} (test mode)`);
            } else {
              const { html, text } = generateReminderEmail(task);
              await sendEmail(recipientEmail, `Reminder: ${task.title}`, html, text);
              
              await db.markReminderSent(reminder.taskId);
              console.log(`Reminder sent for task: ${task.title} to ${recipientEmail}`);
            }
          } catch (error) {
            console.error(`Failed to send reminder for task ${task.title}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in reminder cron job:', error);
  }
});

// Initialize server
async function startServer() {
  try {
    // Load SMTP settings from database
    const dbSettings = await db.getSmtpSettings();
    if (dbSettings.host) {
      smtpSettings = dbSettings;
    }
    
    // Start server on all interfaces
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📧 SMTP configured: ${!!(smtpSettings.host && smtpSettings.user && smtpSettings.pass)}`);
      console.log(`⏰ Reminder cron job started`);
      console.log(`💾 Database initialized at: ${path.join(process.cwd(), 'data', 'todo.db')}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  await db.close();
  process.exit(0);
});

startServer();

export default app;