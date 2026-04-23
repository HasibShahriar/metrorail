require("dotenv").config()

const express = require("express")
const cors = require("cors")
const http = require("http")
const { Server } = require("socket.io")

const authRoutes = require("./routes/authRoutes")
const featureRoutes = require("./routes/featureRoutes")

const app = express()

const server = http.createServer(app)
const io = new Server(server, {
    cors: { origin: ["http://localhost:3000", "http://127.0.0.1:3000"] }
})

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
});

app.set("io", io)

app.use(cors({ origin: ["http://localhost:3000", "http://127.0.0.1:3000"] }))
app.use(express.json())

app.use("/api/auth", authRoutes)
app.use("/api/features", featureRoutes)

server.listen(5000, () => {
    console.log("Server running on port 5000")
})