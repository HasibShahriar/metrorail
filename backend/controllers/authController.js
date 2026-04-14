const bcrypt = require("bcrypt");
const {
  findUserByNid,
  createUser,
  updateUser,
  deleteUser,
} = require("../models/passengerModel");
const generateToken = require("../utils/generateToken");

// User registration: handles password hashing and prevents duplicate NIDs
const register = async (req, res) => {
  try {
    const { name, nid, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    await createUser(name, nid, hashed);
    res.json({ message: "registered" });
  } catch (err) {
    if (err.message && err.message.includes("Violation of UNIQUE KEY")) {
      return res
        .status(409)
        .json({ message: "An account with this NID already exists." });
    }
    res.status(500).json({ message: "Registration failed. Please try again." });
  }
};

const login = async (req, res) => {
  try {
    const { nid, password } = req.body;
    const user = await findUserByNid(nid);
    if (!user)
      return res.status(401).json({ message: "Invalid NID or password." });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ message: "Invalid NID or password." });
    const token = generateToken(user);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Login failed. Please try again." });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, password, newPassword } = req.body;
    const nid = req.user.nid;
    const user = await findUserByNid(nid);
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res
        .status(401)
        .json({ message: "Current password is incorrect." });
    const hashed = await bcrypt.hash(newPassword, 10);
    await updateUser(name, hashed, nid);
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile" });
  }
};

const deleteProfile = async (req, res) => {
  try {
    const nid = req.user.nid;
    await deleteUser(nid);
    res.json({ message: "Profile deleted successfully" });
  } catch (err) {
    console.error("Delete profile error:", err);
    res
      .status(500)
      .json({ message: err.message || "Failed to delete profile" });
  }
};

module.exports = { register, login, updateProfile, deleteProfile };
