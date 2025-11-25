// src/pages/DashboardPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getUserBoards, deleteBoard } from "../api/auth";
import Aurora from "../components/Aurora";
import Navbar from "../components/Navbar";
import { TrashIcon } from "@heroicons/react/24/outline";
import CreateboardModal from "../components/CreateboardModal";
import { toast } from "react-hot-toast";

const DashboardPage = () => {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // --- Handle Logout ---
  const handleTokenError = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };
  const handleBoardCreated = (newBoard) => {
    // Add the new board to the existing list without a full refresh
    setBoards((prevBoards) => [...prevBoards, newBoard]);
    toast.success(`Board ${newBoard.name} created successfully!`);
  };
  // --- Fetch Boards on Page Load ---
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const response = await getUserBoards();
        setBoards(response.data);
      } catch (err) {
        // If token is invalid or expired, 401 error will be caught
        if (
          err.response &&
          (err.response.status === 401 || err.response.status === 400)
        ) 
        {
          // 400 for "Token is not valid", 401 for "No token"
          handleTokenError(); // Log the user out
        } else {
          setError("Failed to fetch boards. Please try again later.");
          console.error("Fetch boards error:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
    // We only want this to run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteBoard = async (e, boardId) => {
    // Stop the click from navigating to the board page
    e.stopPropagation();
    e.preventDefault();

    if (
      window.confirm(
        "Are you sure you want to delete this board? This action is permanent."
      )
    ) {
      try {
        await deleteBoard(boardId);
        // Update state to remove the board
        setBoards((prevBoards) =>
          prevBoards.filter((board) => board.id !== boardId)
        );
        toast.success("Board deleted successfully!");
      } catch (err) {
        console.error("Failed to delete board:", err);
        // You could set an error state here
      }
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col text-gray-200">
      {/* --- Navbar --- */}
      <Navbar />
      <div className="absolute inset-0 -z-10 bg-gray-900">
        <Aurora
          colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
      </div>
      {/* --- Main Content --- */}
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 relative z-10 flex-grow">
        {/* --- Header --- */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">Your Boards</h2>
          <button
            className="py-2 px-4 bg-violet-600 text-white font-semibold rounded-md shadow-md hover:bg-violet-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            onClick={() => setIsModalOpen(true)}
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
                  to={`/board/${board.id}`}
                  key={board.id}
                  className="relative group block bg-gray-800 p-6 rounded-lg shadow-lg hover:bg-gray-700"
                >
                  <h3 className="text-xl font-semibold text-white">
                    {board.name}
                  </h3>
                  <button
                    onClick={(e) => handleDeleteBoard(e, board.id)}
                    className="absolute top-6 right-5 p-1.5 text-gray-500 hover:text-red-500 bg-gray-800 rounded-full opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500"
                    title="Delete board"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </Link>
              ))
            ) : (
              <p className="text-gray-400 col-span-full">
                You don't have any boards yet. Create one to get started!
              </p>
            )}
          </div>
        )}
      </div>
      <CreateboardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onBoardCreated={handleBoardCreated}
      />
    </div>
  );
};

export default DashboardPage;
