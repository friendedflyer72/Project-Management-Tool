// src/components/Navbar.jsx
import { Link, useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  const onBoardPage = location.pathname.startsWith("/board/");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <nav className="relative z-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Left Side: Logo and Board links */}
          <div className="flex items-center space-x-6">
            <Link
              to={token ? "/dashboard" : "/login"}  
              className="text-2xl font-bold text-white hover:text-gray-300 transition-colors"
            >
              Protask
            </Link>

            {/* 3. Wrap board links in token check so they don't show on login page */}
            {token && (
              <>
                {onBoardPage && (
                  <Link
                    to="/dashboard"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Back to Boards
                  </Link>
                )}
                {/* Only show "Boards" link if logged in and NOT on board page or dashboard */}
                {!onBoardPage && location.pathname !== '/dashboard' && (
                  <Link
                    to="/dashboard"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Boards
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right Side: Profile and Logout */}
          {token && (
            <div className="flex items-center space-x-4">
              {/* 4. Add Profile link */}
              <Link
                to="/profile"
                className="font-medium text-violet-300 hover:text-white transition-colors"
              >
                 Hi, {username}
              </Link>

              <button
                onClick={handleLogout}
                className="font-medium text-pink-500 hover:text-pink-400 p-2 rounded-lg transition duration-300"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;