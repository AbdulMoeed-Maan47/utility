// Entry point for the Express/Node.js backend
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const { connectDB, getDB } = require("./db");
const { hashPassword } = require("./auth");
const { getCurrentTimestamp } = require("./utils");

// ---- Route imports ----
const userRoutes = require("./routes/userRoutes");
const requestRoutes = require("./routes/requestRoutes");
const bidRoutes = require("./routes/bidRoutes");
const providerRoutes = require("./routes/providerRoutes");
const customerRoutes = require("./routes/customerRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const messageRoutes = require("./routes/messageRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PORT = process.env.PORT || 8000;

// ================================================================
// CORS — matches original allow_origins exactly
// ================================================================
app.use(
  cors({
    origin: [
      "https://utility-21cuupmbz-abdulmoeed-maan47s-projects.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["*"],
  }),
);

// ================================================================
// Body parser
// ================================================================
app.use(express.json());

// ================================================================
// ROOT — GET /
// ================================================================
app.get("/", (req, res) => {
  res.json({ message: "Backend connected" });
});

// ================================================================
// Routes
// ================================================================
app.use("/", userRoutes); // /add-user, /login, /token/refresh, /logout
app.use("/", requestRoutes); // /requests, /available-requests
app.use("/", bidRoutes); // /bids
app.use("/", providerRoutes); // /provider/*
app.use("/", customerRoutes); // /customer-profile/*, /customer/*
app.use("/", feedbackRoutes); // /feedback
app.use("/", messageRoutes); // /messages, /conversations
app.use("/", adminRoutes); // /admin/*

// ================================================================
// Global error handler
// Catches any error thrown without a status code and returns 500
// ================================================================
app.use((err, req, res, next) => {
  const status = err.status || 500;
  console.error(`[ERROR] ${status}:`, err.message);
  res.status(status).json({ detail: err.message || "Internal server error" });
});

// ================================================================
// create_admin()
// ================================================================
async function createAdmin(db) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const existing = await db
    .collection("user")
    .findOne({ email: adminEmail, role: "admin" });

  if (!existing) {
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

    await db.collection("user").insertOne({
      email: adminEmail,
      password: hashedPassword,
      fullName: "Admin",
      role: "admin",
      createdAt: getCurrentTimestamp(),
    });

    console.log(`New admin created: ${ADMIN_EMAIL}`);
  }
}

// ================================================================
// Start server — connect DB first, then listen
// ================================================================
async function start() {
  await connectDB();
  const db = getDB();
  await createAdmin(db);

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Error: Failed to start server:", err);
  process.exit(1);
});
