// routes/messageRoutes.js
// Covers:
//   POST /messages
//   GET  /messages/:user1/:user2
//   GET  /conversations/:email

const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

const { getDB } = require("../db");

// ================================================================
// POST /messages — Send a message (no auth, matches original)
// ================================================================
router.post("/messages", async (req, res) => {
  try {
    const db = getDB();
    const data = req.body;

    const required = ["sender", "receiver", "text"];
    for (const field of required) {
      if (!(field in data) || data[field] === "") {
        return res.status(400).json({ detail: `${field} is required` });
      }
    }

    const message = {
      id: uuidv4(),
      sender: data.sender,
      receiver: data.receiver,
      text: data.text,
      // Matches: datetime.now(timezone.utc) — stored as a JS Date (UTC)
      timestamp: new Date(),
    };

    await db.collection("messages").insertOne(message);
    return res.json({ status: "success" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// GET /messages/:user1/:user2 — Get conversation between two users
// ================================================================
router.get("/messages/:user1/:user2", async (req, res) => {
  try {
    const db = getDB();
    const { user1, user2 } = req.params;

    const messages = await db
      .collection("messages")
      .find(
        {
          $or: [
            { sender: user1, receiver: user2 },
            { sender: user2, receiver: user1 },
          ],
        },
        { projection: { _id: 0 } },
      )
      .toArray();

    // Sort ascending by timestamp (matches original messages.sort(key=lambda x: x["timestamp"]))
    messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return res.json(messages);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// GET /conversations/:email — Get all conversations for a user
// Returns one entry per unique other party, with the latest message
// ================================================================
router.get("/conversations/:email", async (req, res) => {
  try {
    const db = getDB();
    const { email } = req.params;

    const messages = await db
      .collection("messages")
      .find({
        $or: [{ sender: email }, { receiver: email }],
      })
      .toArray();

    // Build conversation map: other_email → { user, lastMessage, timestamp }
    const convoMap = {};

    for (const msg of messages) {
      const other = msg.sender === email ? msg.receiver : msg.sender;
      const msgTime = new Date(msg.timestamp);

      if (!convoMap[other] || msgTime > new Date(convoMap[other].timestamp)) {
        convoMap[other] = {
          user: other,
          lastMessage: msg.text,
          timestamp: msg.timestamp,
        };
      }
    }

    // Sort descending by timestamp (matches original sorted(..., reverse=True))
    const result = Object.values(convoMap).sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    );

    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

module.exports = router;
