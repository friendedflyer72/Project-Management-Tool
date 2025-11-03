// src/components/BoardCard.jsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const BoardCard = ({ card, onClick, boardLabels }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getFullLabels = () => {
    if (!boardLabels || !card.labels) return [];
    return card.labels.map(labelId => 
      boardLabels.find(l => l.id === labelId)
    ).filter(Boolean); // Filter out any undefined
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`w-full text-left bg-gray-700 p-3 rounded-md shadow-sm hover:bg-gray-600 transition-colors cursor-grab ${
        isDragging ? 'ring-2 ring-pink-500' : ''
      }`}
    >
      <div className="flex flex-wrap gap-1 mb-2">
        {getFullLabels().map(label => (
          <span
            key={label.id}
            className={`text-xs px-1.5 py-0.5 rounded-full ${label.color} text-white font-medium`}
          >
            {label.name} {/* You can remove this if you just want colors */}
          </span>
        ))}
      </div>
      <p className="text-sm text-gray-100">{card.title}</p>
    </div>
  );
};

export default BoardCard;