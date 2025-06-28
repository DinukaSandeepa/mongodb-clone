import { NextResponse } from 'next/server';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Simulate some API work and measure response time
    const testOperations = [
      // Test basic response time
      Promise.resolve(),
      // Test a small delay to simulate real work
      new Promise(resolve => setTimeout(resolve, Math.random() * 50)),
      // Test memory usage
      Promise.resolve(process.memoryUsage()),
    ];
    
    await Promise.all(testOperations);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const memoryUsage = process.memoryUsage();
    
    // Calculate performance status based on response time
    let status = 'optimal';
    let statusColor = 'green';
    
    if (responseTime > 1000) {
      status = 'slow';
      statusColor = 'red';
    } else if (responseTime > 500) {
      status = 'moderate';
      statusColor = 'yellow';
    } else if (responseTime > 200) {
      status = 'good';
      statusColor = 'blue';
    }
    
    // Memory usage in MB
    const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    
    return NextResponse.json({
      success: true,
      status,
      statusColor,
      responseTime: `${responseTime}ms`,
      responseTimeMs: responseTime,
      memory: {
        used: memoryMB,
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
      },
      message: `API responding in ${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.error('API performance check failed:', error);
    
    return NextResponse.json({
      success: false,
      status: 'error',
      statusColor: 'red',
      responseTime: `${responseTime}ms`,
      responseTimeMs: responseTime,
      message: error.message || 'API performance check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}