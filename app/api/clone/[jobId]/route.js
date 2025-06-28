import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import dbConnect from '@/lib/mongodb';
import CloneJob from '@/models/CloneJob';

export async function POST(request, { params }) {
  const { jobId } = params;
  
  try {
    // Get job details from our database
    await dbConnect();
    const job = await CloneJob.findById(jobId);
    
    if (!job) {
      return NextResponse.json(
        { success: false, message: 'Job not found' },
        { status: 404 }
      );
    }

    const { sourceConnectionString, destinationConnectionString } = job;

    // Connect to both source and destination databases
    const sourceClient = new MongoClient(sourceConnectionString);
    const destinationClient = new MongoClient(destinationConnectionString);

    await sourceClient.connect();
    await destinationClient.connect();

    const sourceDb = sourceClient.db();
    const destinationDb = destinationClient.db();

    // Get all collections from source database
    const collections = await sourceDb.listCollections().toArray();
    
    let totalCollections = collections.length;
    let processedCollections = 0;

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      
      // Skip system collections
      if (collectionName.startsWith('system.')) {
        processedCollections++;
        continue;
      }

      const sourceCollection = sourceDb.collection(collectionName);
      const destinationCollection = destinationDb.collection(collectionName);

      // Clear destination collection first
      await destinationCollection.deleteMany({});

      // Stream documents from source to destination
      const cursor = sourceCollection.find({});
      const batchSize = 1000;
      let batch = [];

      await cursor.forEach(async (doc) => {
        batch.push(doc);
        
        if (batch.length >= batchSize) {
          await destinationCollection.insertMany(batch);
          batch = [];
        }
      });

      // Insert remaining documents
      if (batch.length > 0) {
        await destinationCollection.insertMany(batch);
      }

      processedCollections++;
    }

    // Close connections
    await sourceClient.close();
    await destinationClient.close();

    return NextResponse.json({
      success: true,
      message: `Successfully cloned ${processedCollections} collections`,
      stats: {
        totalCollections,
        processedCollections,
      }
    });

  } catch (error) {
    console.error('Cloning error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Cloning failed',
        error: error.toString()
      },
      { status: 500 }
    );
  }
}