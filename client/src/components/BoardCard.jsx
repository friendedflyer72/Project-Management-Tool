// src/components/BoardCard.jsx
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import BoardMembers from "./BoardMembers";

const BoardCard = ({ card, onClick, boardLabels, boardMembers, isViewer }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, disabled: isViewer });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getFullLabels = () => {
    if (!boardLabels || !card.labels) return [];
    return card.labels
      .map((labelId) => boardLabels.find((l) => l.id === labelId))
      .filter(Boolean); // Filter out any undefined
  };

  const getFullAssignees = () => {
    if (!boardMembers || !card.assignees) return [];
    return boardMembers.filter((member) => card.assignees.includes(member.id));
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`w-full text-left bg-gray-700 p-3 rounded-md shadow-sm hover:bg-gray-600 transition-colors ${
        isViewer ? "cursor-pointer" : "cursor-grab"
      } ${isDragging ? "ring-2 ring-pink-500" : ""}`}
    >
      <div className="flex flex-wrap gap-1 mb-2">
        {getFullLabels().map((label) => (
          <span
            key={label.id}
            className={`text-xs px-1.5 py-0.5 rounded-full ${label.color} text-white font-medium`}
          >
            {label.name} {/* You can remove this if you just want colors */}
          </span>
        ))}
      </div>
      <p className="text-sm text-gray-100">{card.title}</p>
      <div className="mt-3">
        <BoardMembers members={getFullAssignees()} />
      </div>
    </div>
  );
};

export default BoardCard;
