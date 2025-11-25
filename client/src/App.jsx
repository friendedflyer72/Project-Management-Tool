// src/App.jsx
// src/App.jsx
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import BoardPage from "./pages/BoardPage";
import { BrowserRouter } from "react-router-dom";
import EditProfilePage from "./pages/EditProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <>
      <Toaster
        position="bottom-right" // This sets the position
        toastOptions={{
          // Define default options
          style: {
            background: "#7008e7", // Dark background
            color: "#fff", // Light text
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} /> {/* Default route */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          // Protected Routes
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/board/:id" element={<BoardPage />} />
            <Route path="/profile" element={<EditProfilePage />} />
          </Route>
          {/* We will protect this dashboard route later */}
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
