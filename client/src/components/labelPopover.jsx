// src/components/LabelPopover.jsx
import { useState, useRef } from "react";
import { CheckIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/solid";
import useClickOutside from "../hooks/useClickOutside";

const availableColors = [
  "bg-green-500",
  "bg-yellow-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-violet-500",
  "bg-blue-500",
  "bg-gray-400",
];

const LabelPopover = ({
  boardLabels,
  cardLabelIds = [],
  onToggleLabel,
  onCreateLabel,
  onDeleteLabel,
  onClose,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [selectedColor, setSelectedColor] = useState(availableColors[0]);
  const popoverRef = useRef(null);

  useClickOutside(popoverRef, onClose);
  const handleCreate = () => {
    if (!newLabelName.trim()) return;
    onCreateLabel({ name: newLabelName, color: selectedColor });
    setNewLabelName("");
    setIsCreating(false);
  };
  const handleDelete = (e, labelId) => {
    e.stopPropagation(); // Stop the click from toggling the label
    if (
      window.confirm(
        "Are you sure you want to delete this label? This will remove it from all cards on this board."
      )
    ) {
      onDeleteLabel(labelId);
    }
  };
  return (
    <div ref={popoverRef} className="absolute z-10 w-64 bg-gray-700 shadow-lg rounded-md p-3 right-0 mt-2">
      <h5 className="text-xs font-medium text-gray-300 mb-2">Labels</h5>
      <ul className="space-y-1">
        {boardLabels.map((label) => {
          const isApplied = cardLabelIds.includes(label.id);
          return (
            <li
              key={label.id}
              onClick={() => onToggleLabel(label.id)}
              className={`flex items-center justify-between p-2 rounded-md ${label.color} text-white font-medium text-sm cursor-pointer hover:opacity-80`}
            >
              <span>{label.name}</span>
              {isApplied && <CheckIcon className="w-4 h-4" />}
              <button
                onClick={(e) => handleDelete(e, label.id)}
                className="p-0.5 rounded ml-2 text-white opacity-50 hover:opacity-100 hover:bg-gray-600 transition-all"
                title="Delete label"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </li>
          );
        })}
      </ul>

      <hr className="my-2 border-gray-600" />

      {isCreating ? (
        <div className="space-y-2">
          <input
            type="text"
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            placeholder="New label name..."
            className="w-full p-1.5 bg-gray-800 text-white border border-gray-600 rounded-md text-sm"
          />
          <div className="grid grid-cols-7 gap-1">
            {availableColors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-6 h-6 rounded ${color} ${
                  selectedColor === color ? "ring-2 ring-white" : ""
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleCreate}
            className="w-full bg-violet-600 text-white text-sm py-1 rounded"
          >
            Create
          </button>
          <button
            onClick={() => setIsCreating(false)}
            className="w-full bg-gray-600 text-white text-sm py-1 rounded"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full flex items-center justify-center p-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded-md transition text-sm"
        >
          <PlusIcon className="w-4 h-4 mr-1" />
          Create new label
        </button>
      )}
    </div>
  );
};

export default LabelPopover;
