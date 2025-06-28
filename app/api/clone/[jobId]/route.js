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
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 15000,
    });
    const destinationClient = new MongoClient(destinationConnectionString, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 15000,
    });

    try {
      console.log('Connecting to source database...');
      await sourceClient.connect();
      console.log('Connected to source database');
      
      console.log('Connecting to destination database...');
      await destinationClient.connect();
      console.log('Connected to destination database');

      // Get database names and inspect the source
      const sourceAdmin = sourceClient.db().admin();
      const destinationAdmin = destinationClient.db().admin();

      // List all databases on the source server
      console.log('Listing all databases on source server...');
      try {
        const sourceDatabases = await sourceAdmin.listDatabases();
        console.log('Available databases on source:', sourceDatabases.databases.map(db => ({
          name: db.name,
          sizeOnDisk: db.sizeOnDisk,
          empty: db.empty
        })));
      } catch (error) {
        console.log('Could not list databases (might not have admin privileges):', error.message);
      }

      // Extract database name from connection string
      const sourceDbName = extractDatabaseName(sourceConnectionString);
      const destinationDbName = extractDatabaseName(destinationConnectionString);
      
      console.log('Source database name:', sourceDbName);
      console.log('Destination database name:', destinationDbName);

      const sourceDb = sourceDbName ? sourceClient.db(sourceDbName) : sourceClient.db();
      const destinationDb = destinationDbName ? destinationClient.db(destinationDbName) : destinationClient.db();

      // Get current database name
      const sourceDbInfo = await sourceDb.admin().command({ connectionStatus: 1 });
      console.log('Actually connected to source database:', sourceDbInfo.authInfo?.authenticatedUserRoles?.[0]?.db || 'unknown');

      // Test connections by getting database stats
      try {
        const sourceStats = await sourceDb.stats();
        console.log('Source database stats:', {
          db: sourceStats.db,
          collections: sourceStats.collections,
          objects: sourceStats.objects,
          dataSize: sourceStats.dataSize,
          storageSize: sourceStats.storageSize,
          indexes: sourceStats.indexes
        });
      } catch (error) {
        console.log('Could not get source database stats:', error.message);
      }

      // Get all collections from source database with more detailed info
      console.log('Listing collections from source database...');
      const collections = await sourceDb.listCollections().toArray();
      console.log('Raw collections response:', collections);
      
      // Also try alternative method to list collections
      try {
        const collectionNames = await sourceDb.listCollectionNames();
        console.log('Collection names (alternative method):', collectionNames);
      } catch (error) {
        console.log('Alternative collection listing failed:', error.message);
      }

      // If no collections found, try to check if we can access any data
      if (collections.length === 0) {
        console.log('No collections found. Checking database access...');
        
        // Try to run a simple command to verify database access
        try {
          const dbStats = await sourceDb.command({ dbStats: 1 });
          console.log('Database stats command result:', dbStats);
        } catch (error) {
          console.log('Database stats command failed:', error.message);
        }

        // Try to check if there are any collections with a different approach
        try {
          const adminResult = await sourceDb.admin().command({ listCollections: 1 });
          console.log('Admin listCollections result:', adminResult);
        } catch (error) {
          console.log('Admin listCollections failed:', error.message);
        }

        return NextResponse.json({
          success: false,
          message: `No collections found in source database '${sourceDbName || 'default'}'. This could mean:
1. The database is empty
2. You don't have permission to list collections
3. The database name in your connection string is incorrect
4. You're connecting to the wrong MongoDB instance

Please verify:
- Your connection string points to the correct database
- The database name is correct (currently: '${sourceDbName || 'using default database'}')
- You have read permissions on the source database
- The database actually contains data`,
          debug: {
            sourceDbName: sourceDbName || 'default',
            destinationDbName: destinationDbName || 'default',
            collectionsFound: collections.length,
            connectionSuccessful: true
          }
        });
      }

      console.log('Found collections:', collections.map(c => ({
        name: c.name,
        type: c.type,
        options: c.options
      })));
      
      let totalCollections = collections.length;
      let processedCollections = 0;
      let totalDocuments = 0;
      let clonedDocuments = 0;

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

// Helper function to extract database name from connection string
function extractDatabaseName(connectionString) {
  try {
    // Parse connection string to extract database name
    // Format: mongodb://[username:password@]host1[:port1][,...hostN[:portN]][/[defaultauthdb][?options]]
    const url = new URL(connectionString);
    const pathname = url.pathname;
    
    // Remove leading slash and get database name
    const dbName = pathname.substring(1);
    
    // If there's a query string, remove it
    const questionMarkIndex = dbName.indexOf('?');
    if (questionMarkIndex !== -1) {
      return dbName.substring(0, questionMarkIndex);
    }
    
    return dbName || null;
  } catch (error) {
    console.log('Could not parse database name from connection string:', error.message);
    return null;
  }
}