// src/components/CardNewboard.jsx
import { useState, useEffect } from 'react';
// 1. Import new API functions
import { updateCard, deleteCard, duplicateCard } from '../api/auth';
import Newboard from './Newboard';
// 2. Import new icons
import { ClockIcon, TrashIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';

// 3. Accept new props for delete/duplicate handlers
const CardNewboard = ({ isOpen, onClose, cardData, onCardUpdate, onCardDelete, onCardDuplicate }) => {
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (cardData) {
      setDescription(cardData.description || '');
      setError(''); // Clear errors when modal opens
    }
  }, [cardData]);

  if (!isOpen || !cardData) return null;

  const handleSave = async () => { /* ... (this function is unchanged) ... */ };

  // 4. Add handler for Delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this card?')) return;
    try {
      await deleteCard(cardData.id);
      onCardDelete(cardData.id); // Pass ID back to BoardPage
      onClose();
    } catch (err) {
      setError('Failed to delete card.');
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
      setError('Failed to duplicate card.');
      console.error(err);
    }
  };

  const formattedDate = new Date(cardData.created_at).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <Newboard isOpen={isOpen} onClose={onClose} title={cardData.title}>
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
              className="w-full p-2 h-32 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Add a more detailed description..."
            />
          </div>
          {/* Timestamp */}
          <div className="flex items-center text-sm text-gray-400">
            <ClockIcon className="w-5 h-5 mr-2" />
            <span>Created: {formattedDate}</span>
          </div>
          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full py-2 px-4 bg-violet-600 text-white font-semibold rounded-md shadow-md hover:bg-violet-700 transition duration-300"
          >
            Save
          </button>
        </div>

        {/* Actions (Right side) */}
        <div className="w-full md:w-1/3">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Actions</h4>
          <div className="flex flex-col space-y-2">
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
      </div>
      {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
    </Newboard>
  );
};

export default CardNewboard;