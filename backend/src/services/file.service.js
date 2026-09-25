const crypto = require("crypto");
const File = require("../model/File");
const ShareLink = require("../model/ShareLink");
const encryptionService = require("./encryption.service");
const storageService = require("./storage.service");

const FILE_PUBLIC_FIELDS = "-storagePath -storedName -__v";

const createServiceError = (message, code, statusCode = 400) => {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
};

const uploadFile = async (fileData, ownerId) => {
  if (!fileData || !Buffer.isBuffer(fileData.buffer)) {
    throw createServiceError(
      "A file buffer is required for upload.",
      "INVALID_FILE",
    );
  }

  if (!ownerId) {
    throw createServiceError("Owner ID is required.", "UNAUTHORIZED", 401);
  }

  const storedName = `${crypto.randomUUID()}.enc`;
  const encryptedBuffer = encryptionService.encryptFile(fileData.buffer);
  const storagePath = await storageService.storeFile(
    encryptedBuffer,
    storedName,
  );

  try {
    const fileRecord = await File.create({
      originalName: fileData.originalname,
      storedName,
      mimeType: fileData.mimetype,
      size: fileData.size,
      storagePath,
      encryptionStatus: "encrypted",
      owner: ownerId,
    });

    return fileRecord;
  } catch (error) {
    await storageService.deleteFile(storagePath);
    throw error;
  }
};

const getFiles = async (ownerId) => {
  if (!ownerId) {
    throw createServiceError("Owner ID is required.", "UNAUTHORIZED", 401);
  }
  return File.find({ owner: ownerId })
    .select(FILE_PUBLIC_FIELDS)
    .sort({ createdAt: -1 });
};

const getFile = async (fileId, ownerId) => {
  if (!ownerId)
    throw createServiceError(
      "Owner authentication is required.",
      "UNAUTHORIZED",
      401,
    );
  const query = { _id: fileId };
  if (ownerId) query.owner = ownerId;
  return File.findOne(query).select(FILE_PUBLIC_FIELDS);
};

// Note: ownerId is optional here because public share links also call downloadFile
const downloadFile = async (fileId, ownerId) => {
  const query = { _id: fileId };
  if (ownerId) query.owner = ownerId;

  const file = await File.findOne(query);

  if (!file) {
    return null;
  }

  const encryptedBuffer = await storageService.readFile(file.storagePath);
  const buffer = encryptionService.decryptFile(encryptedBuffer);

  return { file, buffer };
};

const deleteFile = async (fileId, ownerId) => {
  if (!ownerId)
    throw createServiceError(
      "Owner authentication is required.",
      "UNAUTHORIZED",
      401,
    );
  const query = { _id: fileId };
  if (ownerId) query.owner = ownerId;

  const file = await File.findOne(query);

  if (!file) {
    return null;
  }

  await storageService.deleteFile(file.storagePath);
  await ShareLink.deleteMany({ file: file._id });
  await file.deleteOne();

  return file;
};

module.exports = {
  uploadFile,
  getFiles,
  getFile,
  downloadFile,
  deleteFile,
};
