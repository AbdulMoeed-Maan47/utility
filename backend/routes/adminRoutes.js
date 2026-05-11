// routes/adminRoutes.js
// Covers:
//   GET /admin/dashboard/stats
//   GET /admin/dashboard/recent-providers
//   GET /admin/dashboard/pending-actions
//   GET /admin/dashboard/activity
//   GET /admin/providers/pending
//   GET /admin/providers
//   GET /admin/providers/:providerId
//   PUT /admin/providers/:providerId/approve
//   PUT /admin/providers/:providerId/reject
//   GET /admin/reports
//   GET /admin/reports/stats
//   GET /admin/reports/:reportId
//   PUT /admin/reports/:reportId/resolve
//   PUT /admin/reports/:reportId/escalate
//   GET /admin/users
//   GET /admin/users/stats

const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

const { getDB } = require("../db");
const { getCurrentTimestamp } = require("../utils");

// ================================================================
// Internal helper: log_admin_activity
// ================================================================
async function logAdminActivity(action, details, adminEmail) {
  try {
    const db = getDB();
    const activity = {
      id: uuidv4(),
      action,
      details,
      admin_email: adminEmail,
      timestamp: getCurrentTimestamp(),
    };

    // Auto-create collection if needed (matches original create_collection logic)
    const collections = await db
      .listCollections({ name: "admin_activity" })
      .toArray();
    if (collections.length === 0) {
      await db.createCollection("admin_activity");
    }

    await db.collection("admin_activity").insertOne(activity);
  } catch (err) {
    console.error("Failed to log admin activity:", err);
  }
}

// ================================================================
// Helper: ensure a collection exists (matches original create_collection guard)
// ================================================================
async function ensureCollection(db, name) {
  const collections = await db.listCollections({ name }).toArray();
  if (collections.length === 0) {
    await db.createCollection(name);
  }
}

