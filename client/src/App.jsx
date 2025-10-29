// src/App.jsx
// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BoardPage from './pages/BoardPage';
import { BrowserRouter } from 'react-router-dom';
import EditProfilePage from './pages/EditProfilePage';

function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<LoginPage />} /> {/* Default route */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} /> 
      <Route path="/board/:id" element={<BoardPage />} />
      <Route path="/profile" element={<EditProfilePage />} />
      {/* We will protect this dashboard route later */} 
    </Routes>
    </BrowserRouter>
  );
}

export default App;