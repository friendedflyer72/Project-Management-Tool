// src/components/Navbar.jsx
import { Link, useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  const onBoardPage = location.pathname.startsWith("/board/");
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    // We use a dark theme matching your dashboard
    <nav className="relative z-20">
      {" "}
      {/* z-20 to ensure it's above other content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 4. Group logo and conditional link on the left */}
          <div className="flex items-center space-x-6">
            <Link
              to={token ? "/dashboard" : "/login"}
              className="text-2xl font-bold text-white hover:text-gray-300 transition-colors"
            >
              Protask
            </Link>

            {/* 5. Conditionally render "Boards" link */}
            {onBoardPage && (
              <Link
                to="/dashboard"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Boards
              </Link>
            )}
          </div>

          {/* Conditional Logout Button */}
          {token && (
            <button
              onClick={handleLogout}
              className="font-medium text-white hover:text-violet-400 p-2 rounded-lg transition duration-300"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
