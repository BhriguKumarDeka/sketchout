import mongoose from 'mongoose';

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sketchout';
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[MongoDB] Connected to database at: ${mongoUri}`);
    return true;
  } catch (err: any) {
    console.warn(`[MongoDB Warning] Could not connect to MongoDB at ${mongoUri}. Operating with resilient memory sync.`);
    console.warn(`[MongoDB Note] Ensure MongoDB is running (e.g. via 'mongod' or MongoDB Compass/Atlas) to persist to disk.`);
    return false;
  }
};
