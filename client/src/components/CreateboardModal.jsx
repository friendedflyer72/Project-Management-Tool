// src/components/CreateboardModal.jsx
import { useState } from 'react';
import { createBoard } from '../api/auth';
import Newboard from './Newboard';

const CreateboardModal = ({ isOpen, onClose, onBoardCreated }) => {
  const [boardName, setBoardName] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!boardName) {
      setError('Board name is required.');
      return;
    }
    setError(null);

    try {
      // 1. Call the API
      const response = await createBoard({ name: boardName });
      
      // 2. Pass the new board data back to the dashboard
      onBoardCreated(response.data);
      
      // 3. Reset state and close modal
      setBoardName('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create board.');
      console.error(err);
    }
  };

  return (
    <Newboard isOpen={isOpen} onClose={onClose} title="Create New Board">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="boardName" 
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Board Name
          </label>
          <input
            type="text"
            id="boardName"
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="e.g., Project Phoenix"
            autoFocus
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          className="w-full py-2 px-4 bg-violet-600 text-white font-semibold rounded-md shadow-md hover:bg-violet-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          Create Board
        </button>
      </form>
    </Newboard>
  );
};

export default CreateboardModal;