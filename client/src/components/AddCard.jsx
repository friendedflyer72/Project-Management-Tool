// src/components/AddCard.jsx
import { useState } from 'react';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { generateCardDescription } from '../api/auth';

const AddCard = ({ listId, onCardCreated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [cardTitle, setCardTitle] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');

  const handleGenerateDescription = async () => {
    if (!cardTitle) return;

    try {
      const res = await generateCardDescription(cardTitle);
      setGeneratedDescription(res.data.description);
    } catch (error) {
      console.error('Error generating description:', error.response?.data || error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cardTitle) return;
    onCardCreated(cardTitle, generatedDescription);
    setCardTitle('');
    setGeneratedDescription('');
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
      {generatedDescription && (
        <div className="p-2 bg-gray-700 rounded-md text-sm text-gray-300">
          <h4 className="font-semibold text-white mb-1">Generated Description:</h4>
          <p>{generatedDescription}</p>
        </div>
      )}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={handleGenerateDescription}
          className="flex items-center px-4 py-2 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600"
        >
          <SparklesIcon className="w-5 h-5 mr-2" />
          Generate
        </button>
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
