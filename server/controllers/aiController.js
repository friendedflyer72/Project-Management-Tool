const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("../db");
const { getIO } = require("../socket");
const { logActivity } = require("../utils/logActivity");

// Initialize the Google Generative AI client
// We check for the key before initializing
if (!process.env.GEMINI_API_KEY) {
  console.error(
    "FATAL ERROR: GEMINI_API_KEY is not set in the environment variables."
  );
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateDescription = async (req, res) => {
  // Check for API Key on each request, in case the server started without it
  if (!process.env.GEMINI_API_KEY) {
    return res
      .status(500)
      .json({ error: "Server is missing the Gemini API key." });
  }

  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
      details: error.message || "An unknown error occurred.",
    });
  }
};

const parseTask = async (req, res) => {
  const io = getIO();
  const { id: userId } = req.user;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Server is missing the Gemini API key." });
  }

  const client = await db.pool.connect(); // Use a client for transactions

  try {
    const { text, boardId } = req.body;

    if (!text || !boardId) {
      return res.status(400).json({ error: "Text and boardId are required" });
    }

    // 1. Fetch context for the AI (Existing lists/labels)
    const listRes = await db.query("SELECT name FROM lists WHERE board_id = $1", [boardId]);
    const labelRes = await db.query("SELECT name FROM labels WHERE board_id = $1", [boardId]);

    // 2. Call Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const today = new Date().toISOString().split("T")[0];

    const prompt = `
      You are an intelligent project manager AI. Parse the user's command into structured JSON.
      
      **Current Date:** ${today}
      **User Command:** "${text}"
      
      **Existing Lists:** ${JSON.stringify(listRes.rows.map(l => l.name))}
      **Existing Labels:** ${JSON.stringify(labelRes.rows.map(l => l.name))}

      **Rules:**
      1. **Title:** Extract the specific task name.
      2. **List:** Match the user's intent to an *Existing List* if possible. If the user specifies a list that does NOT exist (e.g. "Done"), use that new name exactly. If no list is mentioned, default to "To Do".
      3. **Labels:** Extract priority or category keywords (e.g., "High Priority", "Bug", "Urgent"). If the label doesn't exist in the provided list, output it anyway.
      4. **Due Date:** Parse dates (e.g., "tomorrow", "next friday") into YYYY-MM-DD.
      
      **Output JSON ONLY:**
      {
        "title": "string",
        "listName": "string",
        "labels": ["string"],
        "dueDate": "YYYY-MM-DD" or null,
        "description": "string" (optional, if user provides details)
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResText = response.text();
    console.log(aiResText);
    // Clean JSON
    const jsonString = aiResText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(jsonString);

    const { title, listName, description, labels: labelNames, dueDate } = parsedData;

    // --- START TRANSACTION ---
    await client.query('BEGIN');

    // 3. Handle List (Find or Create)
    let listId;
    const listCheck = await client.query(
      "SELECT id FROM lists WHERE name = $1 AND board_id = $2",
      [listName, boardId]
    );

    if (listCheck.rows.length > 0) {
      listId = listCheck.rows[0].id;
    } else {
      // Create new list
      const posRes = await client.query(
        "SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM lists WHERE board_id = $1",
        [boardId]
      );
      const newPos = posRes.rows[0].next_pos;
      const newList = await client.query(
        "INSERT INTO lists (name, board_id, position) VALUES ($1, $2, $3) RETURNING id",
        [listName, boardId, newPos]
      );
      listId = newList.rows[0].id;
      // Log activity for list creation
      logActivity(boardId, userId, `created list "${listName}" via AI`);
    }

    // 4. Create Card
    const cardPosRes = await client.query(
      "SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM cards WHERE list_id = $1",
      [listId]
    );
    const nextCardPos = cardPosRes.rows[0].next_pos;

    const newCardRes = await client.query(
      `INSERT INTO cards (title, list_id, position, description, due_date) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [title, listId, nextCardPos, description || '', dueDate || null]
    );
    const newCard = newCardRes.rows[0];

    // 5. Handle Labels (Find or Create)
    if (labelNames && labelNames.length > 0) {
      for (const labelName of labelNames) {
        let labelId;

        const labelCheck = await client.query(
          "SELECT id FROM labels WHERE name = $1 AND board_id = $2",
          [labelName, boardId]
        );

        if (labelCheck.rows.length > 0) {
          labelId = labelCheck.rows[0].id;
        } else {
          // ---  COLOR LOGIC  ---
          let labelColor = 'bg-blue-500'; // Default
          const lowerName = labelName.toLowerCase();

          if (lowerName.includes('high')) {
            labelColor = 'bg-red-500';
          } else if (lowerName.includes('medium')) {
            labelColor = 'bg-yellow-500';
          } else if (lowerName.includes('low')) {
            labelColor = 'bg-gray-400'; 
          } else if (lowerName.includes('progress')) {
            labelColor = 'bg-violet-500';
          } else if (lowerName.includes('done')) {
            labelColor = 'bg-green-600';
          }

          // Create new label with the calculated color
          const newLabelRes = await client.query(
            "INSERT INTO labels (name, board_id, color) VALUES ($1, $2, $3) RETURNING id",
            [labelName, boardId, labelColor]
          );
          labelId = newLabelRes.rows[0].id;
        }

        // Link label to card
        await client.query(
          "INSERT INTO card_labels (card_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [newCard.id, labelId]
        );
      }
    }

    // --- COMMIT TRANSACTION ---
    await client.query('COMMIT');

    // 6. Finalize
    logActivity(boardId, userId, `created task "${title}" via AI`);
    io.to(boardId.toString()).emit("BOARD_UPDATED");

    res.status(201).json(newCard);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error parsing task:", error);
    res.status(500).json({
      error: "Failed to parse task.",
      details: error.message || "An unknown error occurred.",
    });
  } finally {
    client.release();
  }
};
module.exports = { generateDescription, parseTask };