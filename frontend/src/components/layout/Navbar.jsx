import { Link, useNavigate } from "react-router-dom";
import { MapPin, LogOut, User, ClipboardList } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to log out");
      navigate("/login");
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold text-gray-900
            hover:text-green-700 transition-colors"
        >
          <MapPin size={20} className="text-green-600" />
          SmartNepal
        </Link>

        {/* Center nav links — shown when authenticated */}
        {isAuthenticated && (
          <div className="hidden sm:flex items-center gap-6">
            <Link
              to="/issues"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Issues
            </Link>
            {/* My Reports — Phase 7 */}
            <Link
              to="/issues/me"
              className="flex items-center gap-1.5 text-sm text-gray-600
                hover:text-gray-900 transition-colors"
            >
              <ClipboardList size={15} />
              My Reports
            </Link>
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <User size={15} />
                <span className="max-w-30 truncate">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-gray-500
                  hover:text-red-600 transition-colors"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg
                  hover:bg-green-700 transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
