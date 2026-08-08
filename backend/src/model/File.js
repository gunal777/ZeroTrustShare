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
      unique: true
    },

    mimeType: {
      type: String,
      required: true
    },

    size: {
      type: Number,
      required: true
    },

    storagePath: {
      type: String,
      required: true
    },

    encryptionStatus: {
      type: String,
      enum: ["encrypted", "unencrypted"],
      default: "encrypted"
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  }, 
  {
    timestamps: true
  }
);

const File = mongoose.model("File", fileSchema);

module.exports = File;