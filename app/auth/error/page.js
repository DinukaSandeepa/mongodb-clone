'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorDetails = (errorType) => {
    switch (errorType) {
      case 'Configuration':
        return {
          title: 'Configuration Error',
          description: 'There is a problem with the server configuration.',
          suggestion: 'Please contact your system administrator.'
        };
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          description: 'You do not have permission to sign in.',
          suggestion: 'Your account may be inactive or you may not have the required permissions.'
        };
      case 'Verification':
        return {
          title: 'Verification Error',
          description: 'The verification token has expired or is invalid.',
          suggestion: 'Please try signing in again.'
        };
      case 'CredentialsSignin':
        return {
          title: 'Invalid Credentials',
          description: 'The email or password you entered is incorrect.',
          suggestion: 'Please check your credentials and try again.'
        };
      default:
        return {
          title: 'Authentication Error',
          description: 'An unexpected error occurred during authentication.',
          suggestion: 'Please try again or contact support if the problem persists.'
        };
    }
  };

  const errorDetails = getErrorDetails(error);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Authentication Error</h1>
          <p className="text-muted-foreground">Something went wrong during sign in</p>
        </div>

        {/* Error Details */}
        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold text-center text-red-600">
              {errorDetails.title}
            </CardTitle>
            <CardDescription className="text-center">
              {errorDetails.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errorDetails.suggestion}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/auth/signin">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Link>
              </Button>

              <Button variant="outline" asChild className="w-full">
                <Link href="/">
                  <Database className="mr-2 h-4 w-4" />
                  Go to Home
                </Link>
              </Button>
            </div>

            {/* Error Code */}
            {error && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">
                  Error Code: <code className="font-mono">{error}</code>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>If you continue to experience issues, please contact your administrator.</p>
        </div>
      </div>
    </div>
  );
}