const crypto = require("crypto");
const File = require("../model/File");
const encryptionService = require("./encryption.service");
const storageService = require("./storage.service");

const uploadFile = async (fileData, ownerId) => {
  if (!fileData || !Buffer.isBuffer(fileData.buffer)) {
    throw new Error("A file buffer is required for upload.");
  }

  const storedName = `${crypto.randomUUID()}.enc`;
  const encryptedBuffer = encryptionService.encryptFile(fileData.buffer);
  const storagePath = await storageService.storeFile(
    encryptedBuffer,
    storedName,
  );

  try {
    const metadata = {
      originalName: fileData.originalname,
      storedName,
      mimeType: fileData.mimetype,
      size: fileData.size,
      storagePath,
      encryptionStatus: "encrypted",
    };

    if (ownerId) {
      metadata.owner = ownerId;
    }

    return await File.create(metadata);
  } catch (error) {
    await storageService.deleteFile(storagePath);
    throw error;
  }
};

const getFiles = async (ownerId) => {
  const filter = ownerId ? { owner: ownerId } : {};
  return File.find(filter).sort({ createdAt: -1 });
};

const getFile = async (fileId) => File.findById(fileId);

const downloadFile = async (fileId) => {
  const file = await File.findById(fileId);

  if (!file) {
    return null;
  }

  const encryptedBuffer = await storageService.readFile(file.storagePath);
  const buffer = encryptionService.decryptFile(encryptedBuffer);

  return { file, buffer };
};

const deleteFile = async (fileId) => {
  const file = await File.findById(fileId);

  if (!file) {
    return null;
  }

  await storageService.deleteFile(file.storagePath);
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
