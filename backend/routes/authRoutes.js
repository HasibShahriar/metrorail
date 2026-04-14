const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
  register,
  login,
  updateProfile,
  deleteProfile,
} = require("../controllers/authController");
const { findUserByNid } = require("../models/passengerModel");

router.post("/register", register);
router.post("/login", login);

router.get("/profile", verifyToken, async (req, res) => {
  try {
    const nid = req.user.nid;
    const user = await findUserByNid(nid);
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/profile", verifyToken, updateProfile);
router.delete("/profile", verifyToken, deleteProfile);

module.exports = router;
