import { NextResponse } from 'next/server';
import emailService from '@/lib/email';
import logger, { LogLevel, LogCategory } from '@/lib/logger';

export async function POST(request) {
  try {
    const { email, jobDetails, error } = await request.json();
    
    if (!email || !jobDetails) {
      return NextResponse.json(
        { success: false, message: 'Email and job details are required' },
        { status: 400 }
      );
    }

    // Log clone error notification attempt
    logger.info(LogCategory.SYSTEM, 'Clone error notification requested', {
      targetEmail: email,
      jobName: jobDetails.jobName,
      error: error,
      timestamp: new Date().toISOString()
    });

    // Check if email service is configured
    if (!emailService.isEmailConfigured()) {
      logger.error(LogCategory.SYSTEM, 'Email service not configured for clone error notification', {
        targetEmail: email,
        jobName: jobDetails.jobName
      });

      return NextResponse.json({
        success: false,
        message: 'Email service not configured'
      }, { status: 503 });
    }

    // Send clone error email
    const result = await emailService.sendCloneErrorNotification(email, jobDetails, error);
    
    if (result.success) {
      logger.success(LogCategory.SYSTEM, 'Clone error notification sent', {
        targetEmail: email,
        jobName: jobDetails.jobName,
        messageId: result.messageId,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        message: 'Clone error notification sent successfully!',
        messageId: result.messageId
      });
    } else {
      logger.error(LogCategory.SYSTEM, 'Failed to send clone error notification', {
        targetEmail: email,
        jobName: jobDetails.jobName,
        error: result.message,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: false,
        message: result.message || 'Failed to send notification',
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    logger.error(LogCategory.SYSTEM, 'Clone error notification API error', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    console.error('Clone error notification API error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}