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

// Helper function to log operations (server-side logging)
function logOperation(level, category, message, details = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] [${category.toUpperCase()}] ${message}`, details);
}

export async function createCloneJob(formData) {
  try {
    const connection = await dbConnect();
    
    const sourceConnectionString = formData.get('sourceConnectionString');
    const destinationConnectionString = formData.get('destinationConnectionString');
    const jobName = formData.get('jobName');
    
    // Log job creation attempt
    logOperation('info', 'job_management', 'Clone job creation started', {
      jobName,
      hasSource: !!sourceConnectionString,
      hasDestination: !!destinationConnectionString
    });
    
    // Check if encryption should be enabled
    let encryptConnections = shouldEncryptConnections();
    
    let processedSourceString = sourceConnectionString;
    let processedDestinationString = destinationConnectionString;
    
    // Only encrypt if encryption is enabled and strings are not already encrypted
    if (encryptConnections) {
      try {
        processedSourceString = encryptConnectionString(sourceConnectionString);
        processedDestinationString = encryptConnectionString(destinationConnectionString);
        logOperation('info', 'job_management', 'Connection strings encrypted successfully', { jobName });
      } catch (encryptError) {
        logOperation('error', 'job_management', 'Encryption failed, storing as plain text', {
          jobName,
          error: encryptError.message
        });
        // If encryption fails, store as plain text but mark as not encrypted
        encryptConnections = false;
      }
    }
    
    const jobData = {
      jobName,
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
      logOperation('warning', 'job_management', 'Created mock clone job (no database connection)', {
        jobId: mockJob._id,
        jobName,
        encrypted: jobData.encrypted
      });
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
    
    logOperation('success', 'job_management', 'Clone job created successfully', {
      jobId: cloneJob._id.toString(),
      jobName,
      encrypted: jobData.encrypted,
      sourceEncrypted: isEncrypted(jobData.sourceConnectionString),
      destinationEncrypted: isEncrypted(jobData.destinationConnectionString)
    });
    
    revalidatePath('/');
    
    return { 
      success: true, 
      message: jobData.encrypted ? 
        'Job created successfully with encrypted connection strings!' :
        'Job created successfully!'
    };
  } catch (error) {
    logOperation('error', 'job_management', 'Failed to create clone job', {
      error: error.message,
      stack: error.stack
    });
    console.error('Error creating clone job:', error);
    return { success: false, message: error.message || 'Failed to create job' };
  }
}

export async function updateCloneJob(jobId, formData) {
  try {
    const connection = await dbConnect();
    
    const sourceConnectionString = formData.get('sourceConnectionString');
    const destinationConnectionString = formData.get('destinationConnectionString');
    const jobName = formData.get('jobName');
    
    logOperation('info', 'job_management', 'Clone job update started', {
      jobId,
      jobName
    });
    
    // Check if encryption should be enabled
    let encryptConnections = shouldEncryptConnections();
    
    let processedSourceString = sourceConnectionString;
    let processedDestinationString = destinationConnectionString;
    
    // Only encrypt if encryption is enabled and strings are not already encrypted
    if (encryptConnections) {
      try {
        processedSourceString = encryptConnectionString(sourceConnectionString);
        processedDestinationString = encryptConnectionString(destinationConnectionString);
        logOperation('info', 'job_management', 'Connection strings encrypted for update', { jobId, jobName });
      } catch (encryptError) {
        logOperation('error', 'job_management', 'Update encryption failed, storing as plain text', {
          jobId,
          jobName,
          error: encryptError.message
        });
        // If encryption fails, store as plain text but mark as not encrypted
        encryptConnections = false;
      }
    }
    
    const updateData = {
      jobName,
      sourceConnectionString: processedSourceString,
      destinationConnectionString: processedDestinationString,
      encrypted: encryptConnections && isEncrypted(processedSourceString),
    };
    
    if (!connection) {
      // Mock update for when no database connection
      logOperation('warning', 'job_management', 'Updated mock clone job (no database connection)', {
        jobId,
        jobName,
        encrypted: updateData.encrypted
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
      logOperation('error', 'job_management', 'Job not found for update', { jobId });
      return { success: false, message: 'Job not found' };
    }
    
    logOperation('success', 'job_management', 'Clone job updated successfully', {
      jobId,
      jobName,
      encrypted: updateData.encrypted,
      sourceEncrypted: isEncrypted(updateData.sourceConnectionString),
      destinationEncrypted: isEncrypted(updateData.destinationConnectionString)
    });
    
    revalidatePath('/');
    
    return { 
      success: true, 
      message: 'Job updated successfully!'
    };
  } catch (error) {
    logOperation('error', 'job_management', 'Failed to update clone job', {
      jobId,
      error: error.message,
      stack: error.stack
    });
    console.error('Error updating clone job:', error);
    return { success: false, message: error.message || 'Failed to update job' };
  }
}

export async function deleteCloneJob(jobId) {
  try {
    const connection = await dbConnect();
    
    logOperation('info', 'job_management', 'Clone job deletion started', { jobId });
    
    if (!connection) {
      // Mock delete for when no database connection
      logOperation('warning', 'job_management', 'Deleted mock clone job (no database connection)', { jobId });
      revalidatePath('/');
      return { 
        success: true, 
        message: 'Job deleted successfully! (Using mock data - configure MongoDB for persistence)'
      };
    }

    const deletedJob = await CloneJob.findByIdAndDelete(jobId);
    
    if (!deletedJob) {
      logOperation('error', 'job_management', 'Job not found for deletion', { jobId });
      return { success: false, message: 'Job not found' };
    }
    
    logOperation('success', 'job_management', 'Clone job deleted successfully', {
      jobId,
      jobName: deletedJob.jobName,
      wasEncrypted: deletedJob.encrypted
    });
    
    revalidatePath('/');
    
    return { 
      success: true, 
      message: 'Job deleted successfully!'
    };
  } catch (error) {
    logOperation('error', 'job_management', 'Failed to delete clone job', {
      jobId,
      error: error.message,
      stack: error.stack
    });
    console.error('Error deleting clone job:', error);
    return { success: false, message: error.message || 'Failed to delete job' };
  }
}

export async function getCloneJobs() {
  try {
    const connection = await dbConnect();
    
    if (!connection) {
      // Return mock data when no database connection
      logOperation('info', 'job_management', 'Using mock clone jobs data (no database connection)');
      const jobs = mockJobs.map(job => ({
        ...job,
        _id: job._id.toString(),
      }));
      return { success: true, jobs };
    }

    const jobs = await CloneJob.find({}).sort({ createdAt: -1 }).lean();
    
    logOperation('info', 'job_management', 'Retrieved clone jobs from database', {
      jobCount: jobs.length
    });
    
    // Convert MongoDB ObjectId to string for serialization and decrypt if needed
    const serializedJobs = jobs.map(job => {
      let decryptedSourceString = job.sourceConnectionString;
      let decryptedDestinationString = job.destinationConnectionString;
      
      // Decrypt connection strings for display (they'll be masked in the UI)
      if (job.encrypted && isEncrypted(job.sourceConnectionString)) {
        try {
          decryptedSourceString = decryptConnectionString(job.sourceConnectionString);
        } catch (error) {
          logOperation('error', 'job_management', 'Failed to decrypt source connection string', {
            jobId: job._id.toString(),
            error: error.message
          });
        }
      }
      
      if (job.encrypted && isEncrypted(job.destinationConnectionString)) {
        try {
          decryptedDestinationString = decryptConnectionString(job.destinationConnectionString);
        } catch (error) {
          logOperation('error', 'job_management', 'Failed to decrypt destination connection string', {
            jobId: job._id.toString(),
            error: error.message
          });
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
    logOperation('error', 'job_management', 'Failed to fetch clone jobs', {
      error: error.message,
      stack: error.stack
    });
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
    
    logOperation('info', 'job_management', 'Retrieving clone job by ID', { jobId });
    
    if (!connection) {
      // Return mock data when no database connection
      const mockJob = mockJobs.find(job => job._id === jobId);
      if (!mockJob) {
        logOperation('error', 'job_management', 'Mock job not found', { jobId });
        return { success: false, message: 'Job not found' };
      }
      logOperation('info', 'job_management', 'Retrieved mock clone job', { jobId, jobName: mockJob.jobName });
      return { success: true, job: mockJob };
    }

    const job = await CloneJob.findById(jobId).lean();
    
    if (!job) {
      logOperation('error', 'job_management', 'Job not found in database', { jobId });
      return { success: false, message: 'Job not found' };
    }
    
    let decryptedSourceString = job.sourceConnectionString;
    let decryptedDestinationString = job.destinationConnectionString;
    
    // Decrypt connection strings for use
    if (job.encrypted && isEncrypted(job.sourceConnectionString)) {
      try {
        decryptedSourceString = decryptConnectionString(job.sourceConnectionString);
      } catch (error) {
        logOperation('error', 'job_management', 'Failed to decrypt source connection string for job retrieval', {
          jobId,
          error: error.message
        });
      }
    }
    
    if (job.encrypted && isEncrypted(job.destinationConnectionString)) {
      try {
        decryptedDestinationString = decryptConnectionString(job.destinationConnectionString);
      } catch (error) {
        logOperation('error', 'job_management', 'Failed to decrypt destination connection string for job retrieval', {
          jobId,
          error: error.message
        });
      }
    }
    
    const decryptedJob = {
      ...job,
      _id: job._id.toString(),
      sourceConnectionString: decryptedSourceString,
      destinationConnectionString: decryptedDestinationString,
    };
    
    logOperation('success', 'job_management', 'Retrieved clone job successfully', {
      jobId,
      jobName: job.jobName,
      encrypted: job.encrypted
    });
    
    return { success: true, job: decryptedJob };
  } catch (error) {
    logOperation('error', 'job_management', 'Failed to fetch clone job by ID', {
      jobId,
      error: error.message,
      stack: error.stack
    });
    console.error('Error fetching clone job:', error);
    return { success: false, message: error.message || 'Failed to fetch job' };
  }
}