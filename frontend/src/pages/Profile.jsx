import { useState, useEffect } from "react";
import {
  getProfile,
  updateProfile,
  deleteProfile,
} from "../services/authService";
import { logout } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import { Train, Eye, EyeOff, Trash2 } from "lucide-react";

function Profile() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [nid, setNid] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await getProfile();
      setName(res.data.user.name);
      setNid(res.data.user.nid);
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!password.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    try {
      await updateProfile({ name, password, newPassword });
      setSuccess("Profile updated successfully");
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      let msg = "Failed to update profile";
      if (err?.response?.data?.message) msg = err.response.data.message;
      setError(msg);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await deleteProfile();
      logout();
      navigate("/");
    } catch (err) {
      let msg = "Failed to delete profile";
      if (err?.response?.data?.message) msg = err.response.data.message;
      setError(msg);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 font-sans relative overflow-hidden p-4">
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -left-24 w-[400px] h-[400px] rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent pointer-events-none" />
      <div className="absolute top-2/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-300/20 to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-4 flex flex-col items-center">
        <div className="flex flex-col items-center mb-5">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/40 mb-3">
            <Train className="w-6 h-6 text-white" />
          </div>
          <span
            className="text-white tracking-tight"
            style={{ fontSize: "1.25rem", fontWeight: 700 }}
          >
            MetroRail
          </span>
          <span
            className="text-blue-300 tracking-widest uppercase"
            style={{ fontSize: "0.58rem", fontWeight: 500 }}
          >
            Management System
          </span>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl shadow-blue-900/50 overflow-hidden w-full">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-500" />
          <div className="px-8 py-7">
            <div className="mb-6 text-center px-1">
              <h1
                className="text-gray-900 mb-0.5"
                style={{ fontSize: "1.9rem", fontWeight: 800, lineHeight: 1.2 }}
              >
                My Profile
              </h1>
            </div>

            {error && (
              <div className="mb-4 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-center">
                {success}
              </div>
            )}

            <form onSubmit={handleUpdate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-gray-700"
                  style={{ fontSize: "0.8rem", fontWeight: 600 }}
                >
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400
                             focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white
                             transition-all duration-200"
                  style={{ fontSize: "0.88rem" }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-gray-700"
                  style={{ fontSize: "0.8rem", fontWeight: 600 }}
                >
                  National ID (NID)
                </label>
                <input
                  type="text"
                  value={nid}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                  style={{ fontSize: "0.88rem" }}
                />
                <span className="text-gray-400 text-xs">
                  NID cannot be changed
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-gray-700"
                  style={{ fontSize: "0.8rem", fontWeight: 600 }}
                >
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter current password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400
                               focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white
                               transition-all duration-200"
                    style={{ fontSize: "0.88rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors duration-200"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff style={{ width: "1rem", height: "1rem" }} />
                    ) : (
                      <Eye style={{ width: "1rem", height: "1rem" }} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-gray-700"
                  style={{ fontSize: "0.8rem", fontWeight: 600 }}
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400
                               focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white
                               transition-all duration-200"
                    style={{ fontSize: "0.88rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors duration-200"
                    tabIndex={-1}
                  >
                    {showNewPassword ? (
                      <EyeOff style={{ width: "1rem", height: "1rem" }} />
                    ) : (
                      <Eye style={{ width: "1rem", height: "1rem" }} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-gray-700"
                  style={{ fontSize: "0.8rem", fontWeight: 600 }}
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400
                               focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white
                               transition-all duration-200"
                    style={{ fontSize: "0.88rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors duration-200"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff style={{ width: "1rem", height: "1rem" }} />
                    ) : (
                      <Eye style={{ width: "1rem", height: "1rem" }} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="group mt-1 w-full flex items-center justify-center gap-2.5 px-6 py-3
                           bg-blue-600 hover:bg-blue-700 text-white rounded-xl
                           transition-all duration-200 shadow-lg shadow-blue-200
                           active:scale-[0.98]"
                style={{ fontSize: "0.92rem", fontWeight: 600 }}
              >
                Update Profile
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="group mt-1 w-full flex items-center justify-center gap-2.5 px-6 py-3
                           bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200
                           transition-all duration-200"
                style={{ fontSize: "0.92rem", fontWeight: 600 }}
              >
                <Trash2 style={{ width: "1rem", height: "1rem" }} />
                Delete Account
              </button>
            </form>
          </div>
        </div>

        <p
          className="text-center text-blue-200 mt-4"
          style={{ fontSize: "1rem" }}
        >
          <a
            href="/dashboard"
            className="text-white font-semibold hover:underline"
          >
            Back to Dashboard
          </a>
        </p>
      </div>
    </div>
  );
}

export default Profile;
