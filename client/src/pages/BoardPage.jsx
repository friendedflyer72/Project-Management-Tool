// src/pages/BoardPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBoardDetails } from "../api/auth";
import Navbar from "../components/Navbar";
import Aurora from "../components/Aurora";

const BoardPage = () => {
  const { id } = useParams(); // Get the board ID from the URL
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const response = await getBoardDetails(id);
        setBoard(response.data);
      } catch (err) {
        console.error("Failed to fetch board:", err);
        setError(
          "Failed to fetch board. It may not exist or you may not have access."
        );
        // If auth error, redirect to login
        if (
          err.response &&
          (err.response.status === 401 || err.response.status === 404)
        ) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchBoard();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col text-gray-200">
        <Navbar />
        <div className="absolute inset-0 -z-10 w-full h-full bg-gray-900">
          <Aurora
            colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
            blend={0.5}
            amplitude={1.0}
            speed={0.5}
          />
          <p className="p-8">Loading board...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-red-400">
        <Navbar />
        <p className="p-8">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-gray-200">
      <Navbar />
      <div className="absolute inset-0 -z-10 w-full h-full bg-gray-900">
        <Aurora
          colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
      </div>
      {/* Board Header */}
      <div className="container mx-auto p-4 sm:p-6">
        <h1 className="text-3xl font-bold text-white mb-4">{board.name}</h1>
      </div>

      {/* Board Content (Lists) */}
      <div className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 pt-0">
        {/* We'll use a horizontal scroll container */}
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {/* Map over the lists */}
          {board.lists.map((list) => (
            <div
              key={list.id}
              className="bg-gray-800 rounded-lg p-3 w-72 flex-shrink-0"
            >
              {/* List Header */}
              <h3 className="font-semibold text-white mb-3">{list.name}</h3>

              {/* Cards Container */}
              <div className="space-y-3">
                {/* Map over the cards */}
                {list.cards.map((card) => (
                  <div
                    key={card.id}
                    className="bg-gray-700 p-3 rounded-md shadow-sm"
                  >
                    <p className="text-sm text-gray-100">{card.title}</p>
                  </div>
                ))}

                {/* --- Add new card button (placeholder) --- */}
                <button className="text-gray-400 hover:text-white hover:bg-gray-600 p-2 rounded-md w-full text-left transition-colors">
                  + Add a card
                </button>
              </div>
            </div>
          ))}

          {/* --- Add new list button (placeholder) --- */}
          <button className="bg-gray-800 bg-opacity-50 hover:bg-opacity-100 text-gray-300 font-medium p-3 rounded-lg w-72 flex-shrink-0 transition-colors">
            + Add another list
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoardPage;
