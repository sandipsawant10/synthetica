import mongoose from "mongoose";

const DEFAULT_MONGO_URI = "mongodb://127.0.0.1:27017/synthetica";

export async function connectMongo() {
  const mongoUri = process.env.MONGODB_URI || DEFAULT_MONGO_URI;

  try {
    await mongoose.connect(mongoUri);
    console.log(`[DB] MongoDB connected: ${mongoUri}`);
    return true;
  } catch (error) {
    console.error("[DB] Failed to connect to MongoDB:", error.message);
    return false;
  }
}

export default connectMongo;
