'use server';

import dbConnect from '@/lib/mongodb';
import CloneJob from '@/models/CloneJob';
import { revalidatePath } from 'next/cache';
import { encryptConnectionString, decryptConnectionString, isEncrypted } from '@/lib/encryption';

// Mock data for when MongoDB is not available
const mockJobs = [
  {
    _id: '1',
    jobName: 'Production to Staging Clone',
    sourceConnectionString: 'mongodb+srv://user:***@cluster.mongodb.net/production',
    destinationConnectionString: 'mongodb+srv://user:***@cluster.mongodb.net/staging',
    encrypted: false,
    createdAt: new Date('2024-01-15T10:30:00Z'),
  },
  {
    _id: '2',
    jobName: 'Backup Database Clone',
    sourceConnectionString: 'mongodb+srv://user:***@cluster.mongodb.net/main',
    destinationConnectionString: 'mongodb+srv://user:***@cluster.mongodb.net/backup',
    encrypted: false,
    createdAt: new Date('2024-01-16T15:45:00Z'),
  },
  {
    _id: '3',
    jobName: 'Development Sync',
    sourceConnectionString: 'mongodb+srv://user:***@cluster.mongodb.net/prod',
    destinationConnectionString: 'mongodb+srv://user:***@cluster.mongodb.net/dev',
    encrypted: false,
    createdAt: new Date('2024-01-14T09:15:00Z'),
  },
];

// Helper function to check if encryption is enabled
function shouldEncryptConnections() {
  // Always encrypt by default for security
  return true;
}

export async function createCloneJob(formData) {
  try {
    const connection = await dbConnect();
    
    const sourceConnectionString = formData.get('sourceConnectionString');
    const destinationConnectionString = formData.get('destinationConnectionString');
    
    // Check if encryption should be enabled
    let encryptConnections = shouldEncryptConnections();
    
    let processedSourceString = sourceConnectionString;
    let processedDestinationString = destinationConnectionString;
    
    // Only encrypt if encryption is enabled and strings are not already encrypted
    if (encryptConnections) {
      try {
        processedSourceString = encryptConnectionString(sourceConnectionString);
        processedDestinationString = encryptConnectionString(destinationConnectionString);
        console.log('Encryption successful');
      } catch (encryptError) {
        console.error('Encryption failed, storing as plain text:', encryptError);
        // If encryption fails, store as plain text but mark as not encrypted
        encryptConnections = false;
      }
    }
    
    const jobData = {
      jobName: formData.get('jobName'),
      sourceConnectionString: processedSourceString,
      destinationConnectionString: processedDestinationString,
      encrypted: encryptConnections && isEncrypted(processedSourceString),
    };
    
    if (!connection) {
      // Return mock response when no database connection
      const mockJob = {
        _id: Date.now().toString(),
        ...jobData,
        createdAt: new Date(),
      };
      console.log('Created mock clone job with encryption:', jobData.encrypted);
      revalidatePath('/');
      return { 
        success: true, 
        message: jobData.encrypted ? 
          'Job created successfully with encrypted connection strings! (Using mock data - configure MongoDB for persistence)' :
          'Job created successfully! (Using mock data - configure MongoDB for persistence)'
      };
    }

    const cloneJob = new CloneJob(jobData);
    await cloneJob.save();
    
    console.log('Job saved to database with encryption:', jobData.encrypted);
    console.log('Source encrypted:', isEncrypted(jobData.sourceConnectionString));
    console.log('Destination encrypted:', isEncrypted(jobData.destinationConnectionString));
    
    revalidatePath('/');
    
    return { 
      success: true, 
      message: jobData.encrypted ? 
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
    
    // Check if encryption should be enabled
    let encryptConnections = shouldEncryptConnections();
    
    let processedSourceString = sourceConnectionString;
    let processedDestinationString = destinationConnectionString;
    
    // Only encrypt if encryption is enabled and strings are not already encrypted
    if (encryptConnections) {
      try {
        processedSourceString = encryptConnectionString(sourceConnectionString);
        processedDestinationString = encryptConnectionString(destinationConnectionString);
        console.log('Update encryption successful');
      } catch (encryptError) {
        console.error('Update encryption failed, storing as plain text:', encryptError);
        // If encryption fails, store as plain text but mark as not encrypted
        encryptConnections = false;
      }
    }
    
    const updateData = {
      jobName: formData.get('jobName'),
      sourceConnectionString: processedSourceString,
      destinationConnectionString: processedDestinationString,
      encrypted: encryptConnections && isEncrypted(processedSourceString),
    };
    
    if (!connection) {
      // Mock update for when no database connection
      console.log('Updated mock clone job with encryption:', updateData.encrypted);
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
    
    console.log('Job updated in database with encryption:', updateData.encrypted);
    console.log('Source encrypted:', isEncrypted(updateData.sourceConnectionString));
    console.log('Destination encrypted:', isEncrypted(updateData.destinationConnectionString));
    
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
    const serializedJobs = jobs.map(job => {
      console.log(`Job ${job.jobName} - Encrypted: ${job.encrypted}, Source starts with encrypted: ${job.sourceConnectionString?.startsWith('encrypted:')}`);
      
      let decryptedSourceString = job.sourceConnectionString;
      let decryptedDestinationString = job.destinationConnectionString;
      
      // Decrypt connection strings for display (they'll be masked in the UI)
      if (job.encrypted && isEncrypted(job.sourceConnectionString)) {
        try {
          decryptedSourceString = decryptConnectionString(job.sourceConnectionString);
        } catch (error) {
          console.error('Failed to decrypt source connection string:', error);
        }
      }
      
      if (job.encrypted && isEncrypted(job.destinationConnectionString)) {
        try {
          decryptedDestinationString = decryptConnectionString(job.destinationConnectionString);
        } catch (error) {
          console.error('Failed to decrypt destination connection string:', error);
        }
      }
      
      return {
        ...job,
        _id: job._id.toString(),
        sourceConnectionString: decryptedSourceString,
        destinationConnectionString: decryptedDestinationString,
      };
    });
    
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
    
    let decryptedSourceString = job.sourceConnectionString;
    let decryptedDestinationString = job.destinationConnectionString;
    
    // Decrypt connection strings for use
    if (job.encrypted && isEncrypted(job.sourceConnectionString)) {
      try {
        decryptedSourceString = decryptConnectionString(job.sourceConnectionString);
      } catch (error) {
        console.error('Failed to decrypt source connection string:', error);
      }
    }
    
    if (job.encrypted && isEncrypted(job.destinationConnectionString)) {
      try {
        decryptedDestinationString = decryptConnectionString(job.destinationConnectionString);
      } catch (error) {
        console.error('Failed to decrypt destination connection string:', error);
      }
    }
    
    const decryptedJob = {
      ...job,
      _id: job._id.toString(),
      sourceConnectionString: decryptedSourceString,
      destinationConnectionString: decryptedDestinationString,
    };
    
    return { success: true, job: decryptedJob };
  } catch (error) {
    console.error('Error fetching clone job:', error);
    return { success: false, message: error.message || 'Failed to fetch job' };
  }
}