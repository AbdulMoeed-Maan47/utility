// ── customerdashboard.jsx ─────────────────────────────────────
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  Clock,
  CheckCircle,
  DollarSign,
  Plus,
  ArrowRight,
} from "lucide-react";
import api from "../services/api";

export default function CustomerDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    spent: 0,
  });
  const [recent, setRecent] = useState([]);
  const name = (() => {
    try {
      return (
        JSON.parse(localStorage.getItem("user") || "{}").fullName ||
        localStorage.getItem("email")?.split("@")[0] ||
        "User"
      );
    } catch {
      return "User";
    }
  })();

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (!email) return;
    api
      .get(`/requests/${email}`)
      .then((r) => {
        const data = r.data;
        const completed = data.filter((x) => x.status === "completed");
        setStats({
          total: data.length,
          active: data.filter((x) =>
            ["pending", "open", "in_progress"].includes(x.status),
          ).length,
          completed: completed.length,
          spent: completed.reduce((s, x) => s + (x.budget || 0), 0),
        });
        setRecent(data.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  const STATUS = {
    pending: "bg-yellow-100 text-yellow-700",
    open: "bg-blue-100 text-blue-700",
    in_progress: "bg-purple-100 text-purple-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-500",
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Welcome, {name}!
          </h1>
          <p className="text-gray-500 mt-1">Manage your service requests</p>
        </div>
        <Link
          to="/customer-dashboard/post-request"
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm shadow-md"
        >
          <Plus size={18} /> New Request
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          [ClipboardList, "Total", stats.total, "bg-blue-100 text-blue-600"],
          [Clock, "Active", stats.active, "bg-yellow-100 text-yellow-600"],
          [
            CheckCircle,
            "Completed",
            stats.completed,
            "bg-green-100 text-green-600",
          ],
          [
            DollarSign,
            "Spent",
            `Rs. ${stats.spent}`,
            "bg-purple-100 text-purple-600",
          ],
        ].map(([Icon, label, value, color]) => (
          <div
            key={label}
            className="flex items-center gap-3 bg-white rounded-xl border shadow-sm p-4"
          >
            <div className={`p-2.5 rounded-xl ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400">{label}</p>
              <p className="font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {recent.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">Recent Requests</h2>
            <Link
              to="/customer-dashboard/my-requests"
              className="text-sm text-sky-600 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {recent.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-800 text-sm">
                    {r.description}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">
                    {r.category} · Rs. {r.budget}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS[r.status] || "bg-gray-100 text-gray-600"}`}
                >
                  {r.status?.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
