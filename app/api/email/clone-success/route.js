import { NextResponse } from 'next/server';
import emailService from '@/lib/email';
import logger, { LogLevel, LogCategory } from '@/lib/logger.server';

export async function POST(request) {
  try {
    const { jobDetails } = await request.json();
    const email = jobDetails?.notificationEmail;
    
    if (!email || !jobDetails) {
      return NextResponse.json(
        { success: false, message: 'Email and job details are required' },
        { status: 400 }
      );
    }

    // Log clone success notification attempt
    logger.info(LogCategory.SYSTEM, 'Clone success notification requested', {
      targetEmail: email,
      jobName: jobDetails.jobName,
      timestamp: new Date().toISOString()
    });

    // Check if email service is configured
    if (!emailService.isEmailConfigured()) {
      logger.error(LogCategory.SYSTEM, 'Email service not configured for clone success notification', {
        targetEmail: email,
        jobName: jobDetails.jobName
      });

      return NextResponse.json({
        success: false,
        message: 'Email service not configured'
      }, { status: 503 });
    }

    // Send clone success email
    const result = await emailService.sendCloneSuccessNotification(email, jobDetails);
    
    if (result.success) {
      logger.success(LogCategory.SYSTEM, 'Clone success notification sent', {
        targetEmail: email,
        jobName: jobDetails.jobName,
        messageId: result.messageId,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        message: 'Clone success notification sent successfully!',
        messageId: result.messageId
      });
    } else {
      logger.error(LogCategory.SYSTEM, 'Failed to send clone success notification', {
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
    logger.error(LogCategory.SYSTEM, 'Clone success notification API error', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    console.error('Clone success notification API error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}