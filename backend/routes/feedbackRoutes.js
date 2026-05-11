// routes/feedbackRoutes.js
// Covers:
//   POST /feedback
//   GET  /feedback/provider/:provider_email

const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

const { getDB } = require("../db");
const authenticate = require("../middleware/authenticate");
const { getCurrentTimestamp } = require("../utils");

// ================================================================
// POST /feedback — Submit feedback for a completed request
// ================================================================
router.post("/feedback", authenticate, async (req, res) => {
  try {
    const db = getDB();
    const data = req.body;
    const currentUser = req.user;

    // Validate required fields
    const requiredFields = ["request_id", "customer_email", "rating"];
    for (const field of requiredFields) {
      if (!(field in data) || data[field] === "") {
        return res.status(400).json({ detail: `${field} is required` });
      }
    }

    // Get the request
    const request = await db
      .collection("requests")
      .findOne({ id: data.request_id });
    if (!request) return res.status(404).json({ detail: "Request not found" });

    // Authorization check
    if (request.user_email !== currentUser.email) {
      return res.status(403).json({ detail: "Not authorized" });
    }

    // Only allow feedback after completion
    if (request.status !== "completed") {
      return res
        .status(400)
        .json({ detail: "Feedback allowed only after completion" });
    }

    // Prevent duplicate feedback
    const existing = await db
      .collection("feedback")
      .findOne({ request_id: data.request_id });
    if (existing) {
      return res.status(400).json({ detail: "Feedback already submitted" });
    }

    // Get provider
    const providerEmail = request.provider_email || request.provider;
    const provider = await db
      .collection("provider")
      .findOne({ email: providerEmail });
    if (!provider)
      return res.status(404).json({ detail: "Provider not found" });

    // Build feedback document
    const feedback = {
      id: uuidv4(),

      request_id: request.id,
      bid_id: request.accepted_bid_id,

      customer_id: request.customer_id,
      customer_email: request.user_email,
      customer_name: request.user_name,

      provider_id: provider.userId,
      provider_email: providerEmail,
      provider_name: provider.fullName,

      rating: parseInt(data.rating),
      comment: data.comment || "",

      category: request.category,
      service_date: request.completed_at,

      created_at: getCurrentTimestamp(),
    };

    await db.collection("feedback").insertOne(feedback);

    // ⭐ Mark request as rated so frontend can hide the rating prompt
    await db
      .collection("requests")
      .updateOne({ id: request.id }, { $set: { feedback_given: true } });

    // Update provider rating using weighted average (matches original formula exactly)
    const oldRating = provider.rating || 0;
    const jobs = provider.jobsCompleted || 0;

    let newRating, newJobs;
    if (jobs === 0) {
      newRating = feedback.rating;
      newJobs = 1;
    } else {
      newRating = (oldRating * jobs + feedback.rating) / (jobs + 1);
      newJobs = jobs + 1;
    }

    await db.collection("provider").updateOne(
      { email: providerEmail },
      {
        $set: {
          rating: newRating,
          jobsCompleted: newJobs,
        },
        $push: {
          reviews: {
            rating: feedback.rating,
            comment: feedback.comment,
            customer_name: feedback.customer_name,
          },
        },
      },
    );

    return res.json({
      status: "success",
      message: "Feedback submitted successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// GET /feedback/provider/:provider_email
// ================================================================
router.get(
  "/feedback/provider/:provider_email",
  authenticate,
  async (req, res) => {
    try {
      const db = getDB();
      const currentUser = req.user;

      const feedbacks = await db
        .collection("feedback")
        .find({ provider_email: currentUser.email }, { projection: { _id: 0 } })
        .toArray();

      feedbacks.sort((a, b) =>
        (b.created_at || "").localeCompare(a.created_at || ""),
      );
      return res.json(feedbacks);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ detail: err.message });
    }
  },
);

module.exports = router;
