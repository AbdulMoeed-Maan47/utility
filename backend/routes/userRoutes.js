// routes/userRoutes.js
// Covers: POST /add-user, POST /login, POST /token/refresh, POST /logout

const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

const { getDB } = require("../db");
const {
  hashPassword,
  verifyPassword,
  createAccessToken,
  createRefreshToken,
  decodeToken,
} = require("../auth");
const { getCurrentTimestamp, getMonthYear, getYearMonth } = require("../utils");

// In-memory admin session store (matches admin_sessions = {} in main.py)
// Exported so adminRoutes can share the same reference
const adminSessions = {};
module.exports.adminSessions = adminSessions;

// ================================================================
// POST /add-user — Signup
// ================================================================
router.post("/add-user", async (req, res) => {
  try {
    const db = getDB();
    const user = req.body;

    // Check duplicate email
    const existing = await db.collection("user").findOne({ email: user.email });
    if (existing) {
      return res.status(400).json({ detail: "User already exists" });
    }

    user.password = hashPassword(user.password);
    user.createdAt = getCurrentTimestamp();

    const result = await db.collection("user").insertOne(user);
    const userId = result.insertedId.toString();

    // ---------------- PROVIDER PROFILE ----------------
    if (user.role === "provider") {
      const providerProfile = {
        id: uuidv4(),
        userId,
        email: user.email,
        fullName: user.fullName || user.name,
        phone: user.phone,
        serviceArea: user.city || user.location,

        serviceType: "",
        experience: 0,
        skills: [],
        address: "",

        rating: 0,
        jobsCompleted: 0,
        totalEarned: 0,
        successRate: 0,
        reviews: [],

        isVerified: false,
        isAvailable: true,
        isActive: true,

        settings: {
          emailNotifications: true,
          smsNotifications: true,
          showProfile: true,
        },

        memberSince: getMonthYear(),
        createdAt: getCurrentTimestamp(),
      };

      await db.collection("provider").insertOne(providerProfile);
    }

    // ---------------- CUSTOMER PROFILE ----------------
    if (user.role === "customer") {
      const customerProfile = {
        id: uuidv4(),
        userId,
        email: user.email,

        accountStatus: "Active",
        memberSince: getYearMonth(),

        activitySummary: {
          totalRequests: 0,
          completed: 0,
          cancelled: 0,
          totalSpent: 0,
          avgRatingGiven: 0,
        },

        preferences: {
          preferredServices: [],
          notificationsEnabled: true,
          emailNotifications: true,
          smsNotifications: true,
          marketingCommunications: false,
        },

        lastActive: new Date().toISOString(),
      };

      await db.collection("customer_profile").insertOne(customerProfile);
    }

    return res.json({ status: "success" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// POST /login
// ================================================================
router.post("/login", async (req, res) => {
  try {
    const db = getDB();
    const { email, password, role } = req.body;

    const dbUser = await db.collection("user").findOne({ email });
    if (!dbUser) {
      return res.status(401).json({ detail: "Invalid credentials" });
    }

    if (!verifyPassword(password, dbUser.password)) {
      return res.status(401).json({ detail: "Invalid credentials" });
    }

    // SAFE ROLE CHECK (matches original)
    const dbRole = (dbUser.role || "").trim().toLowerCase();
    const reqRole = (role || "").trim().toLowerCase();

    // DEBUG (matches original print statements)
    console.log("DB ROLE:", dbRole);
    console.log("REQUEST ROLE:", reqRole);

    if (dbRole !== reqRole) {
      return res.status(403).json({ detail: "Role mismatch" });
    }

    const tokenData = {
      sub: dbUser._id.toString(),
      email: dbUser.email,
      role: dbRole,
    };

    return res.json({
      status: "success",
      access_token: createAccessToken(tokenData),
      refresh_token: createRefreshToken(tokenData),
      token_type: "bearer",
      role: dbRole,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// POST /token/refresh
// ================================================================
router.post("/token/refresh", async (req, res) => {
  try {
    const refreshToken = req.body.refresh_token || "";
    let payload;
    try {
      payload = decodeToken(refreshToken);
    } catch {
      return res.status(401).json({ detail: "Invalid or expired token" });
    }

    if (payload.type !== "refresh") {
      return res.status(401).json({ detail: "Invalid refresh token" });
    }

    const newToken = createAccessToken({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    });

    return res.json({ access_token: newToken, token_type: "bearer" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// POST /logout
// Admin logout — clears in-memory session
// ================================================================
router.post("/logout", (req, res) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.json({ status: "success", message: "Logged out" });
  }

  const sessionId = authHeader.replace("Bearer ", "");
  if (adminSessions[sessionId]) {
    delete adminSessions[sessionId];
  }

  return res.json({ status: "success", message: "Logged out successfully" });
});

module.exports = router;
