// ── myrequest.jsx ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import { Loader2, AlertCircle, X } from "lucide-react";
import api from "../services/api";

const STATUS_STYLE = {
  pending: "bg-yellow-100 text-yellow-700",
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

function BidsModal({ request, onClose }) {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/bids/request/${request.id}`)
      .then((r) => setBids(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [request.id]);

  const acceptBid = async (bidId) => {
    try {
      await api.put(`/bids/${bidId}/status`, { status: "accepted" });
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to accept bid");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b shrink-0">
          <h3 className="font-bold text-gray-800">Bids on this Request</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-sky-500" />
            </div>
          )}
          {!loading && bids.length === 0 && (
            <p className="text-center text-gray-400 py-8">No bids yet</p>
          )}
          {bids.map((bid) => (
            <div key={bid.id} className="border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-800">
                    {bid.provider_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {bid.provider_service_type} · ⭐{" "}
                    {bid.provider_rating?.toFixed(1) || "N/A"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sky-600">Rs. {bid.bid_amount}</p>
                  <p className="text-xs text-gray-400">{bid.completion_time}</p>
                </div>
              </div>
              {bid.message && (
                <p className="text-sm text-gray-600 mt-2 italic">
                  "{bid.message}"
                </p>
              )}
              {bid.status === "pending" && request.status === "pending" && (
                <button
                  onClick={() => acceptBid(bid.id)}
                  className="mt-3 w-full px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold"
                >
                  Accept Bid
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ActiveRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewBids, setViewBids] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const email = localStorage.getItem("email");
      const res = await api.get(`/requests/${email}`);
      // Show only active (non-completed, non-cancelled)
      setRequests(
        res.data.filter((r) => !["completed", "cancelled"].includes(r.status)),
      );
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const cancelRequest = async (id) => {
    try {
      const email = localStorage.getItem("email");
      await api.put(`/requests/${id}/cancel`, { customer_email: email });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to cancel");
    }
  };

  const completeRequest = async (id) => {
    try {
      const email = localStorage.getItem("email");
      await api.put(`/requests/${id}/complete`, { customer_email: email });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to complete");
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Active Requests</h2>
        <button
          onClick={fetchRequests}
          className="px-4 py-2 rounded-xl border text-sm hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-sky-500" />
        </div>
      )}
      {error && (
        <div className="flex gap-2 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      {!loading && !error && requests.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="font-medium">No active requests</p>
          <p className="text-sm mt-1">Post a new request to get started</p>
        </div>
      )}

      <div className="space-y-4">
        {requests.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border shadow-sm p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full capitalize">
                  {r.category}
                </span>
                <p className="font-semibold text-gray-900 mt-1.5">
                  {r.description}
                </p>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${STATUS_STYLE[r.status] || "bg-gray-100 text-gray-600"}`}
              >
                {r.status?.replace("_", " ")}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Budget: Rs. {r.budget} · {r.date} at {r.time}
            </p>
            <div className="flex gap-2 flex-wrap">
              {["pending", "open"].includes(r.status) && (
                <button
                  onClick={() => setViewBids(r)}
                  className="px-3 py-1.5 rounded-xl border border-sky-300 text-sky-600 text-xs font-semibold hover:bg-sky-50"
                >
                  View Bids
                </button>
              )}
              {r.status === "in_progress" && (
                <button
                  onClick={() => completeRequest(r.id)}
                  className="px-3 py-1.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-semibold"
                >
                  Mark Complete
                </button>
              )}
              {r.status !== "completed" && (
                <button
                  onClick={() => cancelRequest(r.id)}
                  className="px-3 py-1.5 rounded-xl border border-red-300 text-red-600 text-xs font-semibold hover:bg-red-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {viewBids && (
        <BidsModal
          request={viewBids}
          onClose={() => {
            setViewBids(null);
            fetchRequests();
          }}
        />
      )}
    </div>
  );
}

export default ActiveRequestsPage;
