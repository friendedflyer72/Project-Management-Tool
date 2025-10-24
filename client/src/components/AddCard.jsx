// src/components/AddCard.jsx
import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

const AddCard = ({ listId, onCardCreated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [cardTitle, setCardTitle] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cardTitle) return;
    onCardCreated(cardTitle);
    setCardTitle('');
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="text-gray-400 hover:text-white hover:bg-gray-600 p-2 rounded-md w-full text-left transition-colors"
      >
        + Add a card
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={cardTitle}
        onChange={(e) => setCardTitle(e.target.value)}
        className="w-full p-2 rounded-md bg-gray-600 text-white border-blue-500 border-2"
        placeholder="Enter a title for this card..."
        autoFocus
      />
      <div className="flex items-center space-x-2">
        <button
          type="submit"
          className="px-4 py-2 bg-violet-600 text-white font-semibold rounded-md shadow-md hover:bg-violet-700"
        >
          Add Card
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="text-gray-400 hover:text-white"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
};

export default AddCard;