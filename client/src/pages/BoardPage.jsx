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
  deleteLabel,
} from "../api/auth";

// 1. Import dnd-kit components
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { ListBulletIcon } from "@heroicons/react/24/outline";

// 2. Import our new components
import BoardList from "../components/BoardList";
import BoardCard from "../components/BoardCard";
import io from "socket.io-client";
import Navbar from "../components/Navbar";
import Aurora from "../components/Aurora";
import AddList from "../components/AddList";
import CardModal from "../components/CardModal";
import InviteModal from "../components/InviteModal";
import BoardMembers from "../components/BoardMembers";
import ActivityModal from "../components/ActivityModal";

const socket = io("http://localhost:5000");
const BoardPage = () => {
  const { id } = useParams(); // Get the board ID from the URL
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [userRole, setUserRole] = useState("viewer");
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Only start dragging after moving 8px
      },
    }),
    useSensor(KeyboardSensor)
  );

  const fetchBoard = async () => {
    try {
      const response = await getBoardDetails(id);
      setBoard(response.data);
      setUserRole(response.data.userRole);
    } catch (err) {
      console.error("Failed to fetch board:", err);
      setError(
        "Failed to fetch board. It may not exist or you may not have access."
      );
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

  // 4. Use useEffect to manage the socket connection
  useEffect(() => {
    // A. Fetch the initial board data
    fetchBoard();

    // B. Tell the server we want to join this board's room
    socket.emit("joinBoard", id);

    // C. Set up the listener for updates
    // When we hear "BOARD_UPDATED", re-fetch the data
    const handleBoardUpdate = () => {
      console.log("Received board update from server!");
      fetchBoard();
    };

    socket.on("BOARD_UPDATED", handleBoardUpdate);

    // D. Clean up when the component unmounts
    return () => {
      console.log("Leaving board room");
      socket.emit("leaveBoard", id);
      socket.off("BOARD_UPDATED", handleBoardUpdate); // Remove the listener
    };
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
  const handleCardDeleted = (deletedCardId) => {
    setBoard((prevBoard) => ({
      ...prevBoard,
      lists: prevBoard.lists.map((list) => ({
        ...list,
        // Filter out the deleted card
        cards: list.cards.filter((card) => card.id !== deletedCardId),
      })),
    }));
  };

  // --- Duplicate ---
  const handleCardDuplicated = (newCard) => {
    setBoard((prevBoard) => ({
      ...prevBoard,
      lists: prevBoard.lists.map((list) =>
        // Find the correct list
        list.id === newCard.list_id
          ? // Add the new card to the end of its card array
            { ...list, cards: [...list.cards, newCard] }
          : list
      ),
    }));
  };

  // --- Label ---
  const handleBoardUpdate = (newLabel) => {
    // This adds a new label to the board's state
    setBoard((prevBoard) => ({
      ...prevBoard,
      labels: [...prevBoard.labels, newLabel],
    }));
  };
  const handleDragEnd = (event) => {
    const { active, over } = event;

    // If no drop target
    if (!over) return;

    // If dropping in the same place
    if (active.id === over.id) return;

    const activeList = board.lists.find((list) =>
      list.cards.some((card) => card.id === active.id)
    );
    const overList = board.lists.find(
      (list) =>
        list.id === over.id || list.cards.some((card) => card.id === over.id)
    );

    // --- CASE 1: Dragging a LIST ---
    if (active.data.current?.type === "list") {
      // Find the old and new index of the list
      const oldIndex = board.lists.findIndex((list) => list.id === active.id);
      const newIndex = board.lists.findIndex((list) => list.id === over.id);

      // Reorder the lists array
      const newLists = arrayMove(board.lists, oldIndex, newIndex);

      // Optimistic state update
      setBoard((prev) => ({ ...prev, lists: newLists }));

      // API call
      updateListOrder(
        id,
        newLists.map((list) => list.id)
      ).catch((err) => console.error("Failed to reorder list", err)); // TODO: Revert on fail
      return;
    }

    // --- CASE 2: Dragging a CARD ---
    if (active.data.current?.type === "card") {
      let overListId = over.id; // This is the list ID if dropping on a list

      // Check if we dropped on a card instead of a list
      const overCard = overList.cards.find((card) => card.id === over.id);
      if (overCard) {
        overListId = overList.id; // We still want the list ID
      }

      // Find the old and new list
      const sourceList = activeList;
      const destList = board.lists.find((list) => list.id === overListId);

      // --- 2a: Moving card within the SAME list ---
      if (sourceList.id === destList.id) {
        const oldIndex = sourceList.cards.findIndex(
          (card) => card.id === active.id
        );
        const newIndex = destList.cards.findIndex(
          (card) => card.id === over.id
        );

        const newCards = arrayMove(sourceList.cards, oldIndex, newIndex);

        // Optimistic state update
        setBoard((prev) => ({
          ...prev,
          lists: prev.lists.map((list) =>
            list.id === sourceList.id ? { ...list, cards: newCards } : list
          ),
        }));

        // API call
        updateCardOrder(
          sourceList.id,
          newCards.map((card) => card.id)
        ).catch((err) => console.error("Failed to reorder card", err));
      }
      // --- 2b: Moving card to a DIFFERENT list ---
      else {
        // Find card
        const cardToMove = sourceList.cards.find(
          (card) => card.id === active.id
        );

        // Remove from old list
        const sourceCards = sourceList.cards.filter(
          (card) => card.id !== active.id
        );

        // Find new index in destination list
        let newIndex = destList.cards.findIndex((card) => card.id === over.id);
        if (newIndex === -1) newIndex = destList.cards.length; // Drop at end if on list

        // Add to new list
        const destCards = [...destList.cards];
        destCards.splice(newIndex, 0, cardToMove);

        // Optimistic state update
        setBoard((prev) => ({
          ...prev,
          lists: prev.lists.map((list) => {
            if (list.id === sourceList.id)
              return { ...list, cards: sourceCards };
            if (list.id === destList.id) return { ...list, cards: destCards };
            return list;
          }),
        }));

        // API calls for BOTH lists
        updateCardOrder(
          sourceList.id,
          sourceCards.map((card) => card.id)
        ).catch((err) => console.error("Failed to update source list", err));
        updateCardOrder(
          destList.id,
          destCards.map((card) => card.id)
        ).catch((err) => console.error("Failed to update dest list", err));
      }
    }
  };

  // 5. --- NEW handleDragStart ---
  // We need this to identify if we are dragging a 'list' or a 'card'
  const handleDragStart = (event) => {
    const { active } = event;
    const isList = board.lists.some((list) => list.id === active.id);

    // Store the type in the 'data' property
    if (isList) {
      active.data.current = { type: "list" };
    } else {
      active.data.current = { type: "card" };
    }
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
      <div className="min-h-screen flex flex-col text-red-400">
        <div className="absolute inset-0 -z-10 w-full h-full bg-gray-900">
          <Aurora
            colorStops={["#3A29FF", "#eb2d66ff", "#FF3232"]}
            blend={0.5}
            amplitude={1.0}
            speed={0.5}
          />
        </div>
        <Navbar />
        <p className="p-8">{error}</p>
      </div>
    );
  }
  const isViewer = userRole === "viewer";

  const handleLabelDeleted = async (labelId) => {
    try {
      await deleteLabel(labelId);

      // Update the board state to remove the label everywhere
      setBoard((prevBoard) => {
        // 1. Remove from the main labels list
        const newLabels = prevBoard.labels.filter((l) => l.id !== labelId);

        // 2. Remove from all cards
        const newLists = prevBoard.lists.map((list) => ({
          ...list,
          cards: list.cards.map((card) => ({
            ...card,
            labels: card.labels.filter((id) => id !== labelId),
          })),
        }));

        return { ...prevBoard, labels: newLabels, lists: newLists };
      });
    } catch (err) {
      console.error("Failed to delete label:", err);
      // You could show a toast.error() here
      toast.error(err.response?.data?.msg || "Failed to delete label.");
    }
  };
  console.log("RENDERING with userRole:", userRole);
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
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-3xl font-bold text-white mb-4">{board.name}</h1>
          {userRole && (
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                userRole === "owner"
                  ? "bg-green-600 text-white"
                  : userRole === "editor"
                  ? "bg-violet-600 text-white"
                  : "bg-gray-600 text-gray-200"
              }`}
            >
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/*  Render the new component */}
          <BoardMembers members={board.members} />
          <button
            onClick={() => setIsActivityModalOpen(true)}
            className="flex items-center gap-1 py-1 px-3 bg-gray-700 text-white font-medium rounded-md hover:bg-gray-600 transition"
          >
            <ListBulletIcon className="w-4 h-4" />
            Activity
          </button>
          {userRole === "owner" && (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="py-1 px-3 bg-gray-700 text-white font-medium rounded-md hover:bg-gray-600 transition"
            >
              Invite
            </button>
          )}
        </div>
      </div>
      {/* Board Content (Lists) */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        disabled={isViewer}
      >
        <div className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 pt-0">
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {/* We wrap all lists in ONE SortableContext */}
            <SortableContext items={board.lists.map((list) => list.id)}>
              {board.lists.map((list) => (
                <BoardList
                  key={list.id}
                  list={list}
                  cards={list.cards}
                  onDeleteList={handleDeleteList}
                  onCardCreated={(title) => handleAddCard(title, list.id)}
                  isViewer={isViewer}
                >
                  {/* We map the cards HERE and pass them as children */}
                  {list.cards.map((card) => (
                    <BoardCard
                      key={card.id}
                      card={card}
                      onClick={() => setSelectedCard(card)}
                      // 1. PASS ALL BOARD LABELS TO THE CARD
                      boardLabels={board.labels}
                    />
                  ))}
                </BoardList>
              ))}
            </SortableContext>
            {!isViewer && (
              <AddList boardId={id} onListCreated={handleAddList} />
            )}
          </div>
        </div>
      </DndContext>

      <CardModal
        isOpen={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        cardData={selectedCard}
        onCardUpdate={handleCardUpdate}
        onCardDelete={handleCardDeleted}
        onCardDuplicate={handleCardDuplicated}
        boardLabels={board?.labels}
        onBoardUpdate={handleBoardUpdate}
        boardId={board?.id}
        onLabelDelete={handleLabelDeleted}
      />
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        boardId={id}
      />
      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        boardId={id}
      />
    </div>
  );
};

export default BoardPage;
