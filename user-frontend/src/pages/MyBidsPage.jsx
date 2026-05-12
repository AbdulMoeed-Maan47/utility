import { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  DollarSign,
  Clock,
  Loader2,
  AlertCircle,
  Send,
} from "lucide-react";
import ProviderLayout from "../components/ProviderLayout";
import api from "../services/api";

const CATEGORIES = [
  "plumber",
  "electrician",
  "mechanic",
  "carpenter",
  "general repair",
];

function BidModal({ request, onClose, onBidPlaced }) {
  const [form, setForm] = useState({
    bid_amount: "",
    availability: "",
    completion_time: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const email = localStorage.getItem("email");

  const handleSubmit = async () => {
    if (!form.bid_amount || !form.availability || !form.completion_time) {
      setError("All fields except message are required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post("/bids", {
        request_id: request.id,
        provider_email: email,
        bid_amount: form.bid_amount,
        availability: form.availability,
        completion_time: form.completion_time,
        message: form.message,
      });
      onBidPlaced();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to place bid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6 border-b">
          <h3 className="font-bold text-gray-800">Place a Bid</h3>
          <p className="text-sm text-gray-500 mt-1">{request.description}</p>
        </div>
        <div className="p-6 space-y-4">
          {[
            ["Bid Amount (Rs.)", "bid_amount", "number", "e.g. 2000"],
            [
              "Your Availability",
              "availability",
              "text",
              "e.g. Weekdays 9am-5pm",
            ],
            ["Estimated Completion", "completion_time", "text", "e.g. 2 hours"],
          ].map(([label, key, type, placeholder]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 border rounded-xl text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message (optional)
            </label>
            <textarea
              rows={3}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Why are you the best for this job?"
              className="w-full px-3 py-2.5 border rounded-xl text-sm focus:border-sky-500 focus:outline-none resize-none"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}{" "}
              Submit Bid
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MyBidsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterCategory, setFilter] = useState("");
  const [selectedRequest, setSelected] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const email = localStorage.getItem("email");
      if (!email) throw new Error("Not logged in");
      const params = filterCategory ? `?category=${filterCategory}` : "";
      const res = await api.get(`/available-requests/${email}${params}`);
      setRequests(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  }, [filterCategory]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return (
    <ProviderLayout>
      <div className="p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Available Requests
            </h1>
            <p className="text-sm text-gray-500">
              Browse and bid on open service requests
            </p>
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2.5 border rounded-xl text-sm focus:border-sky-500 focus:outline-none bg-white"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-sky-500" />
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            <AlertCircle size={18} /> {error}
          </div>
        )}
        {!loading && !error && requests.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="font-medium">No available requests</p>
            <p className="text-sm mt-1">
              Check back later or try a different category
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {requests.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-xl border shadow-sm p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                    {r.category}
                  </span>
                  <p className="font-semibold text-gray-900 mt-2 line-clamp-2">
                    {r.description}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <DollarSign size={14} /> Budget: Rs. {r.budget}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} /> {r.date} at {r.time}
                </div>
                {r.location_name && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} /> {r.location_name}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-auto pt-3 border-t">
                <span className="text-xs text-gray-400">
                  {r.totalBids} bid{r.totalBids !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => setSelected(r)}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold"
                >
                  Place Bid
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedRequest && (
        <BidModal
          request={selectedRequest}
          onClose={() => setSelected(null)}
          onBidPlaced={() => {
            setSelected(null);
            fetchRequests();
          }}
        />
      )}
    </ProviderLayout>
  );
}

export default MyBidsPage;
