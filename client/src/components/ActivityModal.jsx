// src/components/ActivityModal.jsx
import { useState, useEffect } from 'react';
import { getBoardActivity } from '../api/auth';
import Newboard from './Newboard';

const ActivityModal = ({ isOpen, onClose, boardId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getBoardActivity(boardId)
        .then(res => setActivities(res.data))
        .catch(err => console.error("Failed to fetch activity", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, boardId]);

  return (
    <Newboard isOpen={isOpen} onClose={onClose} title="Board Activity">
      <div className="mt-4 space-y-4 max-h-96 overflow-y-auto">
        {loading && <p className="text-gray-400">Loading activity...</p>}
        {!loading && activities.length === 0 && (
          <p className="text-gray-400">No activity yet.</p>
        )}
        {activities.map(activity => (
          <div key={activity.id} className="text-sm">
            <p className="text-gray-200">
              <span className="font-semibold text-white">{activity.username}</span> {activity.description}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(activity.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </Newboard>
  );
};

export default ActivityModal;