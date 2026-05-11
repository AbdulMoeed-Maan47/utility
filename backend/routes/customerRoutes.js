// routes/customerRoutes.js
// Covers:
//   GET    /customer-profile/:email
//   PUT    /customer-profile/update/:email
//   PUT    /customer/change-password/:email
//   PUT    /customer/settings/:email
//   PUT    /customer/deactivate/:email
//   DELETE /customer/delete/:email

const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

const { getDB } = require("../db");
const authenticate = require("../middleware/authenticate");
const { getYearMonth } = require("../utils");

// ================================================================
// GET /customer-profile/:email
// Returns user info + customer profile. Creates profile if missing.
// ================================================================
router.get("/customer-profile/:email", authenticate, async (req, res) => {
  try {
    const db = getDB();
    const currentUser = req.user;

    const user = await db
      .collection("user")
      .findOne({ email: currentUser.email });
    if (!user) return res.status(404).json({ detail: "User not found" });

    const userId = user._id.toString();

    let profile = await db
      .collection("customer_profile")
      .findOne({ userId }, { projection: { _id: 0 } });

    // Auto-create profile if not found (matches original behavior)
    if (!profile) {
      profile = {
        id: uuidv4(),
        userId,
        email: currentUser.email,
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
      await db.collection("customer_profile").insertOne(profile);
    }

    return res.json({
      user: {
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        location: user.location,
        role: user.role,
      },
      profile,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// PUT /customer-profile/update/:email
// ================================================================
router.put(
  "/customer-profile/update/:email",
  authenticate,
  async (req, res) => {
    try {
      const db = getDB();
      const data = req.body;
      const currentUser = req.user;

      const user = await db
        .collection("user")
        .findOne({ email: currentUser.email });
      if (!user) return res.status(404).json({ detail: "User not found" });

      await db.collection("user").updateOne(
        { email: currentUser.email },
        {
          $set: {
            fullName: data.fullName,
            phone: data.phone,
            location: data.location,
          },
        },
      );

      const userId = user._id.toString();
      await db
        .collection("customer_profile")
        .updateOne(
          { userId },
          { $set: { lastActive: new Date().toISOString() } },
        );

      return res.json({
        status: "success",
        message: "Profile updated successfully",
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ detail: err.message });
    }
  },
);

// ================================================================
// PUT /customer/change-password/:email
// NOTE: Original code compares plaintext passwords (not bcrypt verify).
// Preserved exactly to match original behavior.
// ================================================================
router.put(
  "/customer/change-password/:email",
  authenticate,
  async (req, res) => {
    try {
      const db = getDB();
      const { oldPassword, newPassword } = req.body;
      const currentUser = req.user;

      if (!oldPassword || !newPassword) {
        return res
          .status(400)
          .json({ detail: "oldPassword and newPassword are required" });
      }
      if (newPassword.length < 4) {
        return res
          .status(400)
          .json({ detail: "New password must be at least 4 characters" });
      }

      const user = await db
        .collection("user")
        .findOne({ email: currentUser.email });
      if (!user) return res.status(404).json({ detail: "User not found" });

      // Original uses plain equality check (not bcrypt verify)
      if (user.password !== oldPassword) {
        return res.status(400).json({ detail: "Old password is incorrect" });
      }

      await db
        .collection("user")
        .updateOne(
          { email: currentUser.email },
          { $set: { password: newPassword } },
        );

      return res.json({
        status: "success",
        message: "Password changed successfully",
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ detail: err.message });
    }
  },
);

// ================================================================
// PUT /customer/settings/:email
// ================================================================
router.put("/customer/settings/:email", authenticate, async (req, res) => {
  try {
    const db = getDB();
    const data = req.body;
    const currentUser = req.user;

    const user = await db
      .collection("user")
      .findOne({ email: currentUser.email });
    if (!user) return res.status(404).json({ detail: "User not found" });

    const userId = user._id.toString();

    const result = await db.collection("customer_profile").updateOne(
      { userId },
      {
        $set: {
          "preferences.emailNotifications": data.emailNotifications ?? true,
          "preferences.smsNotifications": data.smsNotifications ?? true,
          "preferences.marketingCommunications":
            data.marketingCommunications ?? false,
          // notificationsEnabled mirrors emailNotifications (matches original)
          "preferences.notificationsEnabled": data.emailNotifications ?? true,
          lastActive: new Date().toISOString(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ detail: "Customer profile not found" });
    }

    return res.json({ status: "success", message: "Settings updated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// PUT /customer/deactivate/:email
// ================================================================
router.put("/customer/deactivate/:email", authenticate, async (req, res) => {
  try {
    const db = getDB();
    const currentUser = req.user;

    const user = await db
      .collection("user")
      .findOne({ email: currentUser.email });
    if (!user) return res.status(404).json({ detail: "User not found" });

    const userId = user._id.toString();

    const result = await db
      .collection("customer_profile")
      .updateOne({ userId }, { $set: { accountStatus: "Inactive" } });

    if (result.matchedCount === 0) {
      return res.status(404).json({ detail: "Customer profile not found" });
    }

    return res.json({ status: "success", message: "Account deactivated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// DELETE /customer/delete/:email
// Deletes profile, all requests, and user account
// ================================================================
router.delete("/customer/delete/:email", authenticate, async (req, res) => {
  try {
    const db = getDB();
    const currentUser = req.user;

    const user = await db
      .collection("user")
      .findOne({ email: currentUser.email });
    if (!user) return res.status(404).json({ detail: "User not found" });

    const userId = user._id.toString();

    await db.collection("customer_profile").deleteOne({ userId });
    await db
      .collection("requests")
      .deleteMany({ user_email: currentUser.email });
    await db.collection("user").deleteOne({ email: currentUser.email });

    return res.json({
      status: "success",
      message: "Account deleted permanently",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

module.exports = router;
