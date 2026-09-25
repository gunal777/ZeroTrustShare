const bcrypt = require("bcryptjs");
const File = require("../model/File");
const ShareLink = require("../model/ShareLink");
const generateShareId = require("../utils/generateShareId");
const fail = (message, code, statusCode = 400) =>
  Object.assign(new Error(message), { code, statusCode });
const publicLink = (link) => {
  const data = link.toObject ? link.toObject() : { ...link };
  data.isPasswordProtected = Boolean(data.passwordHash);
  delete data.passwordHash;
  delete data.__v;
  return data;
};
exports.createShareLink = async ({
  fileId,
  password,
  expiresAt,
  ownerId,
  allowDownload = true,
}) => {
  if (!ownerId) throw fail("Please sign in.", "UNAUTHENTICATED", 401);
  if (typeof fileId !== "string" || !/^[a-f\d]{24}$/i.test(fileId))
    throw fail("A valid file ID is required.", "INVALID_FILE");
  if (typeof allowDownload !== "boolean")
    throw fail(
      "Download permission must be true or false.",
      "INVALID_PERMISSION",
    );
  const file = await File.findOne({ _id: fileId, owner: ownerId });
  if (!file) throw fail("File not found.", "FILE_NOT_FOUND", 404);
  if (
    !allowDownload &&
    !["application/pdf", "text/plain"].includes(file.mimeType)
  )
    throw fail(
      "Word documents require download permission; use PDF or TXT for preview-only links.",
      "PREVIEW_UNAVAILABLE",
    );
  const expiryDate = expiresAt
    ? new Date(expiresAt)
    : new Date(Date.now() + 86400000);
  if (
    Number.isNaN(expiryDate.getTime()) ||
    expiryDate <= new Date() ||
    expiryDate.getTime() > Date.now() + 30 * 86400000 + 1000
  )
    throw fail("Choose an expiry between now and 30 days.", "INVALID_EXPIRY");
  let passwordHash = null;
  if (password !== undefined && password !== "") {
    if (
      typeof password !== "string" ||
      password.length < 4 ||
      Buffer.byteLength(password) > 72
    )
      throw fail(
        "Share passwords must be 4 characters or more, up to 72 bytes.",
        "INVALID_PASSWORD",
      );
    passwordHash = await bcrypt.hash(password, 12);
  }
  return publicLink(
    await ShareLink.create({
      file: fileId,
      token: generateShareId(),
      expiresAt: expiryDate,
      createdBy: ownerId,
      allowDownload,
      passwordHash,
    }),
  );
};
exports.listShareLinks = async (ownerId) => {
  const links = await ShareLink.find({ createdBy: ownerId })
    .select("+passwordHash")
    .populate("file", "originalName size mimeType")
    .sort({ createdAt: -1 });
  return links.map(publicLink);
};
exports.findLink = async (token) => {
  if (!/^[a-zA-Z0-9_-]{32}$/.test(token))
    throw fail("Share link not found.", "LINK_NOT_FOUND", 404);
  const link = await ShareLink.findOne({ token })
    .select("+passwordHash")
    .populate("file");
  if (!link) throw fail("Share link not found.", "LINK_NOT_FOUND", 404);
  if (link.isRevoked || link.expiresAt <= new Date())
    throw fail("This link has expired or was revoked.", "LINK_EXPIRED", 410);
  if (!link.file)
    throw fail("The shared file no longer exists.", "FILE_NOT_FOUND", 404);
  return link;
};
exports.accessShareLink = async (token, password) => {
  const link = await exports.findLink(token);
  if (
    link.passwordHash &&
    (typeof password !== "string" ||
      Buffer.byteLength(password) > 72 ||
      !(await bcrypt.compare(password, link.passwordHash)))
  )
    throw fail(
      "The password is incorrect. Please try again.",
      "INVALID_PASSWORD",
      401,
    );
  return link;
};
exports.recordAccess = (id) =>
  ShareLink.updateOne({ _id: id }, { $inc: { accessCount: 1 } });
exports.revokeShareLink = async (token, ownerId) => {
  if (!ownerId) throw fail("Please sign in.", "UNAUTHENTICATED", 401);
  const link = await ShareLink.findOneAndUpdate(
    { token, createdBy: ownerId },
    { isRevoked: true },
    { returnDocument: "after" },
  );
  if (!link) throw fail("Share link not found.", "LINK_NOT_FOUND", 404);
  return link;
};
