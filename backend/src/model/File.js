const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
      trim: true
      },

    storedName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    mimeType: {
      type: String,
      required: true,
      trim: true,
    },

    size: {
      type: Number,
      required: true,
      min: 0,
    },

    storagePath: {
      type: String,
      required: true,
      trim: true,
    },

    encryptionStatus: {
      type: String,
      enum: ["encrypted", "unencrypted"],
      default: "encrypted"
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    }
  }, 
  {
    timestamps: true,
  }
);

const File = mongoose.model("File", fileSchema);

module.exports = File;