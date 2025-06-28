import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// Mock admin user for when MongoDB is not available
const mockAdminUser = {
  email: 'admin@example.com',
  password: 'admin123', // This will be hashed in real implementation
  name: 'System Administrator',
  role: 'admin'
};

const mockUsers = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    name: 'System Administrator',
    role: 'admin'
  },
  {
    email: 'user@example.com',
    password: 'user123',
    name: 'Regular User',
    role: 'user'
  }
];

export async function POST(request) {
  try {
    const { email, password, name, role = 'user' } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, message: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    const connection = await dbConnect();
    
    if (!connection) {
      // Return mock response when no database connection
      console.log('Created mock user:', { email, name, role });
      return NextResponse.json({
        success: true,
        message: 'User created successfully! (Using mock data - configure MongoDB for persistence)',
        user: {
          email,
          name,
          role,
          isActive: true,
          createdAt: new Date()
        }
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      name,
      role,
      isActive: true
    });

    await user.save();

    // Return user data without password
    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    };

    return NextResponse.json({
      success: true,
      message: 'User created successfully!',
      user: userData
    });

  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { success: false, message: messages.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// Initialize default users (for development/demo purposes)
export async function GET() {
  try {
    const connection = await dbConnect();
    
    if (!connection) {
      return NextResponse.json({
        success: true,
        message: 'Mock users available',
        users: mockUsers.map(user => ({
          email: user.email,
          name: user.name,
          role: user.role
        }))
      });
    }

    // Check if admin user exists
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    
    if (!adminExists) {
      // Create default admin user
      const adminUser = new User({
        email: 'admin@example.com',
        password: 'admin123',
        name: 'System Administrator',
        role: 'admin',
        isActive: true
      });
      
      await adminUser.save();
      
      // Create default regular user
      const regularUser = new User({
        email: 'user@example.com',
        password: 'user123',
        name: 'Regular User',
        role: 'user',
        isActive: true
      });
      
      await regularUser.save();
      
      return NextResponse.json({
        success: true,
        message: 'Default users created successfully!',
        users: [
          { email: 'admin@example.com', name: 'System Administrator', role: 'admin' },
          { email: 'user@example.com', name: 'Regular User', role: 'user' }
        ]
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Default users already exist',
      users: [
        { email: 'admin@example.com', name: 'System Administrator', role: 'admin' },
        { email: 'user@example.com', name: 'Regular User', role: 'user' }
      ]
    });

  } catch (error) {
    console.error('Error initializing users:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to initialize users' },
      { status: 500 }
    );
  }
}