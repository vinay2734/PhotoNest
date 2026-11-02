
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

// Check Firebase environment variables without showing secret values
console.log("Firebase Environment Check:", {
  FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
  MONGO_URI: !!process.env.MONGO_URI,
});

// Load routes after environment variables
const photoRoutes = require("./routes/photoRoutes");

const app = express();

// CORS settings
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://photonest-frontend.onrender.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));

// Backend test route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "PhotoNest backend is running successfully!",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

// Photo APIs
app.use("/api/photos", photoRoutes);

// Unknown route handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// Start server
async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from Render Environment.");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully!");
    console.log("Database name:", mongoose.connection.name);

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`PhotoNest server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup error:", error.message);
    process.exit(1);
  }
}

startServer();
