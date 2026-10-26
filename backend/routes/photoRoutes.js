
const express = require("express");
const mongoose = require("mongoose");
const Photo = require("../models/Photo");
const admin = require("../firebaseAdmin");

const router = express.Router();

// Verify the Firebase ID token sent by the frontend.
async function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Login required. Please sign in first.",
    });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      message: "Authentication token is missing.",
    });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    return next();
  } catch (error) {
    console.error("Firebase token verification failed:", error.message);

    return res.status(401).json({
      message: "Invalid or expired login session. Please sign in again.",
    });
  }
}

function isValidImageUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/photos — public gallery.
router.get("/", async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};

    if (typeof search === "string" && search.trim()) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), "i");

      filter.$or = [
        { title: searchRegex },
        { category: searchRegex },
        { description: searchRegex },
      ];
    }

    if (typeof category === "string" && category.trim()) {
      filter.category = {
        $regex: `^${escapeRegex(category.trim())}$`,
        $options: "i",
      };
    }

    const photos = await Photo.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(photos);
  } catch (error) {
    console.error("Fetch photos error:", error.message);
    return res.status(500).json({ message: "Failed to fetch photos" });
  }
});

// GET /api/photos/:id — public photo details.
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid photo ID" });
    }

    const photo = await Photo.findById(id);

    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }

    return res.status(200).json(photo);
  } catch (error) {
    console.error("Get photo error:", error.message);
    return res.status(500).json({ message: "Failed to fetch photo" });
  }
});

// POST /api/photos — login required.
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, imageUrl, category, description } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "Photo title is required" });
    }

    if (title.trim().length > 150) {
      return res.status(400).json({
        message: "Photo title cannot exceed 150 characters",
      });
    }

    if (!isValidImageUrl(imageUrl)) {
      return res.status(400).json({
        message: "Please provide a valid HTTP or HTTPS imageUrl",
      });
    }

    if (category !== undefined && typeof category !== "string") {
      return res.status(400).json({ message: "Category must be text" });
    }

    if (description !== undefined && typeof description !== "string") {
      return res.status(400).json({ message: "Description must be text" });
    }

    const cleanCategory =
      typeof category === "string" && category.trim()
        ? category.trim()
        : "Other";

    const cleanDescription =
      typeof description === "string" ? description.trim() : "";

    if (cleanCategory.length > 80) {
      return res.status(400).json({
        message: "Category cannot exceed 80 characters",
      });
    }

    if (cleanDescription.length > 1000) {
      return res.status(400).json({
        message: "Description cannot exceed 1000 characters",
      });
    }

    const photo = await Photo.create({
      title: title.trim(),
      imageUrl: imageUrl.trim(),
      category: cleanCategory,
      description: cleanDescription,
    });

    return res.status(201).json({
      message: "Photo added successfully",
      photo,
    });
  } catch (error) {
    console.error("Add photo error:", error.message);

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Failed to add photo" });
  }
});

// PUT /api/photos/:id — login required.
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid photo ID" });
    }

    const allowedFields = ["title", "imageUrl", "category", "description"];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] !== "string") {
          return res.status(400).json({
            message: `${field} must be text`,
          });
        }

        updates[field] = req.body[field].trim();
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Please provide at least one field to update",
      });
    }

    if (updates.title !== undefined) {
      if (!updates.title) {
        return res.status(400).json({
          message: "Photo title cannot be empty",
        });
      }

      if (updates.title.length > 150) {
        return res.status(400).json({
          message: "Photo title cannot exceed 150 characters",
        });
      }
    }

    if (
      updates.imageUrl !== undefined &&
      !isValidImageUrl(updates.imageUrl)
    ) {
      return res.status(400).json({
        message: "Please provide a valid HTTP or HTTPS imageUrl",
      });
    }

    if (updates.category !== undefined && updates.category.length > 80) {
      return res.status(400).json({
        message: "Category cannot exceed 80 characters",
      });
    }

    if (
      updates.description !== undefined &&
      updates.description.length > 1000
    ) {
      return res.status(400).json({
        message: "Description cannot exceed 1000 characters",
      });
    }

    const photo = await Photo.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }

    return res.status(200).json({
      message: "Photo updated successfully",
      photo,
    });
  } catch (error) {
    console.error("Update photo error:", error.message);
    return res.status(500).json({ message: "Failed to update photo" });
  }
});

// DELETE /api/photos/:id — login required.
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid photo ID" });
    }

    const photo = await Photo.findByIdAndDelete(id);

    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }

    return res.status(200).json({
      message: "Photo deleted successfully",
      photo,
    });
  } catch (error) {
    console.error("Delete photo error:", error.message);
    return res.status(500).json({ message: "Failed to delete photo" });
  }
});

module.exports = router;
