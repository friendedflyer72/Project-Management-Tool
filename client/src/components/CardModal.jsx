// src/components/CardModal.jsx
import { useState, useEffect } from "react";
import {
  updateCard,
  deleteCard,
  duplicateCard,
  createLabel,
  addLabelToCard,
  removeLabelFromCard,
  deleteLabel,
  assignUserToCard,
  removeUserFromCard,
} from "../api/auth";
import Newboard from "./Newboard";
import DatePicker from "react-datepicker";
import LabelPopover from "./labelPopover";
import AssigneePopover from "./AssigneePopover";
import BoardMembers from "../components/BoardMembers";
import {
  TrashIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  PlusIcon,
  XMarkIcon,
  SparklesIcon,
  ClockIcon,
  CalendarDaysIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

// Accept new props for delete/duplicate handlers
const CardModal = ({
  isOpen,
  onClose,
  cardData,
  onCardUpdate,
  onCardDelete,
  onCardDuplicate,
  onBoardUpdate,
  boardLabels,
  boardId,
  onLabelDelete,
  userRole,
  boardMembers,
}) => {
  const [description, setDescription] = useState("");
  const [labels, setLabels] = useState([]);
  const [error, setError] = useState("");
  const [dueDate, setDueDate] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [newItemText, setNewItemText] = useState("");
  const [isLabelPopoverOpen, setIsLabelPopoverOpen] = useState(false);
  const isViewer = userRole === "viewer";
  const [isAssigneePopoverOpen, setIsAssigneePopoverOpen] = useState(false);
  const [assignees, setAssignees] = useState([]);

  useEffect(() => {
    if (cardData) {
      setDescription(cardData.description || "");
      setDueDate(cardData.due_date ? new Date(cardData.due_date) : null);
      setLabels(cardData.labels || []);
      setAssignees(cardData.assignees || []);
      let loadedChecklist = [];
      if (typeof cardData.checklist === "string") {
        try {
          loadedChecklist = JSON.parse(cardData.checklist);
        } catch (e) {
          loadedChecklist = [];
        }
      } else if (Array.isArray(cardData.checklist)) {
        loadedChecklist = cardData.checklist;
      }
      setChecklist(loadedChecklist);
      // --- End Checklist Logic ---

      setError("");
      setNewItemText("");
    }
  }, [cardData]);

  if (!isOpen || !cardData) return null;

  const handleSave = async () => {
    try {
      const response = await updateCard(cardData.id, {
        description,
        due_date: dueDate,
        checklist,
      });
      // response.data is the card *without* labels.
      // manually add our local 'labels' state back onto it.
      const updatedCard = { ...response.data, labels: labels };

      onCardUpdate(updatedCard); // Pass the fully merged object
      onClose();
    } catch (err) {
      setError("Failed to save card data.");
      console.error(err);
    }
  };

  // 4. Add handler for Delete
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this card?")) return;
    try {
      await deleteCard(cardData.id);
      onCardDelete(cardData.id); // Pass ID back to BoardPage
      onClose();
    } catch (err) {
      setError("Failed to delete card.");
      console.error(err);
    }
  };

  // 5. Add handler for Duplicate
  const handleDuplicate = async () => {
    try {
      const response = await duplicateCard(cardData.id);
      onCardDuplicate(response.data); // Pass new card object back to BoardPage
      onClose();
    } catch (err) {
      setError("Failed to duplicate card.");
      console.error(err);
    }
  };

  const handleToggleCheckItem = (itemId) => {
    if (isViewer) return;
    setChecklist((prevChecklist) =>
      prevChecklist.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  };
  const handleAddItem = () => {
    if (isViewer) return;
    if (!newItemText.trim()) return; // Don't add empty items
    const newItem = {
      id: crypto.randomUUID(), // Create a temporary unique ID
      text: newItemText.trim(),
      completed: false,
    };
    setChecklist((prevChecklist) => [...prevChecklist, newItem]);
    setNewItemText(""); // Clear the input
  };

  const handleDeleteItem = (itemId) => {
    if (isViewer) return;
    setChecklist((prevChecklist) =>
      prevChecklist.filter((item) => item.id !== itemId)
    );
  };
  const completedCount = checklist.filter((item) => item.completed).length;
  const totalCount = checklist.length;
  const progressPercent =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const formattedDate = new Date(cardData.created_at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleToggleLabel = async (labelId) => {
    if (isViewer) return;
    const hasLabel = labels.includes(labelId); // Use local 'labels' state
    let updatedLabels;

    try {
      if (hasLabel) {
        await removeLabelFromCard(cardData.id, labelId);
        updatedLabels = labels.filter((id) => id !== labelId);
      } else {
        await addLabelToCard(cardData.id, labelId);
        updatedLabels = [...labels, labelId];
      }

      setLabels(updatedLabels); // Update local state
      onCardUpdate({
        ...cardData,
        ...{ description, dueDate, checklist },
        labels: updatedLabels,
      }); // Also update BoardPage
    } catch (err) {
      console.error("Failed to toggle label", err);
      setError("Failed to update label.");
    }
  };

  const handleCreateLabel = async (newLabelData) => {
    try {
      // 1. Get the full response object
      const response = await createLabel({
        ...newLabelData,
        board_id: boardId,
      });

      // 2. Get the actual label data
      const newLabel = response.data;

      onBoardUpdate(newLabel); // This is now correct
      await handleToggleLabel(newLabel.id); // This now passes a valid ID
      setIsLabelPopoverOpen(false);
    } catch (err) {
      console.error("Failed to create label", err);
      setError("Failed to create label.");
    }
  };

  // 4. Helper to get full label objects
  const getFullLabels = () => {
    if (!boardLabels || !cardData.labels) return [];
    return cardData.labels
      .map((labelId) => boardLabels.find((l) => l.id === labelId))
      .filter(Boolean); // Filter out any undefined
  };

  const handleDeleteLabel = (labelId) => {
    onLabelDelete(labelId);
  };

  const formattedUpdateDate = cardData.updated_at
    ? new Date(cardData.updated_at).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // --- ADD ASSIGNEE HANDLER ---
  const handleToggleAssignee = async (userId) => {
    if (isViewer) return;
    const hasAssignee = assignees.includes(userId);
    let updatedAssignees;

    try {
      if (hasAssignee) {
        await removeUserFromCard(cardData.id, userId);
        updatedAssignees = assignees.filter((id) => id !== userId);
      } else {
        await assignUserToCard(cardData.id, userId);
        updatedAssignees = [...assignees, userId];
      }
      setAssignees(updatedAssignees);
      // Update BoardPage
      onCardUpdate({
        ...cardData,
        ...{ description, dueDate, checklist, labels },
        assignees: updatedAssignees,
      });
    } catch (err) {
      console.error("Failed to toggle assignee", err);
      setError("Failed to update assignee.");
    }
  };

  // Helper to get full member objects for assigned users
  const getFullAssignees = () => {
    if (!boardMembers || !assignees) return [];
    return boardMembers.filter((member) => assignees.includes(member.id));
  };
  return (
    <Newboard isOpen={isOpen} onClose={onClose} title={cardData.title}>
      <div className="flex flex-wrap gap-1 mb-4">
        {getFullLabels().map((label) => (
          <span
            key={label.id}
            className={`text-xs font-bold px-2 py-1 rounded-full ${label.color} text-white`}
          >
            {label.name}
          </span>
        ))}
      </div>
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Assignees</h4>
        <BoardMembers members={getFullAssignees()} />
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Main Content (Left side) */}
        <div className="w-full md:w-2/3 space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isViewer} // 5. Disable input
              readOnly={isViewer} // for good measure
              className="w-full p-2 h-32 ... disabled:opacity-70 disabled:cursor-not-allowed"
              placeholder={
                isViewer
                  ? "No description provided."
                  : "Add a more detailed description..."
              }
            />
          </div>
          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Due Date
            </label>
            <DatePicker
              dateFormat="dd/MM/yyyy"
              selected={dueDate}
              onChange={(date) => setDueDate(date)}
              isClearable
              disabled={isViewer}
              placeholderText={
                isViewer ? "No due date set." : "Set a due date..."
              }
              className="w-full px-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-70 disabled:cursor-not-allowed"
            />
          </div>
          {/*CHECKLIST SECTION */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-300">
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              Checklist
            </label>

            {/* Progress Bar */}
            {totalCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {Math.round(progressPercent)}%
                </span>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-violet-600 h-2 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Checklist Items */}
            <div className="space-y-1 max-h-40 overflow-y-auto pr-2">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center group">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleToggleCheckItem(item.id)}
                    disabled={isViewer}
                    className="w-4 h-4 text-violet-600 bg-gray-700 border-gray-600 rounded focus:ring-violet-500 disabled:cursor-not-allowed"
                  />
                  <span
                    className={`ml-2 text-sm flex-grow ${
                      item.completed
                        ? "line-through text-gray-500"
                        : "text-gray-200"
                    }`}
                  >
                    {item.text}
                  </span>
                  {!isViewer && (
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="ml-auto p-1 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Item Input */}
            {!isViewer && (
              <div className="flex items-center">
                <input
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="Add an item"
                  className="flex-grow p-1.5 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                />
                <button
                  onClick={handleAddItem}
                  className="ml-2 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm font-semibold rounded-md"
                >
                  Add
                </button>
              </div>
            )}
          </div>
          {/* Timestamp */}
          <div className="flex items-center text-sm text-gray-400">
            <ClockIcon className="w-5 h-5 mr-2" />
            <span>Created: {formattedDate}</span>
          </div>
          {formattedUpdateDate && (
            <div className="flex items-center">
              <CalendarDaysIcon className="w-5 h-5 mr-2" />
              <span>
                Updated: {formattedUpdateDate} by{" "}
                {cardData.updated_by_username || "Unknown"}
              </span>
            </div>
          )}
          {/* Save Button */}
          {!isViewer && (
            <button
              onClick={handleSave}
              className="w-full py-2 px-4 bg-violet-600 text-white font-semibold rounded-md shadow-md hover:bg-violet-700 transition duration-300"
            >
              Save
            </button>
          )}
        </div>

        {/* Actions (Right side) */}
        {!isViewer && (
          <div className="w-full md:w-1/3">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Actions</h4>
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => setIsAssigneePopoverOpen(prev => !prev)}
                className="flex items-center w-full p-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md transition"
              >
                <UserPlusIcon className="w-5 h-5 mr-2" />
                Assign
              </button>
              {isAssigneePopoverOpen && (
                <AssigneePopover
                  boardMembers={boardMembers}
                  cardAssigneeIds={assignees}
                  onToggleAssignee={handleToggleAssignee}
                  onClose={() => setIsAssigneePopoverOpen(false)}
                />
              )}
              <button
                onClick={() => setIsLabelPopoverOpen((prev) => !prev)}
                className="flex items-center w-full p-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md transition"
              >
                <SparklesIcon className="w-5 h-5 mr-2" />
                Labels
              </button>
              {isLabelPopoverOpen && (
                <LabelPopover
                  boardLabels={boardLabels}
                  // 5. --- UPDATE THIS PROP ---
                  cardLabelIds={labels} // Use local 'labels' state, not cardData.labels
                  onToggleLabel={handleToggleLabel}
                  onCreateLabel={handleCreateLabel}
                  onDeleteLabel={onLabelDelete}
                  onClose={() => setIsLabelPopoverOpen(false)}
                  userRole={userRole}
                />
              )}
              <button
                onClick={handleDuplicate}
                className="flex items-center w-full p-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md transition"
              >
                <DocumentDuplicateIcon className="w-5 h-5 mr-2" />
                Duplicate
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center w-full p-2 bg-gray-700 hover:bg-red-800 text-gray-200 hover:text-white rounded-md transition"
              >
                <TrashIcon className="w-5 h-5 mr-2" />
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
    </Newboard>
  );
};

export default CardModal;
