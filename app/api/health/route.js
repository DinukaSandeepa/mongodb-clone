import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';

export async function GET() {
  try {
    const connection = await dbConnect();
    
    if (!connection) {
      return NextResponse.json({
        success: false,
        status: 'disconnected',
        message: 'No MongoDB connection configured',
        timestamp: new Date().toISOString()
      });
    }

    // Test the connection by running a simple operation
    const db = connection.connection.db;
    await db.admin().ping();
    
    return NextResponse.json({
      success: true,
      status: 'connected',
      message: 'Database connection is healthy',
      database: db.databaseName,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    
    return NextResponse.json({
      success: false,
      status: 'error',
      message: error.message || 'Database connection failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}