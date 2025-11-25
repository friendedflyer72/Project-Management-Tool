import { useState } from "react";
import { createTaskFromText } from "../api/auth";
import { toast } from "react-hot-toast"; // Import toast
import { SparklesIcon } from "@heroicons/react/24/solid"; // Import icon

const NLTInput = ({ boardId }) => {
  const [taskText, setTaskText] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    setIsLoading(true); // Start loading
    const loadingToast = toast.loading("AI is analyzing your request...");

    try {
      await createTaskFromText(taskText, boardId);
      
      toast.dismiss(loadingToast);
      toast.success("Task created successfully!");
      setTaskText(""); // Clear input
    } catch (err) {
      console.error("Failed to create task from text:", err);
      toast.dismiss(loadingToast);
      toast.error("AI couldn't understand that. Try again.");
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <div className="mt-5 mb-4 w-full max-w-3xl mx-auto"> {/* Added width constraints */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-3 text-violet-400 pointer-events-none">
            <SparklesIcon className="w-5 h-5" />
        </div>
        
        <input
          type="text"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          disabled={isLoading}
          placeholder={isLoading ? "AI is thinking..." : "Ask AI: 'Add a bug report to In Progress named Login Failed'"}
          className={`w-full pl-10 pr-32 py-4 rounded-full bg-gray-800 text-gray-200 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all shadow-lg ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        />
        
        <button
          type="submit"
          disabled={isLoading || !taskText.trim()}
          className={`absolute right-1 top-1 bottom-1 m-0.5 px-4 rounded-full font-medium text-sm transition-all ${
            isLoading 
              ? "bg-gray-700 text-gray-400 cursor-not-allowed" 
              : "bg-violet-600 hover:bg-violet-500 text-white shadow-md"
          }`}
        >
          {isLoading ? "Processing..." : "Generate"}
        </button>
      </form>
    </div>
  );
};

export default NLTInput;