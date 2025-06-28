'use server';

import dbConnect from '@/lib/mongodb';
import CloneHistory from '@/models/CloneHistory';

// Mock history data for when MongoDB is not available
const mockHistory = [
  {
    _id: '1',
    jobId: '1',
    jobName: 'Production to Staging Clone',
    status: 'completed',
    startTime: new Date('2024-01-15T10:30:00Z'),
    endTime: new Date('2024-01-15T10:32:15Z'),
    duration: 135000, // 2m 15s in milliseconds
    collections: 12,
    documents: 15420,
    sourceDatabase: 'production',
    destinationDatabase: 'staging',
    createdAt: new Date('2024-01-15T10:32:15Z'),
  },
  {
    _id: '2',
    jobId: '2',
    jobName: 'Backup Database Clone',
    status: 'completed',
    startTime: new Date('2024-01-14T15:45:00Z'),
    endTime: new Date('2024-01-14T15:47:30Z'),
    duration: 150000, // 2m 30s in milliseconds
    collections: 8,
    documents: 8750,
    sourceDatabase: 'main',
    destinationDatabase: 'backup',
    createdAt: new Date('2024-01-14T15:47:30Z'),
  },
  {
    _id: '3',
    jobId: '3',
    jobName: 'Development Sync',
    status: 'failed',
    startTime: new Date('2024-01-13T09:15:00Z'),
    endTime: new Date('2024-01-13T09:15:45Z'),
    duration: 45000, // 45s in milliseconds
    collections: 0,
    documents: 0,
    sourceDatabase: 'prod',
    destinationDatabase: 'dev',
    errorMessage: 'Connection timeout',
    createdAt: new Date('2024-01-13T09:15:45Z'),
  },
  {
    _id: '4',
    jobId: '1',
    jobName: 'Production to Staging Clone',
    status: 'completed',
    startTime: new Date('2024-01-12T14:20:00Z'),
    endTime: new Date('2024-01-12T14:21:45Z'),
    duration: 105000, // 1m 45s in milliseconds
    collections: 12,
    documents: 14200,
    sourceDatabase: 'production',
    destinationDatabase: 'staging',
    createdAt: new Date('2024-01-12T14:21:45Z'),
  },
];

export async function createCloneHistory(historyData) {
  try {
    const connection = await dbConnect();
    
    if (!connection) {
      console.log('Created mock clone history:', historyData);
      return { success: true, message: 'History recorded (mock data)' };
    }

    const cloneHistory = new CloneHistory(historyData);
    await cloneHistory.save();
    
    return { success: true, message: 'History recorded successfully!' };
  } catch (error) {
    console.error('Error creating clone history:', error);
    return { success: false, message: error.message || 'Failed to record history' };
  }
}

export async function getCloneHistory() {
  try {
    const connection = await dbConnect();
    
    if (!connection) {
      console.log('Using mock clone history data');
      const history = mockHistory.map(item => ({
        ...item,
        _id: item._id.toString(),
      }));
      return { success: true, history };
    }

    const history = await CloneHistory.find({})
      .sort({ createdAt: -1 })
      .populate('jobId', 'jobName')
      .lean();
    
    const serializedHistory = history.map(item => ({
      ...item,
      _id: item._id.toString(),
      jobId: item.jobId ? item.jobId._id.toString() : item.jobId,
    }));
    
    return { success: true, history: serializedHistory };
  } catch (error) {
    console.error('Error fetching clone history:', error);
    const history = mockHistory.map(item => ({
      ...item,
      _id: item._id.toString(),
    }));
    return { success: true, history };
  }
}

export async function getCloneStats() {
  try {
    const connection = await dbConnect();
    
    if (!connection) {
      // Calculate stats from mock data
      const completedOperations = mockHistory.filter(item => item.status === 'completed');
      const failedOperations = mockHistory.filter(item => item.status === 'failed');
      
      const totalOperations = mockHistory.length;
      const successfulOperations = completedOperations.length;
      const successRate = totalOperations > 0 ? Math.round((successfulOperations / totalOperations) * 100) : 0;
      
      // Calculate average duration for completed operations
      const avgDuration = completedOperations.length > 0 
        ? completedOperations.reduce((sum, item) => sum + item.duration, 0) / completedOperations.length
        : 0;
      
      const formatDuration = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes > 0) {
          return `${minutes}m ${remainingSeconds}s`;
        }
        return `${remainingSeconds}s`;
      };

      return {
        success: true,
        stats: {
          totalOperations,
          successfulOperations,
          failedOperations: failedOperations.length,
          successRate,
          avgDuration: formatDuration(avgDuration),
          avgDurationMs: avgDuration,
        }
      };
    }

    const totalOperations = await CloneHistory.countDocuments();
    const successfulOperations = await CloneHistory.countDocuments({ status: 'completed' });
    const failedOperations = await CloneHistory.countDocuments({ status: 'failed' });
    
    const successRate = totalOperations > 0 ? Math.round((successfulOperations / totalOperations) * 100) : 0;
    
    // Calculate average duration for completed operations
    const completedOps = await CloneHistory.find({ 
      status: 'completed',
      duration: { $exists: true, $ne: null }
    }).select('duration');
    
    const avgDuration = completedOps.length > 0 
      ? completedOps.reduce((sum, item) => sum + item.duration, 0) / completedOps.length
      : 0;
    
    const formatDuration = (ms) => {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      
      if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
      }
      return `${remainingSeconds}s`;
    };

    return {
      success: true,
      stats: {
        totalOperations,
        successfulOperations,
        failedOperations,
        successRate,
        avgDuration: formatDuration(avgDuration),
        avgDurationMs: avgDuration,
      }
    };
  } catch (error) {
    console.error('Error fetching clone stats:', error);
    return {
      success: false,
      stats: {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        successRate: 0,
        avgDuration: '0s',
        avgDurationMs: 0,
      }
    };
  }
}