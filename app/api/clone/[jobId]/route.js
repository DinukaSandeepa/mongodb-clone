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

    console.log('Starting clone job:', job.jobName);
    console.log('Source:', sourceConnectionString.replace(/\/\/.*@/, '//***:***@'));
    console.log('Destination:', destinationConnectionString.replace(/\/\/.*@/, '//***:***@'));

    // Connect to both source and destination databases
    const sourceClient = new MongoClient(sourceConnectionString, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    const destinationClient = new MongoClient(destinationConnectionString, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    try {
      console.log('Connecting to source database...');
      await sourceClient.connect();
      console.log('Connected to source database');
      
      console.log('Connecting to destination database...');
      await destinationClient.connect();
      console.log('Connected to destination database');

      const sourceDb = sourceClient.db();
      const destinationDb = destinationClient.db();

      // Test connections by getting database stats
      try {
        const sourceStats = await sourceDb.stats();
        console.log('Source database stats:', {
          collections: sourceStats.collections,
          dataSize: sourceStats.dataSize,
          storageSize: sourceStats.storageSize
        });
      } catch (error) {
        console.log('Could not get source database stats:', error.message);
      }

      // Get all collections from source database
      console.log('Listing collections from source database...');
      const collections = await sourceDb.listCollections().toArray();
      console.log('Found collections:', collections.map(c => c.name));
      
      let totalCollections = collections.length;
      let processedCollections = 0;
      let totalDocuments = 0;
      let clonedDocuments = 0;

      if (totalCollections === 0) {
        return NextResponse.json({
          success: false,
          message: 'No collections found in source database. The database might be empty or you might not have proper permissions.',
          stats: {
            totalCollections: 0,
            processedCollections: 0,
            totalDocuments: 0,
            clonedDocuments: 0
          }
        });
      }

      for (const collectionInfo of collections) {
        const collectionName = collectionInfo.name;
        console.log(`Processing collection: ${collectionName}`);
        
        // Skip system collections
        if (collectionName.startsWith('system.')) {
          console.log(`Skipping system collection: ${collectionName}`);
          processedCollections++;
          continue;
        }

        const sourceCollection = sourceDb.collection(collectionName);
        const destinationCollection = destinationDb.collection(collectionName);

        try {
          // Get document count
          const documentCount = await sourceCollection.countDocuments();
          console.log(`Collection ${collectionName} has ${documentCount} documents`);
          totalDocuments += documentCount;

          if (documentCount === 0) {
            console.log(`Collection ${collectionName} is empty, skipping...`);
            processedCollections++;
            continue;
          }

          // Clear destination collection first
          console.log(`Clearing destination collection: ${collectionName}`);
          const deleteResult = await destinationCollection.deleteMany({});
          console.log(`Deleted ${deleteResult.deletedCount} existing documents from ${collectionName}`);

          // Stream documents from source to destination
          const batchSize = 1000;
          let batch = [];
          let processedInCollection = 0;

          console.log(`Starting to clone documents from ${collectionName}...`);
          const cursor = sourceCollection.find({});
          
          for await (const doc of cursor) {
            batch.push(doc);
            processedInCollection++;
            
            if (batch.length >= batchSize) {
              await destinationCollection.insertMany(batch);
              clonedDocuments += batch.length;
              console.log(`Inserted batch of ${batch.length} documents into ${collectionName} (${processedInCollection}/${documentCount})`);
              batch = [];
            }
          }

          // Insert remaining documents
          if (batch.length > 0) {
            await destinationCollection.insertMany(batch);
            clonedDocuments += batch.length;
            console.log(`Inserted final batch of ${batch.length} documents into ${collectionName}`);
          }

          console.log(`Completed cloning collection ${collectionName}: ${processedInCollection} documents`);
          processedCollections++;

        } catch (collectionError) {
          console.error(`Error processing collection ${collectionName}:`, collectionError);
          // Continue with other collections even if one fails
          processedCollections++;
        }
      }

      console.log('Clone operation completed successfully');

      return NextResponse.json({
        success: true,
        message: `Successfully cloned ${processedCollections} collections with ${clonedDocuments} total documents`,
        stats: {
          totalCollections,
          processedCollections,
          totalDocuments,
          clonedDocuments,
        }
      });

    } finally {
      // Close connections
      console.log('Closing database connections...');
      await sourceClient.close();
      await destinationClient.close();
      console.log('Database connections closed');
    }

  } catch (error) {
    console.error('Cloning error:', error);
    
    let errorMessage = 'Cloning failed';
    
    if (error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Connection refused. Please check your connection strings and ensure the databases are accessible.';
    } else if (error.message.includes('Authentication failed')) {
      errorMessage = 'Authentication failed. Please check your username and password in the connection strings.';
    } else if (error.message.includes('Server selection timed out')) {
      errorMessage = 'Connection timeout. Please check your connection strings and network connectivity.';
    } else if (error.message.includes('Invalid connection string')) {
      errorMessage = 'Invalid connection string format. Please check your MongoDB connection strings.';
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        error: error.message,
        details: error.toString()
      },
      { status: 500 }
    );
  }
}