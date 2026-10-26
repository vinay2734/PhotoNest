const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const photoRoutes = require("./routes/photoRoutes");

const app = express();

// Middleware: allow requests from the local Vite frontend.
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  })
);

app.use(express.json({ limit: "1mb" }));

// Check whether the backend is running.
app.get("/", (req, res) => {
  res.status(200).json({
    message: "PhotoNest backend is running successfully!",
    database: mongoose.connection.readyState === 1
      ? "connected"
      : "disconnected",
  });
});

// Photo CRUD APIs.
app.use("/api/photos", photoRoutes);

// Handle unknown routes.
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// Connect to MongoDB before starting the API server.
async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is missing from backend/.env"
      );
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully!");
    console.log("Database name:", mongoose.connection.name);

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(
        `PhotoNest server running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Server startup error:", error.message);
    process.exit(1);
  }
}

startServer();