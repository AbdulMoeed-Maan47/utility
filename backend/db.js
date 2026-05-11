require("dotenv").config();
const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("Error: MONGO_URI not found in .env file");
}

if (
  !MONGO_URI.startsWith("mongodb://") &&
  !MONGO_URI.startsWith("mongodb+srv://")
) {
  throw new Error(
    "Error: Invalid MONGO_URI format. Must start with 'mongodb://' or 'mongodb+srv://'",
  );
}

const client = new MongoClient(MONGO_URI);

let db;

async function connectDB() {
  try {
    if (db) return db; // prevent reconnecting
    await client.connect();

    // Ping to confirm connection
    await client.db("admin").command({ ping: 1 });

    db = client.db("utility_db");

    console.log("MongoDB connected ✅");
  } catch (err) {
    console.error("Error: MongoDB connection failed:", err);
    throw err;
  }
}

// Returns the same db instance always — all routes import this
function getDB() {
  if (!db) throw new Error("DB not initialized. Call connectDB() first.");
  return db;
}

module.exports = { connectDB, getDB };
