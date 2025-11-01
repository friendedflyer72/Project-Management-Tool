// src/pages/EditProfilePage.jsx
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getMe, updateMe, changePassword } from "../api/auth";
import { useNavigate } from "react-router-dom";
import Aurora from "../components/Aurora";
import toast from "react-hot-toast";

const EditProfilePage = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({ username: "", email: "" });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch current user data on load
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getMe();
        setProfileData({ username: res.data.username, email: res.data.email });
      } catch (err) {
        console.error("Failed to fetch user", err);
        if (
          err.response &&
          (err.response.status === 401 || err.response.status === 400)
        ) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.id]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.id]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    try {
      const res = await updateMe(profileData);
      setProfileData(res.data);
      setProfileSuccess("Profile updated successfully!");
      toast.success("Profile updated successfully!");
    } catch (err) {
      setProfileError(err.response?.data?.msg || "Failed to update profile.");
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    try {
      await changePassword(passwordData);
      setPasswordSuccess("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "" }); // Clear fields
    } catch (err) {
      setPasswordError(err.response?.data?.msg || "Failed to change password.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-900">
        <Navbar />
        <p className="text-gray-400 p-8">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-gray-200">
      <Navbar />
      <div className="absolute inset-0 -z-10 w-full h-full bg-gray-900">
        <Aurora
          colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
      </div>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-white mb-6">Edit Profile</h1>

        {/* --- Profile Form --- */}
        <form
          onSubmit={handleProfileSubmit}
          className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-4">
            Profile Details
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                value={profileData.username}
                onChange={handleProfileChange}
                className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={profileData.email}
                onChange={handleProfileChange}
                className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            {profileError && (
              <p className="text-red-400 text-sm">{profileError}</p>
            )}
            {profileSuccess && (
              <p className="text-green-400 text-sm">{profileSuccess}</p>
            )}
            <button
              type="submit"
              className="w-full py-2 px-4 bg-violet-600 text-white font-semibold rounded-md shadow-md hover:bg-violet-700 transition"
            >
              Save Profile
            </button>
          </div>
        </form>

        {/* --- Password Form --- */}
        <form
          onSubmit={handlePasswordSubmit}
          className="bg-gray-800 p-6 rounded-lg shadow-lg"
        >
          <h2 className="text-xl font-semibold text-white mb-4">
            Change Password
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              {/* 2. FIXED THIS LINE: Removed stray </T> */}
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            {passwordError && (
              <p className="text-red-400 text-sm">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-green-400 text-sm">{passwordSuccess}</p>
            )}
            <button
              type="submit"
              className="w-full py-2 px-4 bg-violet-600 text-white font-semibold rounded-md shadow-md hover:bg-violet-700 transition"
            >
              Change Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfilePage;
