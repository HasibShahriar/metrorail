const bcrypt = require("bcrypt")
const { findUserByNid, createUser } = require("../models/passengerModel")
const generateToken = require("../utils/generateToken")

// User registration: handles password hashing and prevents duplicate NIDs
const register = async (req, res) => {
    try {
        const { name, nid, password } = req.body
        const hashed = await bcrypt.hash(password, 10)
        await createUser(name, nid, hashed)
        res.json({ message: "registered" })
    } catch (err) {
        if (err.message && err.message.includes("Violation of UNIQUE KEY")) {
            return res.status(409).json({ message: "An account with this NID already exists." })
        }
        res.status(500).json({ message: "Registration failed. Please try again." })
    }
}

const login = async (req, res) => {
    try {
        const { nid, password } = req.body
        const user = await findUserByNid(nid)
        if (!user) return res.status(401).json({ message: "Invalid NID or password." })
        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return res.status(401).json({ message: "Invalid NID or password." })
        const token = generateToken(user)
        res.json({ token })
    } catch (err) {
        res.status(500).json({ message: "Login failed. Please try again." })
    }
}

module.exports = { register, login }