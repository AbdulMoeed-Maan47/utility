import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Edit,
  Star,
  DollarSign,
  CheckCircle,
  Save,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  X,
  ArrowLeft,
} from "lucide-react";
import ProviderLayout from "../components/ProviderLayout";
import api from "../services/api";

/* ─── helpers ─────────────────────────────────────────────── */
function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
      <h3 className="font-bold text-gray-800 mb-4 pb-2 border-b">{title}</h3>
      {children}
    </div>
  );
}
function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-gray-800 font-medium">{value || "—"}</p>
    </div>
  );
}
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
function InputField({ label, name, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2.5 border rounded-xl text-sm focus:border-sky-500 focus:outline-none"
      />
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

/* ─── EditProfileModal ─────────────────────────────────────── */
function EditProfileModal({ profile, onClose, onSaved }) {
  const [form, setForm] = useState({
    fullName: profile.fullName || "",
    phone: profile.phone || "",
    serviceArea: profile.serviceArea || "",
    address: profile.address || "",
    serviceType: profile.serviceType || "",
    experience: profile.experience || 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.put(`/provider/profile/update/${profile.email}`, {
        ...form,
        experience: Number(form.experience),
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Edit Profile" onClose={onClose}>
      <div className="space-y-4">
        <InputField
          label="Full Name"
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
        />
        <InputField
          label="Phone"
          name="phone"
          value={form.phone}
          onChange={handleChange}
        />
        <InputField
          label="Service Area"
          name="serviceArea"
          value={form.serviceArea}
          onChange={handleChange}
        />
        <InputField
          label="Address"
          name="address"
          value={form.address}
          onChange={handleChange}
        />
        <InputField
          label="Service Type"
          name="serviceType"
          value={form.serviceType}
          onChange={handleChange}
        />
        <InputField
          label="Experience (years)"
          name="experience"
          value={form.experience}
          onChange={handleChange}
          type="number"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-2"
          >
            {saving ? (
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

/* ─── ChangePasswordModal ──────────────────────────────────── */
function ChangePasswordModal({ profile, onClose }) {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    setError(null);
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/provider/change-password/${profile.email}`, {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Change Password" onClose={onClose}>
      <div className="space-y-4">
        {[
          ["Old Password", "oldPassword", showOld, () => setShowOld(!showOld)],
          ["New Password", "newPassword", showNew, () => setShowNew(!showNew)],
          [
            "Confirm New Password",
            "confirmPassword",
            showNew,
            () => setShowNew(!showNew),
          ],
        ].map(([label, name, show, toggle]) => (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                name={name}
                value={form[name]}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border rounded-xl text-sm focus:border-sky-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={toggle}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
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
            className="px-4 py-2 rounded-xl border text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}{" "}
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── SettingsSection ──────────────────────────────────────── */
function SettingsSection({ profile }) {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    showProfile: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleToggle = async (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    setSaving(true);
    setSaved(false);
    try {
      await api.put(`/provider/settings/${profile.email}`, {
        settings: updated,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title="Account Settings">
      <div className="space-y-3">
        <Toggle
          label="Email Notifications"
          checked={settings.emailNotifications}
          onChange={() => handleToggle("emailNotifications")}
        />
        <Toggle
          label="SMS Notifications"
          checked={settings.smsNotifications}
          onChange={() => handleToggle("smsNotifications")}
        />
        <Toggle
          label="Show Profile to Clients"
          checked={settings.showProfile}
          onChange={() => handleToggle("showProfile")}
        />
      </div>
      {saving && <p className="text-xs text-gray-400 mt-2">Saving…</p>}
      {saved && <p className="text-xs text-green-600 mt-2">✓ Settings saved</p>}
    </Section>
  );
}

/* ─── DangerZone ───────────────────────────────────────────── */
function DangerZone() {
  const navigate = useNavigate();
  const [showDeact, setShowDeact] = useState(false);
  const [showDel, setShowDel] = useState(false);
  const [loading, setLoading] = useState(false);
  const email = localStorage.getItem("email");

  const deactivate = async () => {
    setLoading(true);
    try {
      await api.put(`/provider/deactivate/${email}`);
      localStorage.clear();
      navigate("/login");
    } catch {
      setLoading(false);
    }
  };
  const deleteAccount = async () => {
    setLoading(true);
    try {
      await api.delete(`/provider/delete/${email}`);
      localStorage.clear();
      navigate("/login");
    } catch {
      setLoading(false);
    }
  };

  return (
    <Section title="Danger Zone">
      <div className="space-y-3">
        <div className="p-4 border border-orange-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-orange-50">
          <div>
            <p className="font-semibold text-gray-800">Deactivate Account</p>
            <p className="text-sm text-gray-500">
              Temporarily hide your profile
            </p>
          </div>
          <button
            onClick={() => setShowDeact(true)}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold"
          >
            Deactivate
          </button>
        </div>
        <div className="p-4 border border-red-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-red-50">
          <div>
            <p className="font-semibold text-gray-800">Delete Account</p>
            <p className="text-sm text-gray-500">
              Permanently delete all your data
            </p>
          </div>
          <button
            onClick={() => setShowDel(true)}
            className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold"
          >
            Delete
          </button>
        </div>
      </div>

      {showDeact && (
        <Modal title="Deactivate Account" onClose={() => setShowDeact(false)}>
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertTriangle size={40} className="text-orange-500" />
            <p className="text-gray-700">
              Your profile will be hidden from customers. You can reactivate
              anytime.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowDeact(false)}
                className="flex-1 px-4 py-2 rounded-xl border text-sm"
              >
                Cancel
              </button>
              <button
                onClick={deactivate}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold disabled:opacity-60"
              >
                {loading ? "…" : "Deactivate"}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {showDel && (
        <Modal title="Delete Account" onClose={() => setShowDel(false)}>
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertTriangle size={40} className="text-red-500" />
            <p className="text-gray-700">
              This is permanent. All your data will be erased and cannot be
              recovered.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowDel(false)}
                className="flex-1 px-4 py-2 rounded-xl border text-sm"
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-60"
              >
                {loading ? "…" : "Delete Forever"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Section>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function ProviderProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const email = localStorage.getItem("email");
      if (!email) throw new Error("Not logged in");
      const res = await api.get(`/provider/profile/${email}`);
      setProfile(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaved = () => {
    setShowEdit(false);
    fetchProfile();
  };

  return (
    <ProviderLayout>
      <div className="p-6 lg:p-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-sm text-gray-500">
              Manage your professional details
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-sky-500" />
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {profile && !loading && (
          <>
            {/* Profile card */}
            <Section title="Profile Information">
              <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
                <div className="w-20 h-20 bg-sky-100 rounded-2xl flex items-center justify-center text-3xl font-bold text-sky-600">
                  {profile.fullName?.charAt(0) || "P"}
                </div>
                <div className="flex-1 space-y-1">
                  <h2 className="text-xl font-bold text-gray-900">
                    {profile.fullName}
                  </h2>
                  <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                    <Mail size={14} />
                    {profile.email}
                  </div>
                  {profile.phone && (
                    <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                      <Phone size={14} />
                      {profile.phone}
                    </div>
                  )}
                  {profile.serviceArea && (
                    <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                      <MapPin size={14} />
                      {profile.serviceArea}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowEdit(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold"
                >
                  <Edit size={14} /> Edit
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t">
                <Field label="Service Type" value={profile.serviceType} />
                <Field
                  label="Experience"
                  value={
                    profile.experience ? `${profile.experience} yrs` : null
                  }
                />
                <Field label="Address" value={profile.address} />
              </div>
            </Section>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                [
                  Star,
                  "Rating",
                  profile.rating?.toFixed(1) || 0,
                  "bg-yellow-100 text-yellow-600",
                ],
                [
                  CheckCircle,
                  "Completed",
                  profile.jobsCompleted || 0,
                  "bg-green-100 text-green-600",
                ],
                [
                  DollarSign,
                  "Earned",
                  `Rs. ${profile.totalEarned || 0}`,
                  "bg-blue-100 text-blue-600",
                ],
              ].map(([Icon, label, value, color]) => (
                <div
                  key={label}
                  className="bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3"
                >
                  <div className={`p-2.5 rounded-xl ${color}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="font-bold text-gray-900">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Password */}
            <Section title="Security">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">Password</p>
                  <p className="text-sm text-gray-500">
                    Update your login password
                  </p>
                </div>
                <button
                  onClick={() => setShowPwdModal(true)}
                  className="px-4 py-2 rounded-xl border border-sky-300 text-sky-600 text-sm font-semibold hover:bg-sky-50"
                >
                  Change Password
                </button>
              </div>
            </Section>

            <SettingsSection profile={profile} />
            <DangerZone />
          </>
        )}

        {showEdit && (
          <EditProfileModal
            profile={profile}
            onClose={() => setShowEdit(false)}
            onSaved={handleSaved}
          />
        )}
        {showPwdModal && (
          <ChangePasswordModal
            profile={profile}
            onClose={() => setShowPwdModal(false)}
          />
        )}
      </div>
    </ProviderLayout>
  );
}
