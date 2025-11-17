// src/components/AssigneePopover.jsx
import { CheckIcon } from '@heroicons/react/24/solid';
import { useRef } from 'react';
import useClickOutside from '../hooks/useClickOutside';
import BoardMembers from './BoardMembers'; // We'll reuse this!

const AssigneePopover = ({ boardMembers, cardAssigneeIds = [], onToggleAssignee, onClose }) => {
  const popoverRef = useRef(null);
  useClickOutside(popoverRef, onClose);

  return (
    <div ref={popoverRef} className="absolute z-10 w-64 bg-gray-700 shadow-lg rounded-md p-3 right-0 mt-2">
      <h5 className="text-xs font-medium text-gray-300 mb-2">Board Members</h5>
      <ul className="space-y-1">
        {boardMembers.map(member => {
          const isAssigned = cardAssigneeIds.includes(member.id);
          return (
            <li
              key={member.id}
              onClick={() => onToggleAssignee(member.id)}
              className="flex items-center justify-between p-2 rounded-md hover:bg-gray-600 cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                {/* Use the same avatar component */}
                <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
                  {member.username.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-sm text-white">{member.username}</span>
              </div>
              {isAssigned && <CheckIcon className="w-5 h-5 text-white" />}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default AssigneePopover;