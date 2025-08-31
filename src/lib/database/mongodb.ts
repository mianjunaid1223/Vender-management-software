import { MongoClient, ServerApiVersion } from 'mongodb';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from 'dotenv';

config({ path: '.env.local' });

let mongoServer: MongoMemoryServer;
let client: MongoClient;
let clientPromise: Promise<MongoClient> | null = null;

async function getMongoUri() {
  if (process.env.FORCE_IN_MEMORY_DB === 'true') {
    console.log('FORCE_IN_MEMORY_DB is set, starting in-memory MongoDB server...');
    mongoServer = await MongoMemoryServer.create();
    return mongoServer.getUri();
  }
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }
  // If no URI is set, start an in-memory server as a fallback
  console.log('MONGODB_URI not found, starting in-memory MongoDB server as fallback...');
  mongoServer = await MongoMemoryServer.create();
  return mongoServer.getUri();
}

async function initializeMongo() {
  const uri = await getMongoUri();
  const options = {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  };

  if (process.env.NODE_ENV === 'development') {
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>
    };
    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
}

// We only initialize once
if (!clientPromise) {
  initializeMongo().catch(console.error);
}


// Mongoose connection for the new API endpoints
let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    return mongoose.connection;
  }

  const uri = await getMongoUri();

  try {
    const connection = await mongoose.connect(uri);
    isConnected = true;
    console.log('✅ Connected to MongoDB with Mongoose');
    return connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

export async function stopDB() {
    if (mongoServer) {
        await mongoose.connection.close();
        await mongoServer.stop();
        console.log('In-memory MongoDB server stopped.');
    }
}


export default clientPromise;
