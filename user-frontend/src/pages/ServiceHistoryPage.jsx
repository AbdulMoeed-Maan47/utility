import { useState, useEffect } from "react";
import { Loader2, Star } from "lucide-react";
import api from "../services/api";

function FeedbackModal({ request, onClose }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const email = localStorage.getItem("email");

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post("/feedback", {
        request_id: request.id,
        customer_email: email,
        rating,
        comment,
      });
      onClose(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
        <h3 className="font-bold text-gray-800 mb-4">Rate this Service</h3>
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)}>
              <Star
                size={28}
                className={
                  n <= rating
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                }
              />
            </button>
          ))}
        </div>
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience (optional)"
          className="w-full px-3 py-2.5 border rounded-xl text-sm focus:border-sky-500 focus:outline-none resize-none mb-4"
        />
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={() => onClose(false)}
            className="flex-1 px-4 py-2 rounded-xl border text-sm"
          >
            Skip
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />} Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ServiceHistoryPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackReq, setFeedbackReq] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const email = localStorage.getItem("email");
      const res = await api.get(`/requests/${email}`);
      setRequests(
        res.data.filter((r) => ["completed", "cancelled"].includes(r.status)),
      );
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Service History</h2>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-sky-500" />
        </div>
      )}
      {!loading && requests.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="font-medium">No completed requests yet</p>
        </div>
      )}

      <div className="space-y-4">
        {requests.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border shadow-sm p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full capitalize">
                  {r.category}
                </span>
                <p className="font-semibold text-gray-900 mt-1.5">
                  {r.description}
                </p>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
                  r.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {r.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Rs. {r.budget} · {r.date} ·{" "}
              {r.completed_at || r.cancelled_at || ""}
            </p>
            {r.status === "completed" && !r.feedback_given && (
              <button
                onClick={() => setFeedbackReq(r)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-yellow-300 text-yellow-700 text-xs font-semibold hover:bg-yellow-50"
              >
                <Star size={13} /> Rate this Service
              </button>
            )}
            {r.feedback_given && (
              <p className="text-xs text-green-600 font-medium">
                ✓ Feedback submitted
              </p>
            )}
          </div>
        ))}
      </div>

      {feedbackReq && (
        <FeedbackModal
          request={feedbackReq}
          onClose={(submitted) => {
            setFeedbackReq(null);
            if (submitted) fetchHistory();
          }}
        />
      )}
    </div>
  );
}
