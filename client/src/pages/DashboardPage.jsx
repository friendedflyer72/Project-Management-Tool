// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getUserBoards } from '../api/auth'; // Import our new function

const DashboardPage = () => {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Handle Logout ---
  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear the token
    navigate('/login'); // Redirect to login
  };

  // --- Fetch Boards on Page Load ---
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const response = await getUserBoards();
        setBoards(response.data);
      } catch (err) {
        // If token is invalid or expired, 401 error will be caught
        if (err.response && (err.response.status === 401 || err.response.status === 400)) {
          // 400 for "Token is not valid", 401 for "No token"
          handleLogout(); // Log the user out
        } else {
          setError('Failed to fetch boards. Please try again later.');
          console.error('Fetch boards error:', err);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchBoards();
    // We only want this to run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      
      {/* --- Navbar --- */}
      <nav className="bg-gray-800 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-white">ProTask</h1>
            <button
              onClick={handleLogout}
              className="font-medium text-pink-500 hover:text-pink-400 transition duration-300"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* --- Header --- */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">Your Boards</h2>
          <button
            className="py-2 px-4 bg-violet-600 text-white font-semibold rounded-md shadow-md hover:bg-violet-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            + Create New Board
          </button>
        </div>

        {/* --- Loading / Error States --- */}
        {loading && <p className="text-gray-400">Loading your boards...</p>}
        {error && <p className="text-red-400">{error}</p>}

        {/* --- Boards Grid --- */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {boards.length > 0 ? (
              boards.map((board) => (
                <Link 
                  to={`/board/${board.id}`} // We'll build this route next
                  key={board.id} 
                  className="block bg-gray-800 p-6 rounded-lg shadow-lg hover:bg-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <h3 className="text-xl font-semibold text-white">{board.name}</h3>
                </Link>
              ))
            ) : (
              <p className="text-gray-400 col-span-full">You don't have any boards yet. Create one to get started!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;