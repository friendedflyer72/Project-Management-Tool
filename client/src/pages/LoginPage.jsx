// src/pages/LoginPage.jsx
import Aurora from '../components/Aurora'; // Your background component
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api/auth';
import { useState } from 'react';

const LoginPage = () => {
  const navigate = useNavigate(); // Hook for redirection
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState(null); // To store error messages

  // Update state when user types
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  // Handle the form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form refresh
    setError(null); // Clear previous errors

    try {
      // 1. Call the API function
      const response = await loginUser(formData);

      // 2. Handle success
      console.log('Login successful:', response.data);
      
      // 3. Store the token
      localStorage.setItem('token', response.data.token); 
      // We also get response.data.username if we want to use it

      // 4. Redirect to the dashboard
      navigate('/dashboard');

    } catch (err) {
      // 5. Handle errors
      console.error('Login error:', err.response);
      setError(err.response?.data?.msg || 'Login failed. Please try again.');
    }
  };
  return (
    // 1. Parent container is relative, full-screen, and hides overflow
    <div className="relative flex items-center justify-center h-screen overflow-hidden">
      
      {/* 2. Aurora background */}
      {/* We position it absolute, fill the screen, and send it to the back */}
      <div className="absolute inset-0 -z-10 bg-black">
        <Aurora
          colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
      </div>

      {/* 3. Login Content Card */}
      {/* We bring this forward with z-10 and style it as a card */}
      <div className="relative z-10 p-8 rounded-lg max-w-sm w-full">
        <h1 className="text-3xl font-bold text-center text-white">Sign In</h1>
        
        <form className="mt-6" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-white mb-1" htmlFor="email">
              Email Address
            </label>
            <input 
              type="email" 
              id="email" 
              className="w-full px-3 py-2 border text-white border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-1" htmlFor="password">
              Password
            </label>
            <input 
              type="password" 
              id="password" 
              className="w-full px-3 py-2 border text-white border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          <button 
            type="submit" 
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Sign up
          </Link>
        </p>
      </div>

    </div>
  );
};

export default LoginPage;