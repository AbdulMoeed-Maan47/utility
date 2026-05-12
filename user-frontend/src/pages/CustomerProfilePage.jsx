import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Edit,
  Save,
  Loader2,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
} from "lucide-react";
import api from "../services/api";

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div className="flex justify-between items-center p-4 bg-sky-50 rounded-xl">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <button
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex w-11 h-6 rounded-full transition-colors ${checked ? "bg-sky-500" : "bg-gray-300"}`}
      >
        <span
          className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform mt-0.5 ${checked ? "translate-x-5" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );
}

export function CustomerProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const navigate = useNavigate();

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const email = localStorage.getItem("email");
      const res = await api.get(`/customer-profile/${email}`);
      setUser(res.data.user);
      setProfile(res.data.profile);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 size={32} className="animate-spin text-sky-500" />
      </div>
    );

  return (
    <div className="max-w-3xl">
      {/* Profile Card */}
      <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-sky-600">
              {user?.fullName?.charAt(0) || "C"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {user?.fullName}
              </h2>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                {profile?.accountStatus || "Active"}
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold"
          >
            <Edit size={14} /> Edit
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t text-sm">
          <div>
            <p className="text-xs text-gray-400 font-medium mb-0.5">Phone</p>
            <p className="font-medium">{user?.phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium mb-0.5">Location</p>
            <p className="font-medium">{user?.location || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium mb-0.5">
              Member Since
            </p>
            <p className="font-medium">{profile?.memberSince || "—"}</p>
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      {profile?.activitySummary && (
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
          <h3 className="font-bold text-gray-800 mb-4">Activity Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              ["Total Requests", profile.activitySummary.totalRequests],
              ["Completed", profile.activitySummary.completed],
              ["Cancelled", profile.activitySummary.cancelled],
              ["Total Spent", `Rs. ${profile.activitySummary.totalSpent || 0}`],
            ].map(([label, val]) => (
              <div
                key={label}
                className="text-center bg-gray-50 rounded-xl p-3"
              >
                <p className="text-xl font-bold text-sky-600">{val}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
        <h3 className="font-bold text-gray-800 mb-4">Notifications</h3>
        <div className="space-y-3">
          {[
            ["Email Notifications", "emailNotifications"],
            ["SMS Notifications", "smsNotifications"],
            ["Marketing Communications", "marketingCommunications"],
          ].map(([label, key]) => (
            <Toggle
              key={key}
              label={label}
              checked={
                profile?.preferences?.[key] ?? key !== "marketingCommunications"
              }
              onChange={async () => {
                const email = localStorage.getItem("email");
                const updated = {
                  ...(profile?.preferences || {}),
                  [key]: !(
                    profile?.preferences?.[key] ??
                    key !== "marketingCommunications"
                  ),
                };
                try {
                  await api.put(`/customer/settings/${email}`, updated);
                  fetchProfile();
                } catch {}
              }}
            />
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800">Password</h3>
            <p className="text-sm text-gray-500">Update your login password</p>
          </div>
          <button
            onClick={() => setShowPwd(true)}
            className="px-4 py-2 rounded-xl border border-sky-300 text-sky-600 text-sm font-semibold hover:bg-sky-50"
          >
            Change
          </button>
        </div>
      </div>

      {showEdit && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            fetchProfile();
          }}
        />
      )}
      {showPwd && <ChangePasswordModal onClose={() => setShowPwd(false)} />}
    </div>
  );
}

function EditProfileModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    location: user?.location || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const email = localStorage.getItem("email");

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.put(`/customer-profile/update/${email}`, form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Edit Profile" onClose={onClose}>
      <div className="space-y-4">
        {[
          ["Full Name", "fullName", "text"],
          ["Phone", "phone", "tel"],
          ["Location", "location", "text"],
        ].map(([label, key, type]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <input
              type={type}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full px-3 py-2.5 border rounded-xl text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>
        ))}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}{" "}
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const email = localStorage.getItem("email");

  const handleSave = async () => {
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.put(`/customer/change-password/${email}`, {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Change Password" onClose={onClose}>
      <div className="space-y-4">
        {[
          ["Current Password", "oldPassword", false, null],
          ["New Password", "newPassword", showNew, () => setShowNew(!showNew)],
          [
            "Confirm Password",
            "confirmPassword",
            showNew,
            () => setShowNew(!showNew),
          ],
        ].map(([label, key, show, toggle]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-xl text-sm focus:border-sky-500 focus:outline-none"
              />
              {toggle && (
                <button
                  type="button"
                  onClick={toggle}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              )}
            </div>
          </div>
        ))}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && (
          <p className="text-green-600 text-sm font-medium">
            ✓ Password updated!
          </p>
        )}
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}{" "}
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default CustomerProfilePage;
