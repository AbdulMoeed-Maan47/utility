import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, MapPin, Briefcase, Loader2 } from "lucide-react";
import api from "../services/api";

const CATEGORIES = [
  "plumber",
  "electrician",
  "mechanic",
  "carpenter",
  "general repair",
];

export function CustomerAvailableOffers() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("plumber");

  useEffect(() => {
    setLoading(true);
    api
      .get(`/provider/top?serviceType=${category}`)
      .then((r) => setProviders(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Top Service Providers
            </h1>
            <p className="text-gray-500 mt-1">
              Find the best professionals near you
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                  category === c
                    ? "bg-sky-500 text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-sky-500" />
          </div>
        )}

        {!loading && providers.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="font-medium">No providers found for this category</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border shadow-sm p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center text-xl font-bold text-sky-600 shrink-0">
                  {p.fullName?.charAt(0) || "P"}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{p.fullName}</p>
                  {p.badge && (
                    <span className="text-xs font-semibold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                      {p.badge}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Star size={14} className="text-yellow-400" />{" "}
                  {p.rating?.toFixed(1) || "0"} rating
                </div>
                <div className="flex items-center gap-1.5">
                  <Briefcase size={14} /> {p.jobsCompleted || 0} jobs done
                </div>
                <div className="flex items-center gap-1.5 capitalize">
                  <MapPin size={14} /> {p.serviceType}
                </div>
              </div>
              <Link
                to="/customer-dashboard/post-request"
                className="mt-4 block w-full py-2 text-center rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold"
              >
                Hire Now
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CustomerAvailableOffers;
