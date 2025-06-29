import { NextResponse } from 'next/server';
import emailService from '@/lib/email';
import logger, { LogLevel, LogCategory } from '@/lib/logger.server';

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email address is required' },
        { status: 400 }
      );
    }

    // Log test email attempt
    logger.info(LogCategory.SYSTEM, 'Test email requested', {
      targetEmail: email,
      timestamp: new Date().toISOString()
    });

    // Check if email service is configured
    if (!emailService.isEmailConfigured()) {
      const status = emailService.getConfigurationStatus();
      
      logger.error(LogCategory.SYSTEM, 'Email service not configured for test', {
        missing: status.missing,
        targetEmail: email
      });

      return NextResponse.json({
        success: false,
        message: 'Email service not configured',
        details: {
          missing: status.missing,
          help: 'Please configure Google OAuth credentials in environment variables'
        }
      }, { status: 503 });
    }

    // Send test email
    const result = await emailService.sendTestEmail(email);
    
    if (result.success) {
      logger.success(LogCategory.SYSTEM, 'Test email sent successfully', {
        targetEmail: email,
        messageId: result.messageId,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully!',
        messageId: result.messageId
      });
    } else {
      logger.error(LogCategory.SYSTEM, 'Failed to send test email', {
        targetEmail: email,
        error: result.message,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: false,
        message: result.message || 'Failed to send test email',
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    logger.error(LogCategory.SYSTEM, 'Test email API error', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    console.error('Test email API error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}