// ================================================================
// GET /admin/dashboard/stats
// ================================================================
router.get("/admin/dashboard/stats", async (req, res) => {
  try {
    const db = getDB();

    const totalUsers = await db.collection("user").countDocuments({});
    const totalProviders = await db.collection("provider").countDocuments({});
    const pendingProviders = await db
      .collection("provider")
      .countDocuments({ isVerified: false });
    const totalRequests = await db.collection("requests").countDocuments({});
    const activeServices = await db
      .collection("requests")
      .countDocuments({ status: "in_progress" });
    const completedServices = await db
      .collection("requests")
      .countDocuments({ status: "completed" });

    const reportCollections = await db
      .listCollections({ name: "reports" })
      .toArray();
    const totalReports =
      reportCollections.length > 0
        ? await db.collection("reports").countDocuments({})
        : 0;

    return res.json({
      totalUsers,
      totalProviders,
      pendingProviders,
      totalRequests,
      activeServices,
      completedServices,
      totalReports,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// GET /admin/dashboard/recent-providers
// ================================================================
router.get("/admin/dashboard/recent-providers", async (req, res) => {
  try {
    const db = getDB();

    const providers = await db
      .collection("provider")
      .find(
        {},
        {
          projection: {
            _id: 0,
            id: 1,
            email: 1,
            fullName: 1,
            phone: 1,
            serviceType: 1,
            serviceArea: 1,
            experience: 1,
            rating: 1,
            isVerified: 1,
            createdAt: 1,
            memberSince: 1,
          },
        },
      )
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    return res.json(providers);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// GET /admin/dashboard/pending-actions
// ================================================================
router.get("/admin/dashboard/pending-actions", async (req, res) => {
  try {
    const db = getDB();

    // Pending provider verifications
    const pendingProviders = await db
      .collection("provider")
      .find(
        { isVerified: false },
        {
          projection: {
            _id: 0,
            id: 1,
            email: 1,
            fullName: 1,
            serviceType: 1,
            createdAt: 1,
          },
        },
      )
      .limit(10)
      .toArray();

    // Unresolved reports
    const reportCollections = await db
      .listCollections({ name: "reports" })
      .toArray();
    let unresolvedReports = [];
    if (reportCollections.length > 0) {
      unresolvedReports = await db
        .collection("reports")
        .find(
          { status: { $ne: "resolved" } },
          {
            projection: {
              _id: 0,
              report_id: 1,
              reporter_email: 1,
              reported_user: 1,
              category: 1,
              status: 1,
              created_at: 1,
            },
          },
        )
        .limit(10)
        .toArray();
    }

    // Pending disputes
    const pendingDisputes = await db
      .collection("requests")
      .find(
        { dispute_status: { $exists: true, $ne: "resolved" } },
        {
          projection: {
            _id: 0,
            id: 1,
            user_email: 1,
            description: 1,
            dispute_status: 1,
            created_at: 1,
          },
        },
      )
      .limit(10)
      .toArray();

    return res.json({
      pendingProviders,
      unresolvedReports,
      pendingDisputes,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// GET /admin/dashboard/activity
// ================================================================
router.get("/admin/dashboard/activity", async (req, res) => {
  try {
    const db = getDB();

    const activityCollections = await db
      .listCollections({ name: "admin_activity" })
      .toArray();
    let activities = [];
    if (activityCollections.length > 0) {
      activities = await db
        .collection("admin_activity")
        .find({}, { projection: { _id: 0 } })
        .sort({ timestamp: -1 })
        .limit(20)
        .toArray();
    }

    return res.json(activities);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// GET /admin/providers/pending
// NOTE: Must be declared BEFORE /admin/providers/:providerId
// ================================================================
router.get("/admin/providers/pending", async (req, res) => {
  try {
    const db = getDB();

    const providers = await db
      .collection("provider")
      .find({ isVerified: false }, { projection: { _id: 0 } })
      .toArray();

    return res.json(providers);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// GET /admin/providers
// ================================================================
router.get("/admin/providers", async (req, res) => {
  try {
    const db = getDB();

    const providers = await db
      .collection("provider")
      .find({}, { projection: { _id: 0 } })
      .toArray();

    return res.json(providers);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// GET /admin/providers/:providerId
// ================================================================
router.get("/admin/providers/:providerId", async (req, res) => {
  try {
    const db = getDB();
    const { providerId } = req.params;

    const provider = await db
      .collection("provider")
      .findOne({ id: providerId }, { projection: { _id: 0 } });

    if (!provider)
      return res.status(404).json({ detail: "Provider not found" });
    return res.json(provider);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// PUT /admin/providers/:providerId/approve
// ================================================================
router.put("/admin/providers/:providerId/approve", async (req, res) => {
  try {
    const db = getDB();
    const { providerId } = req.params;
    const data = req.body;

    const provider = await db
      .collection("provider")
      .findOne({ id: providerId });
    if (!provider)
      return res.status(404).json({ detail: "Provider not found" });

    await db.collection("provider").updateOne(
      { id: providerId },
      {
        $set: {
          isVerified: true,
          verification_status: "approved",
          approved_at: getCurrentTimestamp(),
        },
      },
    );

    await logAdminActivity(
      "provider_approved",
      `Approved provider: ${provider.email} (${provider.fullName})`,
      data?.admin_email || "admin",
    );

    return res.json({
      status: "success",
      message: "Provider approved successfully",
      providerId,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// PUT /admin/providers/:providerId/reject
// ================================================================
router.put("/admin/providers/:providerId/reject", async (req, res) => {
  try {
    const db = getDB();
    const { providerId } = req.params;
    const data = req.body;

    const provider = await db
      .collection("provider")
      .findOne({ id: providerId });
    if (!provider)
      return res.status(404).json({ detail: "Provider not found" });

    const rejectionReason = data?.rejection_reason || "";

    await db.collection("provider").updateOne(
      { id: providerId },
      {
        $set: {
          isVerified: false,
          verification_status: "rejected",
          rejected_at: getCurrentTimestamp(),
          rejection_reason: rejectionReason,
        },
      },
    );

    await logAdminActivity(
      "provider_rejected",
      `Rejected provider: ${provider.email} - Reason: ${rejectionReason}`,
      data?.admin_email || "admin",
    );

    return res.json({
      status: "success",
      message: "Provider rejected",
      providerId,
      rejection_reason: rejectionReason,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// GET /admin/reports
// NOTE: Must be declared BEFORE /admin/reports/:reportId
// ================================================================
router.get("/admin/reports", async (req, res) => {
  try {
    const db = getDB();
    await ensureCollection(db, "reports");

    const reports = await db
      .collection("reports")
      .find({}, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .toArray();

    return res.json(reports);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// GET /admin/reports/stats
// NOTE: Must be declared BEFORE /admin/reports/:reportId
// ================================================================
router.get("/admin/reports/stats", async (req, res) => {
  try {
    const db = getDB();
    await ensureCollection(db, "reports");

    const totalReports = await db.collection("reports").countDocuments({});
    const pendingReports = await db
      .collection("reports")
      .countDocuments({ status: "pending" });
    const resolvedReports = await db
      .collection("reports")
      .countDocuments({ status: "resolved" });
    const escalatedReports = await db
      .collection("reports")
      .countDocuments({ status: "escalated" });

    return res.json({
      totalReports,
      pendingReports,
      resolvedReports,
      escalatedReports,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// GET /admin/reports/:reportId
// ================================================================
router.get("/admin/reports/:reportId", async (req, res) => {
  try {
    const db = getDB();
    await ensureCollection(db, "reports");
    const { reportId } = req.params;

    const report = await db
      .collection("reports")
      .findOne({ report_id: reportId }, { projection: { _id: 0 } });

    if (!report) return res.status(404).json({ detail: "Report not found" });
    return res.json(report);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// PUT /admin/reports/:reportId/resolve
// ================================================================
router.put("/admin/reports/:reportId/resolve", async (req, res) => {
  try {
    const db = getDB();
    await ensureCollection(db, "reports");
    const { reportId } = req.params;
    const data = req.body;

    const report = await db
      .collection("reports")
      .findOne({ report_id: reportId });
    if (!report) return res.status(404).json({ detail: "Report not found" });

    const resolution = data?.resolution || "";

    await db.collection("reports").updateOne(
      { report_id: reportId },
      {
        $set: {
          status: "resolved",
          resolution,
          resolved_at: getCurrentTimestamp(),
          resolved_by: data?.admin_email || "admin",
        },
      },
    );

    await logAdminActivity(
      "report_resolved",
      `Resolved report ${reportId}: ${resolution}`,
      data?.admin_email || "admin",
    );

    return res.json({
      status: "success",
      message: "Report resolved",
      reportId,
      resolution,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// PUT /admin/reports/:reportId/escalate
// ================================================================
router.put("/admin/reports/:reportId/escalate", async (req, res) => {
  try {
    const db = getDB();
    await ensureCollection(db, "reports");
    const { reportId } = req.params;
    const data = req.body;

    const report = await db
      .collection("reports")
      .findOne({ report_id: reportId });
    if (!report) return res.status(404).json({ detail: "Report not found" });

    const escalationDetails = data?.escalation_details || "";

    await db.collection("reports").updateOne(
      { report_id: reportId },
      {
        $set: {
          status: "escalated",
          escalation_details: escalationDetails,
          escalated_at: getCurrentTimestamp(),
          escalated_by: data?.admin_email || "admin",
        },
      },
    );

    await logAdminActivity(
      "report_escalated",
      `Escalated report ${reportId}: ${escalationDetails}`,
      data?.admin_email || "admin",
    );

    return res.json({
      status: "success",
      message: "Report escalated",
      reportId,
      escalation_details: escalationDetails,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// GET /admin/users
// ================================================================
router.get("/admin/users", async (req, res) => {
  try {
    const db = getDB();

    const users = await db
      .collection("user")
      .find({}, { projection: { _id: 0, password: 0 } })
      .toArray();

    return res.json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

// ================================================================
// GET /admin/users/stats
// NOTE: Must be declared BEFORE any /admin/users/:userId route if added later
// ================================================================
router.get("/admin/users/stats", async (req, res) => {
  try {
    const db = getDB();

    const totalUsers = await db.collection("user").countDocuments({});
    const totalCustomers = await db
      .collection("user")
      .countDocuments({ role: "customer" });
    const totalProviders = await db
      .collection("user")
      .countDocuments({ role: "provider" });

    // Active/inactive customers
    const customerProfileExists =
      (await db.listCollections({ name: "customer_profile" }).toArray())
        .length > 0;

    const activeCustomers = customerProfileExists
      ? await db
          .collection("customer_profile")
          .countDocuments({ accountStatus: "Active" })
      : 0;

    const deactivatedCustomers = customerProfileExists
      ? await db
          .collection("customer_profile")
          .countDocuments({ accountStatus: "Inactive" })
      : 0;

    // Active/inactive providers
    const activeProviders = await db
      .collection("provider")
      .countDocuments({ isActive: true });
    const deactivatedProviders = await db
      .collection("provider")
      .countDocuments({ isActive: false });

    return res.json({
      totalUsers,
      totalCustomers,
      totalProviders,
      activeUsers: activeCustomers + activeProviders,
      deactivatedUsers: deactivatedCustomers + deactivatedProviders,
      activeCustomers,
      activeProviders,
      deactivatedCustomers,
      deactivatedProviders,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

module.exports = router;
