const express = require("express")
const router = express.Router()
const verifyToken = require("../middleware/authMiddleware") // import auth middleware if not already
const { register, login } = require("../controllers/authController")
const { findUserByNid } = require("../models/passengerModel")  // or getById if you store id in JWT


router.post("/register", register)
router.post("/login", login)

router.get("/profile", verifyToken, async (req, res) => {
    try {
        const nid = req.user.nid   // assuming JWT contains email
        const user = await findUserByNid(nid)
        res.json({ user })             // now sends full user info
    } catch (err) {
        res.status(500).json({ error: "Server error" })
    }
})

module.exports = router