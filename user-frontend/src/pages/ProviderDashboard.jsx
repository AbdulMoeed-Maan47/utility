import { useEffect, useState } from "react";
import { Clock, CheckCircle, Star, DollarSign } from "lucide-react";
import ProviderLayout from "../components/ProviderLayout";
import api from "../services/api";

export default function ProviderDashboard() {
  const [name, setName] = useState("");
  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    rating: 0,
    earned: 0,
  });

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (!email) return;

    // Get name from stored user object
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      setName(stored.fullName || stored.name || email.split("@")[0]);
    } catch {
      setName(email.split("@")[0]);
    }

    api
      .get(`/provider/profile/${email}`)
      .then((r) => {
        const d = r.data;
        if (d.fullName) setName(d.fullName);
      })
      .catch(() => {});

    api
      .get(`/bids/provider/${email}`)
      .then((r) => {
        const bids = r.data;
        const completed = bids.filter((b) => b.status === "completed");
        const active = bids.filter((b) =>
          ["accepted", "in_progress"].includes(b.status),
        ).length;
        const earned = completed.reduce((s, b) => s + (b.bid_amount || 0), 0);
        const rated = completed.filter((b) => b.rating > 0);
        const rating = rated.length
          ? +(rated.reduce((s, b) => s + b.rating, 0) / rated.length).toFixed(1)
          : 0;
        setStats({ active, completed: completed.length, rating, earned });
      })
      .catch(() => {});
  }, []);

  const cards = [
    {
      icon: Clock,
      label: "Active Jobs",
      value: stats.active,
      color: "bg-purple-100 text-purple-600",
    },
    {
      icon: CheckCircle,
      label: "Completed",
      value: stats.completed,
      color: "bg-green-100 text-green-600",
    },
    {
      icon: Star,
      label: "Rating",
      value: stats.rating || "N/A",
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      icon: DollarSign,
      label: "Earned",
      value: `Rs. ${stats.earned}`,
      color: "bg-blue-100 text-blue-600",
    },
  ];

  return (
    <ProviderLayout>
      <div className="p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Welcome back, {name || "Provider"}!
            </h1>
            <p className="text-gray-500 mt-1">
              Manage your jobs and grow your business
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-xl shadow-sm border px-4 py-3">
            <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center font-bold text-white">
              {name ? name.charAt(0).toUpperCase() : "P"}
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Earned</p>
              <p className="font-bold text-gray-900">Rs. {stats.earned}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="flex items-center gap-4 bg-white rounded-xl shadow-sm border p-4"
            >
              <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={22} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="font-bold text-lg text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProviderLayout>
  );
}
