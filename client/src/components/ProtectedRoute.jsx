// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');

  // If there's no token, redirect to login immediately
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If there is a token, render the child route (Dashboard or BoardPage)
  return <Outlet />;
};

export default ProtectedRoute;