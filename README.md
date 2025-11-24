# AI-Powered Project Management Tool

This is an intelligent, full-stack, collaborative project management application that leverages the power of AI to enhance team productivity and streamline task management. By integrating Google's Gemini AI, this tool goes beyond traditional platforms like Trello and Asana to offer smart features that assist with content creation and workflow automation.

The application is built with a modern tech stack, featuring a React.js frontend, a Node.js backend, and real-time collaboration through WebSockets.

## Core AI Features

- **AI-Powered Task Generation**: The standout feature of this application. When creating a new task, the integrated Google Gemini AI can automatically generate a detailed card description, including potential sub-tasks and acceptance criteria, based on just a title. This saves time and helps create well-defined tasks from the outset.

- **Smart Content Assistance**: The AI is not just for generation; it provides a foundation for smarter content management within the project, with opportunities to expand into areas like automated summaries, task categorization, and more.

## Other Key Features

- **Real-Time Collaboration**: Changes are instantly reflected for all users on the same board thanks to WebSocket integration with Socket.io.
- **Drag & Drop**: Easily reorder cards and lists with a smooth drag-and-drop interface.
- **User Authentication**: Secure user registration and login system using JSON Web Tokens (JWT).
- **Role-Based Permissions**: Assign roles (Owner, Editor, Viewer) to users to control access and editing rights.
- **Rich Task Management**:
    - Create, update, and delete cards and lists.
    - Assign team members to specific cards.
    - Add labels with customizable colors for better organization.
    - Set due dates for tasks.
    - Create checklists within cards to track sub-tasks.
- **Markdown Support**: Card descriptions are rendered with Markdown, allowing for rich text formatting.

## Tech Stack

**Frontend:**
- **Framework**: React.js with Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router
- **HTTP Client**: Axios
- **Drag & Drop**: @dnd-kit

**Backend:**
- **Framework**: Node.js with Express.js
- **Database**: PostgreSQL
- **AI Integration**: Google Gemini API
- **Real-Time Communication**: Socket.io
- **Authentication**: bcryptjs for password hashing, JWT for sessions

## Getting Started

Follow these instructions to get a local copy of the project up and running for development and testing.

### Prerequisites

- Node.js (v18 or later)
- npm
- PostgreSQL

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/friendedflyer72/Project-Management-Tool.git
    cd Project-Management-Tool
    ```

2.  **Install backend dependencies:**
    ```bash
    cd server
    npm install
    ```

3.  **Install frontend dependencies:**
    ```bash
    cd ../client
    npm install
    ```

### Database Setup

1.  Make sure your PostgreSQL server is running.
2.  Create a new database for the project.
3.  You will need to run the database schema setup. (Note: A schema setup script is assumed to exist. You may need to create one if it doesn't.)

### Environment Variables

You will need to create a `.env` file in the `server` directory. This is especially important for the AI features.

```bash
# server/.env

# Server port
PORT=5000

# PostgreSQL connection string
# Example: postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME
DATABASE_URL="your_database_connection_string"

# Secret for signing JWTs
JWT_SECRET="your_jwt_secret"

# Google Gemini API Key (Required for AI features)
GEMINI_API_KEY="your_gemini_api_key"
```

### Running the Application

1.  **Start the backend server:**
    ```bash
    cd server
    npm start
    ```
    The server will be running on `http://localhost:5000`.

2.  **Start the frontend development server:**
    Open a new terminal and run:
    ```bash
    cd client
    npm run dev
    ```
    The client will be running on `http://localhost:5173` (or another port if 5173 is in use).

Open your browser and navigate to the client URL to use the application.
