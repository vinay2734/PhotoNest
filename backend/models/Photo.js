const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Photo title is required"],
      trim: true,
      maxlength: 150,
    },

    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
      validate: {
        validator: function (value) {
          try {
            const url = new URL(value);
            return (
              url.protocol === "http:" ||
              url.protocol === "https:"
            );
          } catch {
            return false;
          }
        },
        message: "Image URL must use HTTP or HTTPS",
      },
    },

    category: {
      type: String,
      default: "Other",
      trim: true,
      maxlength: 80,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Photo", photoSchema);