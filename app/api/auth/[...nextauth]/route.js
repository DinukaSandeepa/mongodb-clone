import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { 
          label: 'Email', 
          type: 'email',
          placeholder: 'Enter your email'
        },
        password: { 
          label: 'Password', 
          type: 'password',
          placeholder: 'Enter your password'
        }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          await dbConnect();
          
          // Find user by email
          const user = await User.findOne({ 
            email: credentials.email.toLowerCase(),
            isActive: true 
          });

          if (!user) {
            throw new Error('Invalid email or password');
          }

          // Check password
          const isPasswordValid = await user.comparePassword(credentials.password);
          
          if (!isPasswordValid) {
            throw new Error('Invalid email or password');
          }

          // Update last login
          await user.updateLastLogin();

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            lastLogin: user.lastLogin
          };
        } catch (error) {
          console.error('Authentication error:', error);
          throw new Error(error.message || 'Authentication failed');
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.lastLogin = user.lastLogin;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.lastLogin = token.lastLogin;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };