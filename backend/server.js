import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// In-memory storage (in production, use a database)
let smtpSettings = {
  host: process.env.SMTP_HOST || '',
  port: parseInt(process.env.SMTP_PORT) || 587,
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || ''
};

let tasks = [];
let reminders = [];

// Validation schemas
const smtpSettingsSchema = Joi.object({
  host: Joi.string().required(),
  port: Joi.number().port().required(),
  user: Joi.string().email().required(),
  pass: Joi.string().min(1).required()
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
  userEmail: Joi.string().email().required()
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
    from: `"${process.env.FROM_NAME || 'Todo Reminder'}" <${process.env.FROM_EMAIL || smtpSettings.user}>`,
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

// Generate email template
function generateReminderEmail(task) {
  const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
  const priority = task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Normal';
  
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
          <div class="task-title">${task.title}</div>
          <div class="task-details">
            <div class="detail-item">
              <span class="label">Due Date:</span> ${dueDate}
            </div>
            <div class="detail-item">
              <span class="label">Priority:</span> 
              <span class="priority-${task.priority || 'normal'}">${priority}</span>
            </div>
            <div class="detail-item">
              <span class="label">Reminder Time:</span> ${new Date(task.reminderTime).toLocaleString()}
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

  return { html, text };
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
app.get('/api/smtp/settings', (req, res) => {
  res.json({
    success: true,
    data: {
      host: smtpSettings.host,
      port: smtpSettings.port,
      user: smtpSettings.user,
      // Don't send password in response
      configured: !!(smtpSettings.host && smtpSettings.user && smtpSettings.pass)
    }
  });
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
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email address is required'
      });
    }

    const testTask = {
      title: 'Test Reminder Email',
      dueDate: Date.now() + 24 * 60 * 60 * 1000, // Tomorrow
      priority: 'medium',
      reminderTime: Date.now()
    };

    const { html, text } = generateReminderEmail(testTask);
    
    await sendEmail(email, 'Test Email - Todo Reminder', html, text);
    
    res.json({
      success: true,
      message: 'Test email sent successfully'
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
app.post('/api/tasks/sync', (req, res) => {
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

    tasks = newTasks;
    
    // Update reminders for tasks with reminderEnabled
    reminders = tasks
      .filter(task => task.reminderEnabled && task.reminderTime && !task.completed)
      .map(task => ({
        taskId: task.id,
        userEmail: task.userEmail,
        reminderTime: task.reminderTime,
        sent: false
      }));

    res.json({
      success: true,
      data: {
        tasksCount: tasks.length,
        remindersCount: reminders.length
      }
    });
  } catch (error) {
    console.error('Error syncing tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync tasks'
    });
  }
});

// Get tasks
app.get('/api/tasks', (req, res) => {
  res.json({
    success: true,
    data: tasks
  });
});

// Get reminders
app.get('/api/reminders', (req, res) => {
  res.json({
    success: true,
    data: reminders
  });
});

// Send reminder manually
app.post('/api/reminders/send/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    if (!task.reminderEnabled || !task.userEmail) {
      return res.status(400).json({
        success: false,
        error: 'Task does not have reminder enabled or user email'
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
    await sendEmail(task.userEmail, `Reminder: ${task.title}`, html, text);
    
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
  const now = Date.now();
  
  for (const reminder of reminders) {
    if (!reminder.sent && reminder.reminderTime <= now) {
      const task = tasks.find(t => t.id === reminder.taskId);
      
      if (task && !task.completed && task.reminderEnabled) {
        try {
          // In test environment, skip actual email sending
          if (process.env.NODE_ENV === 'test') {
            reminder.sent = true;
            console.log(`Reminder would be sent for task: ${task.title} to ${reminder.userEmail} (test mode)`);
          } else {
            const { html, text } = generateReminderEmail(task);
            await sendEmail(reminder.userEmail, `Reminder: ${task.title}`, html, text);
            
            reminder.sent = true;
            console.log(`Reminder sent for task: ${task.title} to ${reminder.userEmail}`);
          }
        } catch (error) {
          console.error(`Failed to send reminder for task ${task.title}:`, error);
        }
      }
    }
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 SMTP configured: ${!!(smtpSettings.host && smtpSettings.user && smtpSettings.pass)}`);
  console.log(`⏰ Reminder cron job started`);
});

export default app;