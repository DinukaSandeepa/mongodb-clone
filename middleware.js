import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here if needed
    return;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user has a valid token
        if (!token) return false;
        
        // Check if user account is active (if this info is in the token)
        if (token.role && token.role !== 'admin' && token.role !== 'user') {
          return false;
        }
        
        return true;
      },
    },
  }
);

// Protect all routes except auth pages and API auth routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js API routes)
     * - auth (authentication pages)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
};