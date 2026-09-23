const bcrypt = require("bcryptjs");
const File = require("../model/File");
const ShareLink = require("../model/ShareLink");
const generateShareId = require("../utils/generateShareId");

const DEFAULT_EXPIRY_MS = 24 * 60 * 60 * 1000;

const createServiceError = (message, code, statusCode = 400) => {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
};

const createShareLink = async ({ fileId, password, expiresAt, ownerId, allowDownload = false }) => {
  if (!ownerId) {
    throw createServiceError("Owner authentication is required.", "UNAUTHORIZED", 401);
  }

  const file = await File.findOne({ _id: fileId, owner: ownerId });
  if (!file) {
    throw createServiceError("File not found or access denied.", "FILE_NOT_FOUND", 404);
  }

  const expiryDate = expiresAt
    ? new Date(expiresAt)
    : new Date(Date.now() + DEFAULT_EXPIRY_MS);

  if (Number.isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
    throw createServiceError(
      "Share-link expiry must be a valid future date.",
      "INVALID_EXPIRY",
      400
    );
  }

  const shareData = {
    file: fileId,
    token: generateShareId(),
    expiresAt: expiryDate,
    createdBy: ownerId,
    allowDownload: Boolean(allowDownload),
  };

  if (password) {
    if (typeof password !== "string" || password.trim().length < 4) {
      throw createServiceError(
        "Share password must be at least 4 characters long.",
        "INVALID_PASSWORD",
        400
      );
    }
    shareData.passwordHash = await bcrypt.hash(password, 12);
  }

  return ShareLink.create(shareData);
};

const accessShareLink = async (token, password) => {
  const shareLink = await ShareLink.findOne({ token, isRevoked: false })
    .select("+passwordHash")
    .populate("file");

  if (!shareLink) {
    throw createServiceError("Share link not found or revoked.", "LINK_NOT_FOUND", 404);
  }

  if (shareLink.expiresAt <= new Date()) {
    throw createServiceError("Share link has expired.", "LINK_EXPIRED", 410);
  }

  if (shareLink.passwordHash) {
    const passwordMatches =
      typeof password === "string" &&
      (await bcrypt.compare(password, shareLink.passwordHash));

    if (!passwordMatches) {
      throw createServiceError(
        "A valid share-link password is required.",
        "INVALID_PASSWORD",
        401,
      );
    }
  }

  // Increment access count
  shareLink.accessCount = (shareLink.accessCount || 0) + 1;
  await shareLink.save();

  return shareLink;
};

const revokeShareLink = async (token, ownerId) => {
  const query = { token, isRevoked: false };
  if (ownerId) {
    query.createdBy = ownerId;
  }

  return ShareLink.findOneAndUpdate(
    query,
    { isRevoked: true },
    { new: true },
  );
};

module.exports = {
  createShareLink,
  accessShareLink,
  revokeShareLink,
};