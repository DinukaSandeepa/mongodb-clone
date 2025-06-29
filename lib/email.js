import nodemailer from 'nodemailer';
import { google } from 'googleapis';

const OAuth2 = google.auth.OAuth2;

// Email service class for handling notifications
class EmailService {
  constructor() {
    this.oauth2Client = null;
    this.transporter = null;
    this.isConfigured = false;
    this.initializeOAuth();
  }

  async initializeOAuth() {
    try {
      // Check if OAuth credentials are available
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
      const userEmail = process.env.GOOGLE_USER_EMAIL;

      if (!clientId || !clientSecret || !refreshToken || !userEmail) {
        console.warn('Email service: OAuth credentials not configured. Email notifications will be disabled.');
        return;
      }

      // Create OAuth2 client
      this.oauth2Client = new OAuth2(
        clientId,
        clientSecret,
        'https://developers.google.com/oauthplayground'
      );

      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      this.isConfigured = true;
      console.log('Email service: OAuth2 configured successfully');
    } catch (error) {
      console.error('Email service: Failed to initialize OAuth2:', error.message);
      this.isConfigured = false;
    }
  }

  async createTransporter() {
    if (!this.isConfigured) {
      throw new Error('Email service not configured');
    }

    try {
      const accessToken = await this.oauth2Client.getAccessToken();

      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.GOOGLE_USER_EMAIL,
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
          accessToken: accessToken.token,
        },
      });

      return this.transporter;
    } catch (error) {
      console.error('Email service: Failed to create transporter:', error.message);
      throw error;
    }
  }

  async sendEmail({ to, subject, html, text }) {
    if (!this.isConfigured) {
      console.warn('Email service: Cannot send email - service not configured');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const transporter = await this.createTransporter();

      const mailOptions = {
        from: `MongoDB Clone Manager <${process.env.GOOGLE_USER_EMAIL}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      
      return { 
        success: true, 
        messageId: result.messageId,
        message: 'Email sent successfully' 
      };
    } catch (error) {
      console.error('Email service: Failed to send email:', error.message);
      return { 
        success: false, 
        message: error.message,
        error: error.toString()
      };
    }
  }

  async sendTestEmail(to) {
    const subject = 'MongoDB Clone Manager - Test Email';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">MongoDB Clone Manager</h1>
          <p style="color: white; margin: 10px 0 0 0;">Email Configuration Test</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-top: 0;">✅ Email Configuration Successful!</h2>
          
          <p style="color: #666; line-height: 1.6;">
            This is a test email to confirm that your email notification system is working correctly.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #28a745; margin-top: 0;">Configuration Details:</h3>
            <ul style="color: #666;">
              <li>✓ OAuth 2.0 authentication configured</li>
              <li>✓ Gmail SMTP connection established</li>
              <li>✓ Email notifications ready to use</li>
            </ul>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            You will now receive email notifications for:
          </p>
          
          <ul style="color: #666; line-height: 1.6;">
            <li>Successful clone operations</li>
            <li>Failed clone operations</li>
            <li>System errors and warnings</li>
            <li>Important system updates</li>
          </ul>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #999; font-size: 14px; margin: 0;">
              Sent from MongoDB Clone Manager<br>
              ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    `;

    return await this.sendEmail({ to, subject, html });
  }

  async sendCloneSuccessNotification(to, jobDetails) {
    const subject = `✅ Clone Operation Completed - ${jobDetails.jobName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">✅ Clone Operation Successful</h1>
          <p style="color: white; margin: 10px 0 0 0;">MongoDB Clone Manager</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-top: 0;">Operation Completed Successfully</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Your database clone operation has completed successfully.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #28a745; margin-top: 0;">Job Details:</h3>
            <table style="width: 100%; color: #666;">
              <tr><td style="padding: 5px 0;"><strong>Job Name:</strong></td><td>${jobDetails.jobName}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Duration:</strong></td><td>${jobDetails.duration || 'N/A'}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Collections:</strong></td><td>${jobDetails.collections || 0}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Documents:</strong></td><td>${(jobDetails.documents || 0).toLocaleString()}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Completed:</strong></td><td>${new Date().toLocaleString()}</td></tr>
            </table>
          </div>
          
          ${jobDetails.stats ? `
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #155724; margin-top: 0;">Operation Statistics:</h4>
            <p style="color: #155724; margin: 5px 0;">
              Successfully processed ${jobDetails.stats.processedCollections} of ${jobDetails.stats.totalCollections} collections
            </p>
            <p style="color: #155724; margin: 5px 0;">
              Cloned ${(jobDetails.stats.clonedDocuments || 0).toLocaleString()} documents
            </p>
          </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #999; font-size: 14px; margin: 0;">
              Sent from MongoDB Clone Manager<br>
              ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    `;

    return await this.sendEmail({ to, subject, html });
  }

  async sendCloneErrorNotification(to, jobDetails, error) {
    const subject = `❌ Clone Operation Failed - ${jobDetails.jobName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">❌ Clone Operation Failed</h1>
          <p style="color: white; margin: 10px 0 0 0;">MongoDB Clone Manager</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-top: 0;">Operation Failed</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Your database clone operation has failed. Please review the details below and try again.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="color: #dc3545; margin-top: 0;">Job Details:</h3>
            <table style="width: 100%; color: #666;">
              <tr><td style="padding: 5px 0;"><strong>Job Name:</strong></td><td>${jobDetails.jobName}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Failed At:</strong></td><td>${new Date().toLocaleString()}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Duration:</strong></td><td>${jobDetails.duration || 'N/A'}</td></tr>
            </table>
          </div>
          
          <div style="background: #f8d7da; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #f5c6cb;">
            <h4 style="color: #721c24; margin-top: 0;">Error Details:</h4>
            <p style="color: #721c24; margin: 5px 0; font-family: monospace; background: white; padding: 10px; border-radius: 4px;">
              ${error || 'Unknown error occurred'}
            </p>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffeaa7;">
            <h4 style="color: #856404; margin-top: 0;">Troubleshooting Tips:</h4>
            <ul style="color: #856404; margin: 5px 0;">
              <li>Check your connection strings are valid</li>
              <li>Verify database credentials and permissions</li>
              <li>Ensure network connectivity to both databases</li>
              <li>Check the operation logs for more details</li>
            </ul>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #999; font-size: 14px; margin: 0;">
              Sent from MongoDB Clone Manager<br>
              ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    `;

    return await this.sendEmail({ to, subject, html });
  }

  isEmailConfigured() {
    return this.isConfigured;
  }

  getConfigurationStatus() {
    const requiredEnvVars = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET', 
      'GOOGLE_REFRESH_TOKEN',
      'GOOGLE_USER_EMAIL'
    ];

    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    return {
      configured: this.isConfigured,
      missing: missing,
      hasAllCredentials: missing.length === 0
    };
  }
}

// Create singleton instance
const emailService = new EmailService();

export default emailService;