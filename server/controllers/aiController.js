const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Google Generative AI client
// We check for the key before initializing
if (!process.env.GEMINI_API_KEY) {
  console.error("FATAL ERROR: GEMINI_API_KEY is not set in the environment variables.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateDescription = async (req, res) => {
  // Check for API Key on each request, in case the server started without it
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Server is missing the Gemini API key." });
  }
  
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Generate a detailed description for a project management card with the title: "${title}". Include potential sub-tasks and acceptance criteria. (Make it unformated in 20 words).`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ description: text });
  } catch (error) {
    console.error("Error generating description:", error);
    // Send back a more specific error message to the client
    res.status(500).json({ 
      error: "Failed to generate description from AI.",
      details: error.message || "An unknown error occurred."
    });
  }
};

module.exports = { generateDescription };
