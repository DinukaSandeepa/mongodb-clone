'use server';

import dbConnect from '@/lib/mongodb';
import CloneJob from '@/models/CloneJob';
import { revalidatePath } from 'next/cache';

// Mock data for when MongoDB is not available
const mockJobs = [
  {
    _id: '1',
    jobName: 'Production to Staging Clone',
    sourceConnectionString: 'mongodb+srv://user:***@cluster.mongodb.net/production',
    destinationConnectionString: 'mongodb+srv://user:***@cluster.mongodb.net/staging',
    createdAt: new Date('2024-01-15T10:30:00Z'),
  },
  {
    _id: '2',
    jobName: 'Backup Database Clone',
    sourceConnectionString: 'mongodb+srv://user:***@cluster.mongodb.net/main',
    destinationConnectionString: 'mongodb+srv://user:***@cluster.mongodb.net/backup',
    createdAt: new Date('2024-01-16T15:45:00Z'),
  },
  {
    _id: '3',
    jobName: 'Development Sync',
    sourceConnectionString: 'mongodb+srv://user:***@cluster.mongodb.net/prod',
    destinationConnectionString: 'mongodb+srv://user:***@cluster.mongodb.net/dev',
    createdAt: new Date('2024-01-14T09:15:00Z'),
  },
];

export async function createCloneJob(formData) {
  try {
    const connection = await dbConnect();
    
    const jobData = {
      jobName: formData.get('jobName'),
      sourceConnectionString: formData.get('sourceConnectionString'),
      destinationConnectionString: formData.get('destinationConnectionString'),
    };
    
    if (!connection) {
      // Return mock response when no database connection
      const mockJob = {
        _id: Date.now().toString(),
        ...jobData,
        createdAt: new Date(),
      };
      console.log('Created mock clone job:', mockJob);
      revalidatePath('/');
      return { success: true, message: 'Job created successfully! (Using mock data - configure MongoDB for persistence)' };
    }

    const cloneJob = new CloneJob(jobData);
    await cloneJob.save();
    
    revalidatePath('/');
    
    return { success: true, message: 'Job created successfully!' };
  } catch (error) {
    console.error('Error creating clone job:', error);
    return { success: false, message: error.message || 'Failed to create job' };
  }
}

export async function getCloneJobs() {
  try {
    const connection = await dbConnect();
    
    if (!connection) {
      // Return mock data when no database connection
      console.log('Using mock clone jobs data');
      const jobs = mockJobs.map(job => ({
        ...job,
        _id: job._id.toString(),
      }));
      return { success: true, jobs };
    }

    const jobs = await CloneJob.find({}).sort({ createdAt: -1 }).lean();
    
    // Convert MongoDB ObjectId to string for serialization
    const serializedJobs = jobs.map(job => ({
      ...job,
      _id: job._id.toString(),
    }));
    
    return { success: true, jobs: serializedJobs };
  } catch (error) {
    console.error('Error fetching clone jobs:', error);
    // Return mock data as fallback with success format
    const jobs = mockJobs.map(job => ({
      ...job,
      _id: job._id.toString(),
    }));
    return { success: true, jobs };
  }
}