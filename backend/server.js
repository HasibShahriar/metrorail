require("dotenv").config()

const express = require("express")
const cors = require("cors")

const authRoutes = require("./routes/authRoutes")
const featureRoutes = require("./routes/featureRoutes")

const app = express()

// Restrict CORS to the React dev server only
app.use(cors({ origin: ["http://localhost:3000", "http://127.0.0.1:3000"] }))
app.use(express.json())

app.use("/api/auth", authRoutes)
app.use("/api/features", featureRoutes)

app.listen(5000, () => {
    console.log("Server running on port 5000")
})