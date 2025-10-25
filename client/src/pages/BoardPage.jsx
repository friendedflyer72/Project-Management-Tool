// src/pages/BoardPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getBoardDetails,
  createList,
  createCard,
  deleteList,
  updateCard,
  updateCardOrder,
  updateListOrder,
} from "../api/auth";
import { TrashIcon } from "@heroicons/react/24/outline";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Navbar from "../components/Navbar";
import Aurora from "../components/Aurora";
import AddList from "../components/AddList";
import AddCard from "../components/AddCard";
import CardModal from "../components/CardModal";

const BoardPage = () => {
  const { id } = useParams(); // Get the board ID from the URL
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
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
  // --- NEW HANDLER for creating a list ---
  const handleAddList = async (listName) => {
    try {
      // 1. Get the full response
      const response = await createList({ name: listName, board_id: id });

      // 2. Extract the new list from response.data
      const newList = response.data;

      // 3. Update state with the correct object
      setBoard((prevBoard) => ({
        ...prevBoard,
        lists: [...prevBoard.lists, newList],
      }));
    } catch (err) {
      console.error("Failed to create list:", err);
    }
  };
  const handleAddCard = async (cardTitle, listId) => {
    try {
      // 1. Get the full response
      const response = await createCard({ title: cardTitle, list_id: listId });

      // 2. Extract the new card from response.data
      const newCard = response.data;

      // 3. Update state with the correct object
      setBoard((prevBoard) => ({
        ...prevBoard,
        lists: prevBoard.lists.map((list) =>
          list.id === listId
            ? { ...list, cards: [...list.cards, newCard] } // Add new card
            : list
        ),
      }));
    } catch (err) {
      console.error("Failed to create card:", err);
    }
  };
  const handleCardUpdate = (updatedCard) => {
    // This logic finds the right list and card and updates it
    setBoard((prevBoard) => ({
      ...prevBoard,
      lists: prevBoard.lists.map((list) => ({
        ...list,
        cards: list.cards.map((card) =>
          card.id === updatedCard.id ? updatedCard : card
        ),
      })),
    }));
  };

  const onDragEnd = (result) => {
    const { destination, source, draggableId, type } = result;

    // 1. If dropped outside a valid area
    if (!destination) {
      return;
    }

    // 2. If dropped in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (type === "list") {
      const newLists = Array.from(board.lists);
      const [reorderedItem] = newLists.splice(source.index, 1);
      newLists.splice(destination.index, 0, reorderedItem);

      // Update state optimistically
      setBoard((prevBoard) => ({
        ...prevBoard,
        lists: newLists,
      }));

      // Send update to backend
      updateListOrder(
        id,
        newLists.map((list) => list.id)
      ).catch((err) => {
        console.error("Failed to reorder list", err);
        // TODO: Revert state on failure
      });
      return;
    }

    const startList = board.lists.find(
      (list) => list.id.toString() === source.droppableId
    );
    const finishList = board.lists.find(
      (list) => list.id.toString() === destination.droppableId
    );

    if (startList === finishList) {
      // Create new, reordered cards array
      const newCards = Array.from(startList.cards);
      const [reorderedItem] = newCards.splice(source.index, 1);
      newCards.splice(destination.index, 0, reorderedItem);

      // Create new list object
      const newList = { ...startList, cards: newCards };

      // Update board state (optimistic update)
      setBoard((prevBoard) => ({
        ...prevBoard,
        lists: prevBoard.lists.map((list) =>
          list.id === newList.id ? newList : list
        ),
      }));

      // Send update to backend
      updateCardOrder(
        newList.id,
        newCards.map((card) => card.id)
      ).catch((err) => {
        console.error("Failed to reorder list", err);
        // TODO: Revert state on failure
      });
      return;
    }

    // 5. --- Handle Moving between different lists ---
    const startCards = Array.from(startList.cards);
    const [movedItem] = startCards.splice(source.index, 1);
    const newStartList = { ...startList, cards: startCards };

    const finishCards = Array.from(finishList.cards);
    finishCards.splice(destination.index, 0, movedItem);
    const newFinishList = { ...finishList, cards: finishCards };

    // Update board state (optimistic update)
    setBoard((prevBoard) => ({
      ...prevBoard,
      lists: prevBoard.lists.map((list) =>
        list.id === newStartList.id
          ? newStartList
          : list.id === newFinishList.id
          ? newFinishList
          : list
      ),
    }));

    // Send updates to backend for BOTH lists
    updateCardOrder(
      newStartList.id,
      startCards.map((card) => card.id)
    ).catch((err) => console.error("Failed to update source list", err));

    updateCardOrder(
      newFinishList.id,
      finishCards.map((card) => card.id)
    ).catch((err) => console.error("Failed to update destination list", err));
  };

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
  const handleDeleteList = async (listId) => {
    if (window.confirm("Are you sure you want to delete this list?")) {
      try {
        await deleteList(listId);
        // Update state to remove the list
        setBoard((prevBoard) => ({
          ...prevBoard,
          lists: prevBoard.lists.filter((list) => list.id !== listId),
        }));
      } catch (err) {
        console.error("Failed to delete list:", err);
      }
    }
  };

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
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="all-lists" direction="horizontal" type="list">
          {(provided) => (
            <div
              className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 pt-0"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {/* We'll use a horizontal scroll container */}
              <div className="flex space-x-4 overflow-x-auto pb-4">
                {/* Map over the lists */}
                {board.lists.map((list, index) => (
                  <Draggable
                    key={list.id}
                    draggableId={list.id.toString()}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps} // This allows dragging the whole list
                      >
                        <Droppable
                          key={list.id}
                          droppableId={list.id.toString()}
                          type="card"
                        >
                          {(dropProvided, dropSnapshot) => (
                            <div
                              ref={dropProvided.innerRef}
                              {...dropProvided.droppableProps}
                              className={`bg-gray-800 rounded-lg p-3 w-72 flex-shrink-0 ${
                                dropSnapshot.isDraggingOver ? "bg-gray-700" : ""
                              }`}
                            >
                              <div className="flex justify-between items-center mb-3">
                                {/* List Header */}
                                <h3 className="font-semibold text-white">
                                  {list.name}
                                </h3>
                                <button
                                  onClick={() => handleDeleteList(list.id)}
                                  className="p-1 text-gray-500 hover:text-red-500 rounded transition-colors"
                                  title="Delete list"
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </button>
                              </div>
                              {/* Cards Container */}
                              <div className="space-y-3">
                                {list.cards.map((card, index) => (
                                  // 6. Wrap the card in a Draggable
                                  <Draggable
                                    key={card.id}
                                    draggableId={card.id.toString()}
                                    index={index}
                                  >
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        onClick={() => setSelectedCard(card)}
                                        className={`w-full text-left bg-gray-700 p-3 rounded-md shadow-sm hover:bg-gray-600 transition-colors ${
                                          snapshot.isDragging
                                            ? "ring-2 ring-pink-500"
                                            : ""
                                        }`}
                                      >
                                        <p className="text-sm text-gray-100">
                                          {card.title}
                                        </p>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {dropProvided.placeholder}
                              </div>
                              <AddCard
                                listId={list.id}
                                onCardCreated={(title) =>
                                  handleAddCard(title, list.id)
                                }
                              />
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                <AddList boardId={id} onListCreated={handleAddList} />
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <CardModal
        isOpen={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        cardData={selectedCard}
        onCardUpdate={handleCardUpdate}
      />
    </div>
  );
};

export default BoardPage;
