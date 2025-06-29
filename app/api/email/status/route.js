import { NextResponse } from 'next/server';
import emailService from '@/lib/email';

export async function GET() {
  try {
    const status = emailService.getConfigurationStatus();
    
    return NextResponse.json({
      success: true,
      configured: status.configured,
      hasAllCredentials: status.hasAllCredentials,
      missing: status.missing,
      requiredEnvVars: [
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET', 
        'GOOGLE_REFRESH_TOKEN',
        'GOOGLE_USER_EMAIL'
      ],
      instructions: {
        step1: 'Go to Google Cloud Console and create OAuth 2.0 credentials',
        step2: 'Use Google OAuth Playground to get refresh token',
        step3: 'Set environment variables in your deployment',
        step4: 'Restart the application'
      }
    });
  } catch (error) {
    console.error('Email status API error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to check email configuration',
      error: error.message
    }, { status: 500 });
  }
}