// src/components/NewBoard.jsx
import { XMarkIcon } from '@heroicons/react/24/solid'; // You'll need to install heroicons

const Newboard = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  // This stops a click inside the modal from closing it
  const handleModalContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    // Backdrop
    <div
      onClick={onClose} // Click outside to close
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-700/10 backdrop-blur-sm"
    >
      {/* Modal Content */}
      <div
        onClick={handleModalContentClick}
        className="relative w-full max-w-xl p-6 bg-gray-800 rounded-lg shadow-xl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};

export default Newboard;