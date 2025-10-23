// src/pages/RegisterPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/auth';
import Aurora from '../components/Aurora';
import CartoonWelcome from '../components/CartoonWelcome';
import Navbar from '../components/Navbar';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await registerUser(formData);
      localStorage.setItem('token', response.data.token);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed.');
    }
  };

  return (
    <div className="relative h-screen overflow-hidden">
      <Navbar/>
      {/* Aurora Background */}
      <div className="absolute inset-0 -z-10 w-full h-full bg-gray-900">
        <Aurora
          colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
      </div>

      {/* Main Grid Layout */}
      <div className="container mx-auto flex items-center justify-center h-full p-4">
        <div className="grid md:grid-cols-2 items-center gap-16 w-full max-w-6xl">
          
          {/* Column 1: Cartoons and Welcome Text (Visible on Medium screens and up) */}
          <CartoonWelcome title=" Welcome Aboard!" subtitle= "Let's get you set up in just a moment." />

          {/* Column 2: Registration Form */}
          <div className="relative z-10 p-8 rounded-lg w-full max-w-md mx-auto md:mx-0">
            <h1 className="text-3xl font-sans font-bold text-center text-white mb-6">
              Create Account
            </h1>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                  Username
                </label>
                <input 
                  type="text" 
                  id="username" 
                  placeholder="johndoe"
                  className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email Address
                </label>
                <input 
                  type="email" 
                  id="email" 
                  placeholder="you@example.com"
                  className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                  Password
                </label>
                <input 
                  type="password" 
                  id="password" 
                  placeholder="••••••••"
                  className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              {error && <div className="text-red-400 text-sm text-center">{error}</div>}
              <button 
                type="submit" 
                className="w-full py-2 px-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-md shadow-md transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                Sign Up
              </button>
            </form>
            <p className="text-center text-sm text-gray-400 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-pink-500 hover:text-pink-400">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;