import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { getCloneJobById } from '@/app/actions/clone-job-actions';
import { createCloneHistory } from '@/app/actions/clone-history-actions';

// Helper function to log operations (server-side logging)
function logOperation(level, category, message, details = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] [${category.toUpperCase()}] ${message}`, details);
}

export async function POST(request, { params }) {
  const { jobId } = params;
  const startTime = new Date();
  
  logOperation('info', 'clone_operation', 'Clone operation started', {
    jobId,
    startTime: startTime.toISOString()
  });
  
  try {
    // Get job details from our database (this will handle decryption)
    const jobResult = await getCloneJobById(jobId);
    
    if (!jobResult.success || !jobResult.job) {
      logOperation('error', 'clone_operation', 'Job not found for clone operation', { jobId });
      return NextResponse.json(
        { success: false, message: 'Job not found' },
        { status: 404 }
      );
    }

    const job = jobResult.job;
    const { sourceConnectionString, destinationConnectionString } = job;

    logOperation('info', 'clone_operation', 'Starting clone job execution', {
      jobId,
      jobName: job.jobName,
      sourceHost: sourceConnectionString.replace(/\/\/.*@/, '//***:***@'),
      destinationHost: destinationConnectionString.replace(/\/\/.*@/, '//***:***@')
    });

    // Connect to both source and destination databases
    const sourceClient = new MongoClient(sourceConnectionString, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 15000,
    });
    const destinationClient = new MongoClient(destinationConnectionString, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 15000,
    });

    let historyData = {
      jobId: job._id,
      jobName: job.jobName,
      status: 'running',
      startTime,
      collections: 0,
      documents: 0,
    };

    try {
      logOperation('info', 'clone_operation', 'Connecting to source database', { jobId });
      await sourceClient.connect();
      logOperation('success', 'clone_operation', 'Connected to source database', { jobId });
      
      logOperation('info', 'clone_operation', 'Connecting to destination database', { jobId });
      await destinationClient.connect();
      logOperation('success', 'clone_operation', 'Connected to destination database', { jobId });

      // Extract database name from connection string
      let sourceDbName = extractDatabaseName(sourceConnectionString);
      let destinationDbName = extractDatabaseName(destinationConnectionString);
      
      logOperation('info', 'clone_operation', 'Database names extracted', {
        jobId,
        sourceDbName,
        destinationDbName
      });

      // If no database name specified, use "busbuddy" as default
      if (!sourceDbName) {
        sourceDbName = 'busbuddy';
        logOperation('info', 'clone_operation', 'Using default source database name', {
          jobId,
          defaultName: sourceDbName
        });
      }

      // If no destination database name, use the same as source
      if (!destinationDbName) {
        destinationDbName = sourceDbName;
        logOperation('info', 'clone_operation', 'Using same database name for destination', {
          jobId,
          destinationDbName
        });
      }

      historyData.sourceDatabase = sourceDbName;
      historyData.destinationDatabase = destinationDbName;

      const sourceDb = sourceClient.db(sourceDbName);
      const destinationDb = destinationClient.db(destinationDbName);

      // Test connections by getting database stats
      try {
        const sourceStats = await sourceDb.stats();
        logOperation('info', 'clone_operation', 'Source database stats retrieved', {
          jobId,
          db: sourceStats.db,
          collections: sourceStats.collections,
          objects: sourceStats.objects,
          dataSize: sourceStats.dataSize,
          storageSize: sourceStats.storageSize,
          indexes: sourceStats.indexes
        });

        if (sourceStats.collections === 0) {
          // If the default "busbuddy" doesn't exist, try to find available databases
          if (sourceDbName === 'busbuddy') {
            logOperation('warning', 'clone_operation', 'Default database is empty, checking for available databases', { jobId });
            try {
              const sourceAdmin = sourceClient.db().admin();
              const sourceDatabases = await sourceAdmin.listDatabases();
              
              const availableDbs = sourceDatabases.databases.map(db => ({
                name: db.name,
                sizeOnDisk: db.sizeOnDisk,
                empty: db.empty
              }));
              
              logOperation('info', 'clone_operation', 'Available databases found', {
                jobId,
                databases: availableDbs
              });

              // Find the first non-system database with data
              const userDatabases = sourceDatabases.databases.filter(db => 
                !['admin', 'local', 'config', 'test'].includes(db.name) && !db.empty
              );

              if (userDatabases.length > 0) {
                const endTime = new Date();
                historyData.status = 'failed';
                historyData.endTime = endTime;
                historyData.duration = endTime - startTime;
                historyData.errorMessage = `Database 'busbuddy' is empty. Found these databases with data: ${userDatabases.map(db => db.name).join(', ')}. Please specify the correct database name in your connection string like: mongodb+srv://user:pass@host/DATABASE_NAME?options`;
                
                logOperation('error', 'clone_operation', 'Clone failed - empty default database', {
                  jobId,
                  availableDatabases: userDatabases.map(db => db.name),
                  errorMessage: historyData.errorMessage
                });
                
                await createCloneHistory(historyData);

                return NextResponse.json({
                  success: false,
                  message: historyData.errorMessage,
                  availableDatabases: sourceDatabases.databases.map(db => ({
                    name: db.name,
                    empty: db.empty,
                    sizeOnDisk: db.sizeOnDisk
                  }))
                });
              }
            } catch (adminError) {
              logOperation('warning', 'clone_operation', 'Could not list databases (insufficient privileges)', {
                jobId,
                error: adminError.message
              });
            }
          }

          const endTime = new Date();
          historyData.status = 'failed';
          historyData.endTime = endTime;
          historyData.duration = endTime - startTime;
          historyData.errorMessage = `Database '${sourceDbName}' exists but contains no collections. Please verify this is the correct database or specify the database name in your connection string.`;
          
          logOperation('error', 'clone_operation', 'Clone failed - no collections found', {
            jobId,
            sourceDbName,
            errorMessage: historyData.errorMessage
          });
          
          await createCloneHistory(historyData);

          return NextResponse.json({
            success: false,
            message: historyData.errorMessage,
            debug: {
              sourceDbName,
              destinationDbName,
              collectionsFound: 0,
              databaseExists: true
            }
          });
        }
      } catch (error) {
        logOperation('warning', 'clone_operation', 'Could not get source database stats', {
          jobId,
          error: error.message
        });
      }

      // Get all collections from source database
      logOperation('info', 'clone_operation', 'Listing collections from source database', { jobId });
      const collections = await sourceDb.listCollections().toArray();
      
      const collectionInfo = collections.map(c => ({
        name: c.name,
        type: c.type
      }));
      
      logOperation('info', 'clone_operation', 'Collections found', {
        jobId,
        collections: collectionInfo,
        count: collections.length
      });

      if (collections.length === 0) {
        const endTime = new Date();
        historyData.status = 'failed';
        historyData.endTime = endTime;
        historyData.duration = endTime - startTime;
        historyData.errorMessage = `No collections found in database '${sourceDbName}'. Please verify: 1. The database name is correct 2. You have read permissions on the database 3. The database contains data`;
        
        logOperation('error', 'clone_operation', 'Clone failed - no collections found', {
          jobId,
          sourceDbName,
          errorMessage: historyData.errorMessage
        });
        
        await createCloneHistory(historyData);

        return NextResponse.json({
          success: false,
          message: historyData.errorMessage,
          debug: {
            sourceDbName,
            destinationDbName,
            collectionsFound: 0,
            connectionSuccessful: true
          }
        });
      }
      
      let totalCollections = collections.length;
      let processedCollections = 0;
      let totalDocuments = 0;
      let clonedDocuments = 0;

      logOperation('info', 'clone_operation', 'Starting collection processing', {
        jobId,
        totalCollections
      });

      for (const collectionInfo of collections) {
        const collectionName = collectionInfo.name;
        logOperation('info', 'clone_operation', 'Processing collection', {
          jobId,
          collectionName,
          progress: `${processedCollections + 1}/${totalCollections}`
        });
        
        // Skip system collections
        if (collectionName.startsWith('system.')) {
          logOperation('info', 'clone_operation', 'Skipping system collection', {
            jobId,
            collectionName
          });
          processedCollections++;
          continue;
        }

        const sourceCollection = sourceDb.collection(collectionName);
        const destinationCollection = destinationDb.collection(collectionName);

        try {
          // Get document count
          const documentCount = await sourceCollection.countDocuments();
          logOperation('info', 'clone_operation', 'Collection document count', {
            jobId,
            collectionName,
            documentCount
          });
          totalDocuments += documentCount;

          if (documentCount === 0) {
            logOperation('info', 'clone_operation', 'Skipping empty collection', {
              jobId,
              collectionName
            });
            processedCollections++;
            continue;
          }

          // Clear destination collection first
          logOperation('info', 'clone_operation', 'Clearing destination collection', {
            jobId,
            collectionName
          });
          const deleteResult = await destinationCollection.deleteMany({});
          logOperation('info', 'clone_operation', 'Destination collection cleared', {
            jobId,
            collectionName,
            deletedCount: deleteResult.deletedCount
          });

          // Stream documents from source to destination
          const batchSize = 1000;
          let batch = [];
          let processedInCollection = 0;

          logOperation('info', 'clone_operation', 'Starting document cloning', {
            jobId,
            collectionName,
            batchSize
          });
          
          const cursor = sourceCollection.find({});
          
          for await (const doc of cursor) {
            batch.push(doc);
            processedInCollection++;
            
            if (batch.length >= batchSize) {
              await destinationCollection.insertMany(batch);
              clonedDocuments += batch.length;
              logOperation('debug', 'clone_operation', 'Batch inserted', {
                jobId,
                collectionName,
                batchSize: batch.length,
                progress: `${processedInCollection}/${documentCount}`,
                totalCloned: clonedDocuments
              });
              batch = [];
            }
          }

          // Insert remaining documents
          if (batch.length > 0) {
            await destinationCollection.insertMany(batch);
            clonedDocuments += batch.length;
            logOperation('debug', 'clone_operation', 'Final batch inserted', {
              jobId,
              collectionName,
              batchSize: batch.length,
              totalCloned: clonedDocuments
            });
          }

          logOperation('success', 'clone_operation', 'Collection cloning completed', {
            jobId,
            collectionName,
            documentsCloned: processedInCollection
          });
          processedCollections++;

        } catch (collectionError) {
          logOperation('error', 'clone_operation', 'Error processing collection', {
            jobId,
            collectionName,
            error: collectionError.message,
            stack: collectionError.stack
          });
          // Continue with other collections even if one fails
          processedCollections++;
        }
      }

      const endTime = new Date();
      const duration = endTime - startTime;

      // Update history data with success
      historyData.status = 'completed';
      historyData.endTime = endTime;
      historyData.duration = duration;
      historyData.collections = processedCollections;
      historyData.documents = clonedDocuments;
      historyData.stats = {
        totalCollections,
        processedCollections,
        totalDocuments,
        clonedDocuments,
      };

      await createCloneHistory(historyData);

      logOperation('success', 'clone_operation', 'Clone operation completed successfully', {
        jobId,
        jobName: job.jobName,
        duration: Math.round(duration / 1000),
        stats: {
          totalCollections,
          processedCollections,
          totalDocuments,
          clonedDocuments,
          sourceDatabase: sourceDbName,
          destinationDatabase: destinationDbName
        }
      });

      return NextResponse.json({
        success: true,
        message: `Successfully cloned ${processedCollections} collections with ${clonedDocuments} total documents from database '${sourceDbName}' to '${destinationDbName}'`,
        stats: {
          totalCollections,
          processedCollections,
          totalDocuments,
          clonedDocuments,
          sourceDatabase: sourceDbName,
          destinationDatabase: destinationDbName,
          duration: Math.round(duration / 1000) + 's'
        }
      });

    } finally {
      // Close connections
      logOperation('info', 'clone_operation', 'Closing database connections', { jobId });
      await sourceClient.close();
      await destinationClient.close();
      logOperation('info', 'clone_operation', 'Database connections closed', { jobId });
    }

  } catch (error) {
    logOperation('error', 'clone_operation', 'Clone operation failed', {
      jobId,
      error: error.message,
      stack: error.stack
    });
    
    const endTime = new Date();
    const duration = endTime - startTime;

    // Record failed operation in history
    const failedHistoryData = {
      jobId: jobId,
      jobName: 'Unknown Job',
      status: 'failed',
      startTime,
      endTime,
      duration,
      collections: 0,
      documents: 0,
      errorMessage: error.message,
    };

    try {
      const jobResult = await getCloneJobById(jobId);
      if (jobResult.success && jobResult.job) {
        failedHistoryData.jobName = jobResult.job.jobName;
      }
    } catch (jobError) {
      logOperation('error', 'clone_operation', 'Could not fetch job details for history', {
        jobId,
        error: jobError.message
      });
    }

    await createCloneHistory(failedHistoryData);
    
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