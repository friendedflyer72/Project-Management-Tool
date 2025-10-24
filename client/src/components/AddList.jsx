// src/components/AddList.jsx
import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

const AddList = ({ boardId, onListCreated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [listName, setListName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!listName) return;
    onListCreated(listName); // Pass name to parent handler
    setListName('');
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="bg-gray-800 bg-opacity-50 hover:bg-opacity-100 text-gray-300 font-medium p-3 rounded-lg w-72 flex-shrink-0 transition-colors"
      >
        + Add another list
      </button>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-3 w-72 flex-shrink-0">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={listName}
          onChange={(e) => setListName(e.target.value)}
          className="w-full p-2 rounded-md bg-gray-700 text-white border-blue-500 border-2"
          placeholder="Enter list title..."
          autoFocus
        />
        <div className="mt-3 flex items-center space-x-2">
          <button
            type="submit"
            className="px-4 py-2 bg-violet-600 text-white font-semibold rounded-md shadow-md hover:bg-violet-700"
          >
            Add List
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-gray-400 hover:text-white"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddList;