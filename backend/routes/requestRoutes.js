// routes/requestRoutes.js
// Covers:
//   POST   /requests
//   GET    /requests/:email
//   GET    /available-requests/:provider_email
//   PUT    /requests/:request_id/complete
//   PUT    /requests/:request_id/cancel

const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

const { getDB } = require("../db");
const authenticate = require("../middleware/authenticate");
const { getCurrentTimestamp } = require("../utils");

// ================================================================
// POST /requests — Create a new service request (customer only)
// ================================================================
router.post("/requests", authenticate, async (req, res) => {
  try {
    const db = getDB();
    const request = req.body;
    const currentUser = req.user;

    if (!currentUser.email) {
      return res.status(400).json({ detail: "user_email is required" });
    }

    const user = await db
      .collection("user")
      .findOne({ email: currentUser.email });
    if (!user) return res.status(404).json({ detail: "User not found" });
    if (user.role !== "customer") {
      return res
        .status(403)
        .json({ detail: "Only customers can create requests" });
    }

    const requiredFields = [
      "category",
      "description",
      "budget",
      "date",
      "time",
    ];
    for (const field of requiredFields) {
      if (!(field in request) || request[field] === "") {
        return res.status(400).json({ detail: `${field} is required` });
      }
    }

    const allowedCategories = [
      "plumber",
      "electrician",
      "mechanic",
      "carpenter",
      "general repair",
    ];
    if (!allowedCategories.includes(request.category)) {
      return res.status(400).json({ detail: "Invalid category" });
    }

    if (request.latitude == null || request.longitude == null) {
      return res.status(400).json({ detail: "Location is required" });
    }

    const newRequest = {
      id: uuidv4(),

      user_email: currentUser.email,
      user_name: user.fullName || user.name,
      customer_id: user._id.toString(),

      category: request.category,
      description: request.description,
      image_url: request.image_url || "",

      location: {
        type: "Point",
        coordinates: [request.longitude, request.latitude],
      },

      location_name: request.location_name || "",
      location_link:
        request.location_link ||
        `https://www.google.com/maps?q=${request.latitude},${request.longitude}`,

      budget: parseInt(request.budget),
      date: request.date,
      time: request.time,
      note: request.note || "",

      status: "pending",
      created_at: getCurrentTimestamp(),
    };

    await db.collection("requests").insertOne(newRequest);
    return res.json({ status: "success", id: newRequest.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// GET /requests/:email — Get all requests for the current (customer) user
// ================================================================
router.get("/requests/:email", authenticate, async (req, res) => {
  try {
    const db = getDB();
    const currentUser = req.user;

    const requests = await db
      .collection("requests")
      .find({ user_email: currentUser.email }, { projection: { _id: 0 } })
      .toArray();

    return res.json(requests);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// GET /available-requests/:provider_email
// Returns open requests the provider has NOT already bid on
// Optional query param: ?category=
// ================================================================
router.get(
  "/available-requests/:provider_email",
  authenticate,
  async (req, res) => {
    try {
      const db = getDB();
      const currentUser = req.user;
      const category = req.query.category || "";

      // Get all request IDs this provider already bid on
      const alreadyBid = await db
        .collection("bids")
        .distinct("request_id", { provider_email: currentUser.email });

      const query = {
        status: { $in: ["pending", "open"] },
        id: { $nin: alreadyBid },
      };

      if (category) {
        query.category = category;
      }

      const raw = await db
        .collection("requests")
        .find(query, { projection: { _id: 0 } })
        .toArray();

      // Attach total bid count to each request
      const result = [];
      for (const req_ of raw) {
        const totalBids = await db
          .collection("bids")
          .countDocuments({ request_id: req_.id });
        result.push({ ...req_, totalBids });
      }

      // Sort by created_at descending (matches Python sort)
      result.sort((a, b) => {
        const ta = a.created_at || "";
        const tb = b.created_at || "";
        return tb.localeCompare(ta);
      });

      return res.json(result);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ detail: err.message });
    }
  },
);

// ================================================================
// PUT /requests/:request_id/complete — Mark a request as complete
// ================================================================
router.put("/requests/:request_id/complete", authenticate, async (req, res) => {
  try {
    const db = getDB();
    const { request_id } = req.params;
    const currentUser = req.user;
    const customerEmail = currentUser.email;

    if (!customerEmail) {
      return res.status(400).json({ detail: "customer_email is required" });
    }

    const request = await db.collection("requests").findOne({ id: request_id });
    if (!request) return res.status(404).json({ detail: "Request not found" });
    if (request.user_email !== customerEmail) {
      return res.status(403).json({ detail: "Not authorized" });
    }
    if (request.status !== "in_progress") {
      return res
        .status(400)
        .json({ detail: "Only in-progress requests can be marked complete" });
    }

    const completedAt = getCurrentTimestamp();

    await db.collection("requests").updateOne(
      { id: request_id },
      {
        $set: {
          status: "completed",
          task_completed: true,
          completed_at: completedAt,
        },
      },
    );

    // Get accepted bid and provider details
    const acceptedBidId = request.accepted_bid_id;
    let bidAmount = 0;
    let providerEmail = request.provider_email || request.provider;

    if (acceptedBidId) {
      const bid = await db.collection("bids").findOne({ id: acceptedBidId });
      if (bid) {
        bidAmount = bid.bid_amount || 0;
        if (!providerEmail) providerEmail = bid.provider_email;
      }

      await db
        .collection("bids")
        .updateOne(
          { id: acceptedBidId },
          { $set: { status: "completed", completed_at: completedAt } },
        );
    }

    // ✅ Update provider profile stats (jobsCompleted commented out — matches original)
    if (providerEmail) {
      await db.collection("provider").updateOne(
        { email: providerEmail },
        {
          $inc: {
            // jobsCompleted: 1,  // commented out in original
            totalEarned: bidAmount,
          },
        },
      );
    }

    return res.json({
      status: "success",
      message: "Task marked as complete",
      completed_at: completedAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// PUT /requests/:request_id/cancel — Cancel a request
// ================================================================
router.put("/requests/:request_id/cancel", authenticate, async (req, res) => {
  try {
    const db = getDB();
    const { request_id } = req.params;
    const currentUser = req.user;
    const customerEmail = currentUser.email;

    if (!customerEmail) {
      return res.status(400).json({ detail: "customer_email is required" });
    }

    const request = await db.collection("requests").findOne({ id: request_id });
    if (!request) return res.status(404).json({ detail: "Request not found" });
    if (request.user_email !== customerEmail) {
      return res.status(403).json({ detail: "Not authorized" });
    }
    if (request.status === "completed") {
      return res
        .status(400)
        .json({ detail: "Cannot cancel completed request" });
    }

    const cancelledAt = getCurrentTimestamp();

    await db.collection("requests").updateOne(
      { id: request_id },
      {
        $set: {
          status: "cancelled",
          cancelled_at: cancelledAt,
          service_started: false,
        },
      },
    );

    // Also cancel the accepted bid if one exists
    const acceptedBidId = request.accepted_bid_id;
    if (acceptedBidId) {
      await db
        .collection("bids")
        .updateOne(
          { id: acceptedBidId },
          { $set: { status: "cancelled", cancelled_at: cancelledAt } },
        );
    }

    return res.json({
      status: "success",
      message: "Request cancelled",
      cancelled_at: cancelledAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

module.exports = router;
