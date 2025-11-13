// src/components/BoardList.jsx
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext } from "@dnd-kit/sortable";
import { TrashIcon } from "@heroicons/react/24/outline";
import AddCard from "./AddCard";

// This is your new List component
const BoardList = ({ list, cards, onCardCreated, onDeleteList, isViewer, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: list.id });

  const style = {
    // Use CSS.Transform for smooth hardware-accelerated transitions
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  // Create an array of card IDs for the SortableContext
  const cardIds = cards.map((card) => card.id);

  return (
    // This outer div is the Draggable list
    <div ref={setNodeRef} style={style} className="flex-shrink-0 w-72 mr-4">
      {/* This inner div is the Droppable area for cards */}
      <div className="bg-gray-800 rounded-lg p-3">
        {/* List Header (the drag handle) */}
        <div
          {...attributes}
          {...listeners} // Make the header the drag handle
          className="flex justify-between items-center mb-3 cursor-grab"
        >
          <h3 className="font-semibold text-white">{list.name}</h3>
          {!isViewer && (
            <button
              onClick={() => onDeleteList(list.id)}
              className="p-1 text-gray-500 hover:text-red-500 rounded transition-colors"
              title="Delete list"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* --- Card Section --- */}
        {/* We wrap the cards in their own SortableContext */}
        <SortableContext items={cardIds}>
          <div className="space-y-3 min-h-[20px]">
            {children} {/* This is where the SortableCard components will go */}
          </div>
        </SortableContext>
        {/* Hide add card from viewers */}
        {!isViewer && (
          <AddCard listId={list.id} onCardCreated={onCardCreated} />
        )}
      </div>
    </div>
  );
};

export default BoardList;
