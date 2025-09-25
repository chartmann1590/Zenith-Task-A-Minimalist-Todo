import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Test email configuration
const testConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || ''
};

async function testEmail() {
  console.log('🧪 Testing SMTP Configuration...');
  console.log('Host:', testConfig.host);
  console.log('Port:', testConfig.port);
  console.log('User:', testConfig.user);
  console.log('Password:', testConfig.pass ? '***' : 'NOT SET');

  if (!testConfig.host || !testConfig.user || !testConfig.pass) {
    console.error('❌ SMTP configuration incomplete. Please check your .env file.');
    return;
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: testConfig.host,
      port: testConfig.port,
      secure: testConfig.port === 465,
      auth: {
        user: testConfig.user,
        pass: testConfig.pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('🔍 Testing SMTP connection...');
    
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!');

    // Send test email
    const testEmail = {
      from: `"Todo Reminder Test" <${testConfig.user}>`,
      to: testConfig.user, // Send to self for testing
      subject: 'Test Email - Todo Reminder System',
      html: `
        <h2>🎉 SMTP Test Successful!</h2>
        <p>Your Todo Reminder system is properly configured and ready to send email reminders.</p>
        <p><strong>Configuration:</strong></p>
        <ul>
          <li>Host: ${testConfig.host}</li>
          <li>Port: ${testConfig.port}</li>
          <li>User: ${testConfig.user}</li>
        </ul>
        <p>This email was sent at: ${new Date().toLocaleString()}</p>
      `,
      text: `
SMTP Test Successful!

Your Todo Reminder system is properly configured and ready to send email reminders.

Configuration:
- Host: ${testConfig.host}
- Port: ${testConfig.port}
- User: ${testConfig.user}

This email was sent at: ${new Date().toLocaleString()}
      `
    };

    console.log('📧 Sending test email...');
    const result = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('📬 Check your inbox for the test email.');

  } catch (error) {
    console.error('❌ SMTP test failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n💡 Authentication failed. Common solutions:');
      console.error('1. For Gmail: Use an App Password instead of your regular password');
      console.error('2. Enable 2-factor authentication and generate an App Password');
      console.error('3. Check that "Less secure app access" is enabled (not recommended)');
    } else if (error.code === 'ECONNECTION') {
      console.error('\n💡 Connection failed. Common solutions:');
      console.error('1. Check your internet connection');
      console.error('2. Verify the SMTP host and port');
      console.error('3. Check firewall settings');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n💡 Connection timeout. Common solutions:');
      console.error('1. Check your internet connection');
      console.error('2. Try a different port (465 for SSL, 587 for TLS)');
    }
  }
}

// Run the test
testEmail().then(() => {
  console.log('\n🏁 Test completed.');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Test failed with error:', error);
  process.exit(1);
});