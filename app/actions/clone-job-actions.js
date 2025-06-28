import dbConnect from '@/lib/mongodb';
import CloneJob from '@/models/CloneJob';

// Mock data for when MongoDB is not available
const mockJobs = [
  {
    _id: '1',
    sourceUrl: 'https://github.com/example/repo1',
    targetUrl: 'https://github.com/user/repo1-clone',
    status: 'completed',
    createdAt: new Date('2024-01-15'),
    completedAt: new Date('2024-01-15'),
  },
  {
    _id: '2',
    sourceUrl: 'https://github.com/example/repo2',
    targetUrl: 'https://github.com/user/repo2-clone',
    status: 'in-progress',
    createdAt: new Date('2024-01-16'),
  },
  {
    _id: '3',
    sourceUrl: 'https://github.com/example/repo3',
    targetUrl: 'https://github.com/user/repo3-clone',
    status: 'failed',
    createdAt: new Date('2024-01-14'),
    error: 'Repository not found',
  },
];

export async function createCloneJob(data) {
  try {
    const connection = await dbConnect();
    
    if (!connection) {
      // Return mock response when no database connection
      const mockJob = {
        _id: Date.now().toString(),
        ...data,
        status: 'pending',
        createdAt: new Date(),
      };
      console.log('Created mock clone job:', mockJob);
      return { success: true, job: mockJob };
    }

    const job = new CloneJob(data);
    await job.save();
    return { success: true, job };
  } catch (error) {
    console.error('Error creating clone job:', error);
    return { success: false, error: error.message };
  }
}

export async function getCloneJobs() {
  try {
    const connection = await dbConnect();
    
    if (!connection) {
      // Return mock data when no database connection
      console.log('Using mock clone jobs data');
      return { success: true, jobs: mockJobs };
    }

    const jobs = await CloneJob.find().sort({ createdAt: -1 });
    return { success: true, jobs };
  } catch (error) {
    console.error('Error fetching clone jobs:', error);
    // Return mock data as fallback
    return { success: true, jobs: mockJobs };
  }
}

export async function getCloneJobById(id) {
  try {
    const connection = await dbConnect();
    
    if (!connection) {
      // Return mock data when no database connection
      const mockJob = mockJobs.find(job => job._id === id);
      return { success: true, job: mockJob || null };
    }

    const job = await CloneJob.findById(id);
    return { success: true, job };
  } catch (error) {
    console.error('Error fetching clone job:', error);
    return { success: false, error: error.message };
  }
}

export async function updateCloneJobStatus(id, status, error = null) {
  try {
    const connection = await dbConnect();
    
    if (!connection) {
      // Update mock data when no database connection
      const jobIndex = mockJobs.findIndex(job => job._id === id);
      if (jobIndex !== -1) {
        mockJobs[jobIndex].status = status;
        if (error) mockJobs[jobIndex].error = error;
        if (status === 'completed') mockJobs[jobIndex].completedAt = new Date();
      }
      return { success: true };
    }

    const updateData = { status };
    if (error) updateData.error = error;
    if (status === 'completed') updateData.completedAt = new Date();

    const job = await CloneJob.findByIdAndUpdate(id, updateData, { new: true });
    return { success: true, job };
  } catch (error) {
    console.error('Error updating clone job:', error);
    return { success: false, error: error.message };
  }
}