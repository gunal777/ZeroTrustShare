const bcrypt = require("bcryptjs");
const File = require("../model/File");
const ShareLink = require("../model/ShareLink");
const generateShareId = require("../utils/generateShareId");

const DEFAULT_EXPIRY_MS = 24 * 60 * 60 * 1000;

const createServiceError = (message, code) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

const createShareLink = async ({ fileId, password, expiresAt, ownerId }) => {
  const fileExists = await File.exists({ _id: fileId });

  if (!fileExists) {
    throw createServiceError("File not found.", "FILE_NOT_FOUND");
  }

  const expiryDate = expiresAt
    ? new Date(expiresAt)
    : new Date(Date.now() + DEFAULT_EXPIRY_MS);

  if (Number.isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
    throw createServiceError(
      "Share-link expiry must be a valid future date.",
      "INVALID_EXPIRY",
    );
  }

  const shareData = {
    file: fileId,
    token: generateShareId(),
    expiresAt: expiryDate,
  };

  if (password) {
    shareData.passwordHash = await bcrypt.hash(password, 12);
  }

  if (ownerId) {
    shareData.owner = ownerId;
  }

  return ShareLink.create(shareData);
};

const accessShareLink = async (token, password) => {
  const shareLink = await ShareLink.findOne({ token, isRevoked: false })
    .select("+passwordHash")
    .populate("file");

  if (!shareLink) {
    throw createServiceError("Share link not found or revoked.", "LINK_NOT_FOUND");
  }

  if (shareLink.expiresAt <= new Date()) {
    throw createServiceError("Share link has expired.", "LINK_EXPIRED");
  }

  if (shareLink.passwordHash) {
    const passwordMatches =
      typeof password === "string" &&
      (await bcrypt.compare(password, shareLink.passwordHash));

    if (!passwordMatches) {
      throw createServiceError(
        "A valid share-link password is required.",
        "INVALID_PASSWORD",
      );
    }
  }

  return shareLink;
};

const revokeShareLink = async (token) =>
  ShareLink.findOneAndUpdate(
    { token, isRevoked: false },
    { isRevoked: true },
    { new: true },
  );

module.exports = {
  createShareLink,
  accessShareLink,
  revokeShareLink,
};
