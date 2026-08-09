const mongoose = require("mongoose");

const shareLinkSchema = new mongoose.Schema(
  {
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (document, returnedObject) => {
        delete returnedObject.passwordHash;
        delete returnedObject.__v;
        return returnedObject;
      },
    },
  },
);

const ShareLink = mongoose.model("ShareLink", shareLinkSchema);

module.exports = ShareLink;
