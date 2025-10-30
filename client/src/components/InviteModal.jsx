// src/components/InviteNewboard.jsx
import { useState } from 'react';
import { inviteUserToBoard } from '../api/auth';
import Newboard from './Newboard';

const InviteNewboard = ({ isOpen, onClose, boardId }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await inviteUserToBoard(boardId, email);
      setSuccess(`Successfully invited ${email}!`);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to send invite.');
    }
  };

  return (
    <Newboard isOpen={isOpen} onClose={onClose} title="Invite to Board">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
            User's Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="user@example.com"
            autoFocus
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-green-400 text-sm">{success}</p>}

        <button
          type="submit"
          className="w-full py-2 px-4 bg-violet-600 text-white font-semibold rounded-md shadow-md hover:bg-violet-700 transition"
        >
          Send Invite
        </button>
      </form>
    </Newboard>
  );
};

export default InviteNewboard;