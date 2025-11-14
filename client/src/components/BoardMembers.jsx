// src/components/BoardMembers.jsx

// This helper creates initials from a username
const getInitials = (name = '') => {
  const words = name.trim().split(' ').filter(Boolean); // Clean and split
  let initials = '';

  if (words.length > 1) {
    // Case 1: "John Doe" -> "JD"
    initials = words[0][0] + words[1][0];
  } else if (words.length === 1) {
    // Case 2: One word. "Protask" -> "PR"
    initials = words[0].slice(0, 2);
  }
  
  initials = initials.toUpperCase();
  
  // Pad to 2 characters if needed
  if (initials.length === 0) return '??';
  if (initials.length === 1) return initials + '_'; // "S" -> "S_"
  
  return initials; // "JD" or "PR"
};

const BoardMembers = ({ members = [] }) => {
  return (
    <div className="flex items-center space-x-2">
      {members.map(member => (
        <div
          key={member.id}
          className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold"
          title={`${member.username} (${member.role})`}
        >
          {getInitials(member.username)}
        </div>
      ))}
    </div>
  );
};

export default BoardMembers;