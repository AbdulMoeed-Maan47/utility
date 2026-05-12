import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, MapPin, AlertCircle } from "lucide-react";
import api from "../services/api";

const CATEGORIES = [
  "plumber",
  "electrician",
  "mechanic",
  "carpenter",
  "general repair",
];

export function PostRequestPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    category: "",
    description: "",
    budget: "",
    date: "",
    time: "",
    note: "",
    location_name: "",
    latitude: "",
    longitude: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locating, setLocating] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("latitude", pos.coords.latitude.toString());
        set("longitude", pos.coords.longitude.toString());
        set(
          "location_name",
          `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
        );
        setLocating(false);
      },
      () => {
        setError("Could not get location");
        setLocating(false);
      },
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.latitude || !form.longitude) {
      setError("Please provide your location");
      return;
    }
    setLoading(true);
    try {
      await api.post("/requests", {
        ...form,
        budget: parseInt(form.budget),
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      });
      navigate("/customer-dashboard/my-requests");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to post request");
    } finally {
      setLoading(false);
    }
  };

  const Field = ({
    label,
    name,
    type = "text",
    placeholder,
    required = true,
  }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={form[name]}
        onChange={(e) => set(name, e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:outline-none text-sm transition-colors"
      />
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Post a Request</h1>
        <p className="text-gray-500 mt-1">Describe the service you need</p>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-6 lg:p-8">
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Category
            </label>
            <select
              required
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:outline-none text-sm bg-white"
            >
              <option value="">Select a category…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe the work needed in detail…"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:outline-none text-sm resize-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Budget (Rs.)"
              name="budget"
              type="number"
              placeholder="e.g. 2000"
            />
            <Field label="Date" name="date" type="date" />
          </div>
          <Field label="Time" name="time" type="time" />

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Location
            </label>
            <div className="flex gap-2">
              <input
                value={form.location_name}
                onChange={(e) => set("location_name", e.target.value)}
                placeholder="Your location or address"
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:outline-none text-sm"
              />
              <button
                type="button"
                onClick={getLocation}
                disabled={locating}
                className="px-4 py-3 rounded-xl border-2 border-sky-200 text-sky-600 hover:bg-sky-50 disabled:opacity-60 flex items-center gap-2 text-sm font-semibold"
              >
                {locating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <MapPin size={16} />
                )}
                {locating ? "" : "Locate"}
              </button>
            </div>
            {form.latitude && (
              <p className="text-xs text-green-600 mt-1.5">
                ✓ Location captured: {form.latitude}, {form.longitude}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Additional Notes (optional)
            </label>
            <textarea
              rows={2}
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Any special instructions…"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:outline-none text-sm resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Posting…" : "Post Request"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PostRequestPage;
