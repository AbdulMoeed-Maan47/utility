import { useState, useEffect, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  Play,
  Loader2,
  AlertCircle,
} from "lucide-react";
import ProviderLayout from "../components/ProviderLayout";
import api from "../services/api";

const STATUS_STYLE = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-blue-100 text-blue-700",
  in_progress: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-600",
};

function StartServiceModal({ bid, onClose, onStarted }) {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStart = async () => {
    if (!latitude || !longitude) {
      setError("Location is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.put(`/bids/${bid.id}/start`, {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        provider_address: address,
      });
      onStarted();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to start service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6 border-b">
          <h3 className="font-bold text-gray-800">Start Service</h3>
          <p className="text-sm text-gray-500 mt-1">
            Enter your current location to begin
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude
              </label>
              <input
                type="number"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="31.5204"
                className="w-full px-3 py-2.5 border rounded-xl text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude
              </label>
              <input
                type="number"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="74.3587"
                className="w-full px-3 py-2.5 border rounded-xl text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Current Address (optional)
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, City"
              className="w-full px-3 py-2.5 border rounded-xl text-sm focus:border-sky-500 focus:outline-none"
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
              onClick={handleStart}
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Play size={14} />
              )}{" "}
              Start Service
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BidsHistoryPage() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startBid, setStartBid] = useState(null);

  const fetchBids = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const email = localStorage.getItem("email");
      if (!email) throw new Error("Not logged in");
      const res = await api.get(`/bids/provider/${email}`);
      setBids(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBids();
  }, [fetchBids]);

  const withdrawBid = async (bidId) => {
    try {
      await api.delete(`/bids/${bidId}`);
      fetchBids();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to withdraw bid");
    }
  };

  return (
    <ProviderLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bids History</h1>
            <p className="text-sm text-gray-500">All your submitted bids</p>
          </div>
          <button
            onClick={fetchBids}
            className="px-4 py-2 rounded-xl border text-sm hover:bg-gray-50"
          >
            Refresh
          </button>
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

        {!loading && !error && bids.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="font-medium">No bids yet</p>
            <p className="text-sm mt-1">Your submitted bids will appear here</p>
          </div>
        )}

        <div className="space-y-4">
          {bids.map((bid) => (
            <div
              key={bid.id}
              className="bg-white rounded-xl border shadow-sm p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {bid.request_snapshot?.title || bid.request_id}
                  </h3>
                  <p className="text-sm text-gray-500 capitalize mt-0.5">
                    {bid.request_snapshot?.category}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[bid.status] || "bg-gray-100 text-gray-600"}`}
                >
                  {bid.status?.replace("_", " ")}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1.5">
                  <DollarSign size={14} />
                  Rs. {bid.bid_amount}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} />
                  {bid.availability}
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} />
                  {bid.request_snapshot?.location_name || "—"}
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={14} />
                  {bid.completion_time}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {bid.status === "pending" && (
                  <button
                    onClick={() => withdrawBid(bid.id)}
                    className="px-3 py-1.5 rounded-xl border border-red-300 text-red-600 text-xs font-semibold hover:bg-red-50"
                  >
                    Withdraw Bid
                  </button>
                )}
                {bid.status === "accepted" && (
                  <button
                    onClick={() => setStartBid(bid)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold"
                  >
                    <Play size={12} /> Start Service
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {startBid && (
        <StartServiceModal
          bid={startBid}
          onClose={() => setStartBid(null)}
          onStarted={() => {
            setStartBid(null);
            fetchBids();
          }}
        />
      )}
    </ProviderLayout>
  );
}

export default BidsHistoryPage;
