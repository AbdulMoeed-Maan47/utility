// routes/providerRoutes.js
// Covers:
//   GET    /provider/profile/:email
//   PUT    /provider/profile/update/:email
//   PUT    /provider/change-password/:email
//   PUT    /provider/settings/:email
//   PUT    /provider/deactivate/:email
//   DELETE /provider/delete/:email
//   GET    /provider/top?serviceType=

const express = require("express");
const router = express.Router();

const { getDB } = require("../db");
const authenticate = require("../middleware/authenticate");

// ================================================================
// GET /provider/profile/:email
// ================================================================
router.get("/provider/profile/:email", authenticate, async (req, res) => {
  try {
    const db = getDB();
    const currentUser = req.user;

    const profile = await db
      .collection("provider")
      .findOne({ email: currentUser.email }, { projection: { _id: 0 } });

    if (!profile) return res.status(404).json({ detail: "Profile not found" });
    return res.json(profile);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// PUT /provider/profile/update/:email
// ================================================================
router.put(
  "/provider/profile/update/:email",
  authenticate,
  async (req, res) => {
    try {
      const db = getDB();
      const data = req.body;
      const currentUser = req.user;

      const result = await db.collection("provider").updateOne(
        { email: currentUser.email },
        {
          $set: {
            fullName: data.fullName,
            phone: data.phone,
            serviceArea: data.serviceArea,
            serviceType: data.serviceType,
            experience: data.experience,
            skills: data.skills || [],
            address: data.address,
          },
        },
      );

      // Also sync relevant fields to the user collection
      await db.collection("user").updateOne(
        { email: currentUser.email },
        {
          $set: {
            fullName: data.fullName,
            phone: data.phone,
            location: data.serviceArea,
          },
        },
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ detail: "Provider not found" });
      }

      return res.json({ status: "success", message: "Profile updated" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ detail: err.message });
    }
  },
);

// ================================================================
// PUT /provider/change-password/:email
// NOTE: Original code compares plaintext passwords in this endpoint.
// Preserved as-is to match original behavior exactly.
// ================================================================
router.put(
  "/provider/change-password/:email",
  authenticate,
  async (req, res) => {
    try {
      const db = getDB();
      const { oldPassword, newPassword } = req.body;
      const currentUser = req.user;

      const user = await db
        .collection("user")
        .findOne({ email: currentUser.email });
      if (!user) return res.status(404).json({ detail: "User not found" });

      // Original uses plain equality check (not bcrypt verify)
      if (user.password !== oldPassword) {
        return res.status(400).json({ detail: "Old password incorrect" });
      }

      await db
        .collection("user")
        .updateOne(
          { email: currentUser.email },
          { $set: { password: newPassword } },
        );

      return res.json({ status: "success", message: "Password updated" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ detail: err.message });
    }
  },
);

// ================================================================
// PUT /provider/settings/:email
// ================================================================
router.put("/provider/settings/:email", authenticate, async (req, res) => {
  try {
    const db = getDB();
    const data = req.body;
    const currentUser = req.user;

    const result = await db
      .collection("provider")
      .updateOne(
        { email: currentUser.email },
        { $set: { settings: data.settings } },
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ detail: "Provider not found" });
    }

    return res.json({ status: "success" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// PUT /provider/deactivate/:email
// ================================================================
router.put("/provider/deactivate/:email", authenticate, async (req, res) => {
  try {
    const db = getDB();
    const currentUser = req.user;

    const result = await db
      .collection("provider")
      .updateOne(
        { email: currentUser.email },
        { $set: { isAvailable: false, isActive: false } },
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ detail: "Provider not found" });
    }

    return res.json({ status: "success", message: "Account deactivated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// DELETE /provider/delete/:email
// ================================================================
router.delete("/provider/delete/:email", authenticate, async (req, res) => {
  try {
    const db = getDB();
    const currentUser = req.user;

    await db.collection("provider").deleteOne({ email: currentUser.email });
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

// ================================================================
// GET /provider/top?serviceType=
// Returns top 5 scored providers for a given service type
// ================================================================
router.get("/provider/top", async (req, res) => {
  try {
    const db = getDB();
    const { serviceType } = req.query;

    const providers = await db
      .collection("provider")
      .find({ serviceType })
      .toArray();

    const result = [];

    for (const p of providers) {
      // Skip inactive/unavailable (same soft check as original)
      if (p.isActive === false) continue;
      if (p.isAvailable === false) continue;

      const rating = p.rating || 0;
      const jobs = p.jobsCompleted || 0;

      // Scoring formula (matches original)
      const score = rating * 0.7 + jobs * 0.3;

      // Badge logic (matches original)
      let badge = "";
      if (rating >= 4.5) badge = "Top Rated";
      else if (jobs >= 10) badge = "Experienced";

      result.push({
        id: p.id,
        fullName: p.fullName,
        serviceType: p.serviceType,
        rating,
        jobsCompleted: jobs,
        score,
        badge,
      });
    }

    // Sort by score descending, return top 5
    result.sort((a, b) => b.score - a.score);
    return res.json(result.slice(0, 5));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

module.exports = router;
