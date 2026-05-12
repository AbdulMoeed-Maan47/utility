import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  History,
  ClipboardList,
  User,
  LogOut,
  Wrench,
} from "lucide-react";

const NAV = [
  { to: "/provider-dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/provider-messages", icon: MessageSquare, label: "Messages" },
  { to: "/bids-history", icon: History, label: "Bids History" },
  { to: "/my-bids", icon: ClipboardList, label: "Available Bids" },
  { to: "/provider-profile", icon: User, label: "Profile" },
];

function SidebarLink({ to, icon: Icon, label }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        active ? "bg-sky-100 text-sky-700" : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      <Icon size={18} />
      {label}
    </Link>
  );
}

export default function ProviderLayout({ children }) {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r flex flex-col shrink-0">
        <div className="p-6 border-b">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">UtilitY</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map((n) => (
            <SidebarLink key={n.to} {...n} />
          ))}
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 text-sm font-medium w-full"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
