'use server';

import dbConnect from '@/lib/mongodb';
import CloneJob from '@/models/CloneJob';
import { revalidatePath } from 'next/cache';
import { encryptConnectionString, decryptConnectionString } from '@/lib/encryption';

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
    
    const sourceConnectionString = formData.get('sourceConnectionString');
    const destinationConnectionString = formData.get('destinationConnectionString');
    
    // Check if encryption is enabled (this would come from user settings)
    // For now, we'll encrypt by default - in a real app, this would check user preferences
    const shouldEncrypt = true; // This could be retrieved from user settings
    
    const jobData = {
      jobName: formData.get('jobName'),
      sourceConnectionString: shouldEncrypt ? 
        encryptConnectionString(sourceConnectionString) : 
        sourceConnectionString,
      destinationConnectionString: shouldEncrypt ? 
        encryptConnectionString(destinationConnectionString) : 
        destinationConnectionString,
      encrypted: shouldEncrypt,
    };
    
    if (!connection) {
      // Return mock response when no database connection
      const mockJob = {
        _id: Date.now().toString(),
        ...jobData,
        createdAt: new Date(),
      };
      console.log('Created mock clone job:', {
        ...mockJob,
        sourceConnectionString: '🔒 [Encrypted]',
        destinationConnectionString: '🔒 [Encrypted]'
      });
      revalidatePath('/');
      return { 
        success: true, 
        message: shouldEncrypt ? 
          'Job created successfully with encrypted connection strings! (Using mock data - configure MongoDB for persistence)' :
          'Job created successfully! (Using mock data - configure MongoDB for persistence)'
      };
    }

    const cloneJob = new CloneJob(jobData);
    await cloneJob.save();
    
    revalidatePath('/');
    
    return { 
      success: true, 
      message: shouldEncrypt ? 
        'Job created successfully with encrypted connection strings!' :
        'Job created successfully!'
    };
  } catch (error) {
    console.error('Error creating clone job:', error);
    return { success: false, message: error.message || 'Failed to create job' };
  }
}

export async function updateCloneJob(jobId, formData) {
  try {
    const connection = await dbConnect();
    
    const sourceConnectionString = formData.get('sourceConnectionString');
    const destinationConnectionString = formData.get('destinationConnectionString');
    
    // Check if encryption is enabled
    const shouldEncrypt = true; // This could be retrieved from user settings
    
    const updateData = {
      jobName: formData.get('jobName'),
      sourceConnectionString: shouldEncrypt ? 
        encryptConnectionString(sourceConnectionString) : 
        sourceConnectionString,
      destinationConnectionString: shouldEncrypt ? 
        encryptConnectionString(destinationConnectionString) : 
        destinationConnectionString,
      encrypted: shouldEncrypt,
    };
    
    if (!connection) {
      // Mock update for when no database connection
      console.log('Updated mock clone job:', {
        _id: jobId,
        ...updateData,
        sourceConnectionString: '🔒 [Encrypted]',
        destinationConnectionString: '🔒 [Encrypted]'
      });
      revalidatePath('/');
      return { 
        success: true, 
        message: 'Job updated successfully! (Using mock data - configure MongoDB for persistence)'
      };
    }

    const updatedJob = await CloneJob.findByIdAndUpdate(
      jobId, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!updatedJob) {
      return { success: false, message: 'Job not found' };
    }
    
    revalidatePath('/');
    
    return { 
      success: true, 
      message: 'Job updated successfully!'
    };
  } catch (error) {
    console.error('Error updating clone job:', error);
    return { success: false, message: error.message || 'Failed to update job' };
  }
}

export async function deleteCloneJob(jobId) {
  try {
    const connection = await dbConnect();
    
    if (!connection) {
      // Mock delete for when no database connection
      console.log('Deleted mock clone job:', jobId);
      revalidatePath('/');
      return { 
        success: true, 
        message: 'Job deleted successfully! (Using mock data - configure MongoDB for persistence)'
      };
    }

    const deletedJob = await CloneJob.findByIdAndDelete(jobId);
    
    if (!deletedJob) {
      return { success: false, message: 'Job not found' };
    }
    
    revalidatePath('/');
    
    return { 
      success: true, 
      message: 'Job deleted successfully!'
    };
  } catch (error) {
    console.error('Error deleting clone job:', error);
    return { success: false, message: error.message || 'Failed to delete job' };
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
    
    // Convert MongoDB ObjectId to string for serialization and decrypt if needed
    const serializedJobs = jobs.map(job => ({
      ...job,
      _id: job._id.toString(),
      // Decrypt connection strings for display (they'll be masked in the UI)
      sourceConnectionString: job.encrypted ? 
        decryptConnectionString(job.sourceConnectionString) : 
        job.sourceConnectionString,
      destinationConnectionString: job.encrypted ? 
        decryptConnectionString(job.destinationConnectionString) : 
        job.destinationConnectionString,
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

export async function getCloneJobById(jobId) {
  try {
    const connection = await dbConnect();
    
    if (!connection) {
      // Return mock data when no database connection
      const mockJob = mockJobs.find(job => job._id === jobId);
      if (!mockJob) {
        return { success: false, message: 'Job not found' };
      }
      return { success: true, job: mockJob };
    }

    const job = await CloneJob.findById(jobId).lean();
    
    if (!job) {
      return { success: false, message: 'Job not found' };
    }
    
    // Decrypt connection strings for use
    const decryptedJob = {
      ...job,
      _id: job._id.toString(),
      sourceConnectionString: job.encrypted ? 
        decryptConnectionString(job.sourceConnectionString) : 
        job.sourceConnectionString,
      destinationConnectionString: job.encrypted ? 
        decryptConnectionString(job.destinationConnectionString) : 
        job.destinationConnectionString,
    };
    
    return { success: true, job: decryptedJob };
  } catch (error) {
    console.error('Error fetching clone job:', error);
    return { success: false, message: error.message || 'Failed to fetch job' };
  }
}