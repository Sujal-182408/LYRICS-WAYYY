import mongoose from "mongoose";

// ============================================================
// MONGODB CONNECTION
// ============================================================

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not configured.");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 20,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      family: 4,
    });

    console.log(
      `[DATABASE] MongoDB connected: ${mongoose.connection.name}`
    );

    console.log(
      `[DATABASE] Host: ${mongoose.connection.host}`
    );

    console.log(
      `[DATABASE] Ready state: ${mongoose.connection.readyState}`
    );

    return mongoose.connection;
  } catch (error) {
    console.error(
      "[DATABASE] Connection failed:",
      error.message
    );

    process.exit(1);
  }
};

// ============================================================
// CONNECTION EVENTS
// ============================================================

mongoose.connection.on("connected", () => {
  console.log("[DATABASE] MongoDB connection established.");
});

mongoose.connection.on("error", (error) => {
  console.error(
    "[DATABASE] MongoDB connection error:",
    error.message
  );
});

mongoose.connection.on("disconnected", () => {
  console.warn("[DATABASE] MongoDB disconnected.");
});

// ============================================================
// EXPORT
// ============================================================

export default connectDB;