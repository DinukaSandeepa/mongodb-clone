'use server';

import dbConnect from '@/lib/mongodb';
import CloneJob from '@/models/CloneJob';
import { revalidatePath } from 'next/cache';

export async function createCloneJob(formData) {
  try {
    await dbConnect();
    
    const jobData = {
      jobName: formData.get('jobName'),
      sourceConnectionString: formData.get('sourceConnectionString'),
      destinationConnectionString: formData.get('destinationConnectionString'),
    };

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
    await dbConnect();
    const jobs = await CloneJob.find({}).sort({ createdAt: -1 }).lean();
    
    // Convert MongoDB ObjectId to string for serialization
    return jobs.map(job => ({
      ...job,
      _id: job._id.toString(),
    }));
  } catch (error) {
    console.error('Error fetching clone jobs:', error);
    return [];
  }
}