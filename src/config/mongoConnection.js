import mongoose from "mongoose";
import { mongoConfig } from './settings.js';

let isConnected = false; // Cached connection for Vercel serverless

const connectDB = async () => {
  // If already connected, skip re-connecting
  if (isConnected) {
    console.log("MongoDB already connected.");
    return;
  }
  // Ensure env variable exists
  if (!process.env.MONGO_URI || !mongoConfig.serverUrl) {
    throw new Error("❌ Missing MONGO_URI in environment variables!");
  }

  try {
    const conn = await mongoose.connect(mongoConfig.serverUrl, mongoConfig.config);

    isConnected = conn.connections[0].readyState === 1;

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    return true
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    throw err;
  }
};

export default connectDB;