import { MongoClient, ServerApiVersion } from 'mongodb'
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI;

let client: MongoClient;
let clientPromise: Promise<MongoClient> | null = null;

if (!MONGODB_URI) {
  console.warn('WARNING: MONGODB_URI environment variable is not set. The application will run without database access.');
} else if (MONGODB_URI.includes('<user>') || MONGODB_URI.includes('<password>') || MONGODB_URI.includes('<cluster-url>')) {
  console.warn('WARNING: MONGODB_URI is using placeholder values. Please update your .env file with the actual connection string from MongoDB Atlas. The application will run without database access.');
} else {
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
    }
    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(MONGODB_URI, options);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    client = new MongoClient(MONGODB_URI, options);
    clientPromise = client.connect();
  }
}

// Mongoose connection for the new API endpoints
let isConnected = false;

export async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  if (isConnected) {
    return mongoose.connection;
  }

  try {
    const connection = await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('✅ Connected to MongoDB with Mongoose');
    return connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

export default clientPromise;
