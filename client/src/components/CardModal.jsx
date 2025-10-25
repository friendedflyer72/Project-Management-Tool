// src/components/CardNewboard.jsx
import { useState, useEffect } from 'react';
import { updateCard } from '../api/auth';
import Newboard from './Newboard';
import { ClockIcon } from '@heroicons/react/24/outline';

const CardNewboard = ({ isOpen, onClose, cardData, onCardUpdate }) => {
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  // When the Newboard opens, populate its state from the card prop
  useEffect(() => {
    if (cardData) {
      setDescription(cardData.description || '');
    }
  }, [cardData]);

  if (!isOpen || !cardData) return null;

  const handleSave = async () => {
    try {
      const response = await updateCard(cardData.id, { description });
      onCardUpdate(response.data); // Send updated card back to BoardPage
      onClose();
    } catch (err) {
      setError('Failed to save description.');
      console.error(err);
    }
  };

  // Format the date
  const formattedDate = new Date(cardData.created_at).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <Newboard isOpen={isOpen} onClose={onClose} title={cardData.title}>
      <div className="space-y-4">
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 h-32 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="Add a more detailed description..."
          />
        </div>

        {/* Timestamp */}
        <div className="flex items-center text-sm text-gray-400">
          <ClockIcon className="w-5 h-5 mr-2" />
          <span>Created: {formattedDate}</span>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full py-2 px-4 bg-violet-600 text-white font-semibold rounded-md shadow-md hover:bg-violet-700 transition duration-300"
        >
          Save
        </button>
      </div>
    </Newboard>
  );
};

export default CardNewboard;