// routes/bidRoutes.js
// Covers:
//   POST   /bids
//   GET    /bids/provider/:provider_email
//   GET    /bids/request/:request_id
//   DELETE /bids/:bid_id
//   PUT    /bids/:bid_id/status
//   PUT    /bids/:bid_id/start

const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

const { getDB } = require("../db");
const authenticate = require("../middleware/authenticate");
const { getCurrentTimestamp } = require("../utils");

// ================================================================
// POST /bids — Submit a bid (provider only)
// ================================================================
router.post("/bids", authenticate, async (req, res) => {
  try {
    const db = getDB();
    const data = req.body;
    const currentUser = req.user;

    const required = [
      "request_id",
      "provider_email",
      "bid_amount",
      "availability",
      "completion_time",
    ];
    for (const field of required) {
      if (!(field in data) || data[field] === "") {
        return res.status(400).json({ detail: `${field} is required` });
      }
    }

    const request = await db
      .collection("requests")
      .findOne({ id: data.request_id });
    if (!request) return res.status(404).json({ detail: "Request not found" });
    if (!["pending", "open"].includes(request.status)) {
      return res
        .status(400)
        .json({ detail: "This request is no longer open for bids" });
    }

    const provider = await db
      .collection("provider")
      .findOne({ email: currentUser.email });
    if (!provider)
      return res.status(404).json({ detail: "Provider not found" });

    const existing = await db.collection("bids").findOne({
      request_id: data.request_id,
      provider_email: currentUser.email,
    });
    if (existing) {
      return res
        .status(400)
        .json({ detail: "You have already submitted a bid for this request" });
    }

    const newBid = {
      id: uuidv4(),
      request_id: data.request_id,

      provider_email: data.provider_email,
      provider_name: provider.fullName || "",
      provider_service_type: provider.serviceType || "",
      provider_rating: provider.rating || 0,

      bid_amount: parseInt(data.bid_amount),
      availability: data.availability,
      completion_time: data.completion_time,
      message: data.message || "",

      request_snapshot: {
        title: request.description || "",
        category: request.category || "",
        customer_name: request.user_name || "",
        customer_email: request.user_email || "",
        budget: request.budget || 0,
        location_name: request.location_name || "",
        date: request.date || "",
        time: request.time || "",
      },

      status: "pending",
      created_at: getCurrentTimestamp(),
    };

    await db.collection("bids").insertOne(newBid);
    return res.json({ status: "success", bid_id: newBid.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// GET /bids/provider/:provider_email — Get all bids by current provider
// NOTE: Must be declared BEFORE /bids/:bid_id to avoid route conflict
// ================================================================
router.get("/bids/provider/:provider_email", authenticate, async (req, res) => {
  try {
    const db = getDB();
    const currentUser = req.user;

    const bids = await db
      .collection("bids")
      .find({ provider_email: currentUser.email }, { projection: { _id: 0 } })
      .toArray();

    bids.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    return res.json(bids);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// GET /bids/request/:request_id — Get all bids for a request (no auth)
// NOTE: Must be declared BEFORE /bids/:bid_id to avoid route conflict
// ================================================================
router.get("/bids/request/:request_id", async (req, res) => {
  try {
    const db = getDB();
    const { request_id } = req.params;

    const bids = await db
      .collection("bids")
      .find({ request_id }, { projection: { _id: 0 } })
      .toArray();

    bids.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    return res.json(bids);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// DELETE /bids/:bid_id — Withdraw a bid (provider only)
// ================================================================
router.delete("/bids/:bid_id", authenticate, async (req, res) => {
  try {
    const db = getDB();
    const { bid_id } = req.params;
    const currentUser = req.user;

    const bid = await db.collection("bids").findOne({ id: bid_id });
    if (!bid) return res.status(404).json({ detail: "Bid not found" });
    if (bid.provider_email !== currentUser.email) {
      return res.status(403).json({ detail: "Not authorized" });
    }
    if (bid.status !== "pending") {
      return res.status(400).json({ detail: "Can only withdraw pending bids" });
    }

    await db.collection("bids").deleteOne({ id: bid_id });
    return res.json({ status: "success", message: "Bid withdrawn" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// PUT /bids/:bid_id/status — Accept or reject a bid (customer only)
// ================================================================
router.put("/bids/:bid_id/status", authenticate, async (req, res) => {
  try {
    const db = getDB();
    const { bid_id } = req.params;
    const data = req.body;
    const currentUser = req.user;

    const newStatus = data.status;
    if (!["accepted", "rejected"].includes(newStatus)) {
      return res
        .status(400)
        .json({ detail: "Status must be 'accepted' or 'rejected'" });
    }

    const bid = await db.collection("bids").findOne({ id: bid_id });
    if (!bid) return res.status(404).json({ detail: "Bid not found" });

    const request = await db
      .collection("requests")
      .findOne({ id: bid.request_id });
    if (!request)
      return res.status(404).json({ detail: "Associated request not found" });

    if (request.user_email !== currentUser.email) {
      return res.status(403).json({ detail: "Not authorized" });
    }

    await db
      .collection("bids")
      .updateOne({ id: bid_id }, { $set: { status: newStatus } });

    if (newStatus === "accepted") {
      // Mark the request as in_progress and store which bid was accepted
      await db.collection("requests").updateOne(
        { id: bid.request_id },
        {
          $set: {
            status: "in_progress",
            provider: bid.provider_email,
            accepted_bid_id: bid_id,
          },
        },
      );
      // Reject all other bids for this request
      await db
        .collection("bids")
        .updateMany(
          { request_id: bid.request_id, id: { $ne: bid_id } },
          { $set: { status: "rejected" } },
        );
    }

    return res.json({ status: "success" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// PUT /bids/:bid_id/start — Provider starts the service
// ================================================================
router.put("/bids/:bid_id/start", authenticate, async (req, res) => {
  try {
    const db = getDB();
    const { bid_id } = req.params;
    const data = req.body;
    const currentUser = req.user;

    const providerEmail = currentUser.email;
    const latitude = data.latitude;
    const longitude = data.longitude;
    const providerAddress = data.provider_address || "";

    if (!providerEmail) {
      return res.status(400).json({ detail: "provider_email is required" });
    }
    if (latitude == null || longitude == null) {
      return res
        .status(400)
        .json({ detail: "latitude and longitude are required" });
    }

    const bid = await db.collection("bids").findOne({ id: bid_id });
    if (!bid) return res.status(404).json({ detail: "Bid not found" });
    if (bid.provider_email !== providerEmail) {
      return res.status(403).json({ detail: "Not authorized" });
    }
    if (bid.status !== "accepted") {
      return res
        .status(400)
        .json({ detail: "Only accepted bids can be started" });
    }

    const startedAt = getCurrentTimestamp();

    await db.collection("bids").updateOne(
      { id: bid_id },
      {
        $set: {
          service_started: true,
          service_started_at: startedAt,
          provider_start_address: providerAddress,
          provider_start_location: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          status: "in_progress",
        },
      },
    );

    await db.collection("requests").updateOne(
      { id: bid.request_id },
      {
        $set: {
          status: "in_progress",
          service_started: true,
          service_started_at: startedAt,
          provider_email: providerEmail,
          provider_start_address: providerAddress,
          provider_start_location: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
        },
      },
    );

    return res.json({
      status: "success",
      message: "Service started",
      started_at: startedAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

module.exports = router;
