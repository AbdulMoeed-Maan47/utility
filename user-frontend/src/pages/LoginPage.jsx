import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Wrench, AlertCircle } from "lucide-react";
import api from "../services/api";

export default function LoginPage() {
  const [role, setRole] = useState("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/login", { email, password, role });
      const d = res.data;
      localStorage.setItem("access_token", d.access_token);
      localStorage.setItem("refresh_token", d.refresh_token);
      localStorage.setItem("role", d.role);
      localStorage.setItem("email", email);
      localStorage.setItem("user", JSON.stringify({ email, role: d.role }));
      navigate(
        d.role === "customer" ? "/customer-dashboard" : "/provider-dashboard",
      );
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-white">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-gradient-to-br from-sky-50 to-sky-100 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #0ea5e9 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 bg-sky-500 rounded-xl flex items-center justify-center shadow-md">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold text-gray-900">
            Utilit<span className="text-sky-500">Y</span>
          </span>
        </div>
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Welcome back!
            </h2>
            <p className="text-gray-600 max-w-sm leading-relaxed">
              Connect with trusted professionals or manage your service jobs —
              all in one place.
            </p>
          </div>
        </div>
        <div className="relative z-10 flex gap-4 flex-wrap">
          {[
            ["10K+", "Happy Customers"],
            ["5K+", "Verified Providers"],
            ["4.8★", "Avg Rating"],
          ].map(([v, l]) => (
            <div key={l} className="bg-white rounded-xl px-4 py-2 shadow-sm">
              <p className="text-sm font-extrabold text-sky-600">{v}</p>
              <p className="text-xs text-gray-500">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-[480px] flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-extrabold">
              Utilit<span className="text-sky-500">Y</span>
            </span>
          </div>

          <div className="border border-gray-200 rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
              Sign in
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Welcome back — choose your role
            </p>

            {/* Role toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6 gap-1">
              {["customer", "provider"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    role === r
                      ? "bg-white text-sky-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {r === "customer" ? "👤 Customer" : "🔧 Provider"}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2">
                <AlertCircle
                  size={16}
                  className="text-red-500 shrink-0 mt-0.5"
                />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:outline-none text-sm transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:outline-none text-sm transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-bold text-sm transition-all shadow-md mt-2"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-sky-600 font-semibold hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
