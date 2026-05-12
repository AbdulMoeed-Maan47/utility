import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Wrench, AlertCircle } from "lucide-react";
import api from "../services/api";

const Field = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  children,
}) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {label}
    </label>
    {children ?? (
      <input
        type={type}
        required
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:outline-none text-sm transition-colors"
      />
    )}
  </div>
);

export default function SignUpPage() {
  const [role, setRole] = useState("customer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.post("/add-user", {
        email,
        password,
        role,
        fullName,
        phone,
        location,
      });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Signup failed");
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
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6">
          <h2 className="text-4xl font-extrabold text-gray-900 text-center">
            Join UtilitY Today!
          </h2>
          <p className="text-gray-600 max-w-sm text-center leading-relaxed">
            Create your account and start connecting with trusted professionals.
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            {[
              ["⚡", "Quick Registration", "Get started in minutes"],
              ["🔒", "Secure Platform", "Your data is protected"],
              [
                "🎯",
                "Find Experts Fast",
                "Connect with verified professionals",
              ],
            ].map(([icon, title, sub]) => (
              <div
                key={title}
                className="flex items-center gap-3 bg-white/70 backdrop-blur-sm rounded-xl p-3"
              >
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="text-sm font-bold text-gray-800">{title}</p>
                  <p className="text-xs text-gray-500">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 h-4" />
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-[520px] flex items-start justify-center bg-gray-50 p-8 overflow-y-auto">
        <div className="w-full max-w-[440px] my-auto">
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-extrabold">
              Utilit<span className="text-sky-500">Y</span>
            </span>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
              Create Account
            </h2>
            <p className="text-gray-500 text-sm mb-5">
              Join thousands of satisfied users
            </p>

            {/* Role toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-5 gap-1">
              {["customer", "provider"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    role === r
                      ? "bg-white text-sky-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {r === "customer"
                    ? "👤 I Need a Service"
                    : "🔧 I Provide Services"}
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

            <form onSubmit={handleSignup} className="space-y-4">
              <Field
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
              />
              <Field
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <Field
                label="Phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
              <Field
                label="City / Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Lahore, Pakistan"
              />

              <Field label="Password">
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    minLength={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:outline-none text-sm transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </Field>

              <Field label="Confirm Password">
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:outline-none text-sm transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </Field>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-bold text-sm transition-all shadow-md mt-2"
              >
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-sky-600 font-semibold hover:underline"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
