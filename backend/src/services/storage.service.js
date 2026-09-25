const fs = require("fs/promises");
const path = require("path");

const backendRoot = path.resolve(__dirname, "../..");

const getStorageRoot = () => {
  const configuredPath = process.env.ENCRYPTED_STORAGE_PATH;

  return configuredPath
    ? path.resolve(backendRoot, configuredPath)
    : path.join(backendRoot, "storage", "encrypted");
};

const isInsideDirectory = (filePath, directory) => {
  const normalizedFile = path.normalize(filePath);
  const normalizedDir = path.normalize(directory);
  return (
    normalizedFile.startsWith(`${normalizedDir}${path.sep}`) ||
    normalizedFile === normalizedDir
  );
};

const resolveStoredPath = (storagePath) => {
  if (!storagePath || typeof storagePath !== "string") {
    throw new Error("A storage path is required.");
  }

  const storageRoot = getStorageRoot();
  const resolvedPath = path.isAbsolute(storagePath)
    ? path.resolve(storagePath)
    : path.resolve(backendRoot, storagePath);

  if (!isInsideDirectory(resolvedPath, storageRoot)) {
    throw new Error(
      "The storage path is outside the encrypted storage directory.",
    );
  }

  return resolvedPath;
};

const storeFile = async (encryptedBuffer, storedName) => {
  if (!Buffer.isBuffer(encryptedBuffer)) {
    throw new TypeError("Encrypted file content must be a Buffer.");
  }

  if (
    !storedName ||
    storedName === "." ||
    storedName === ".." ||
    path.basename(storedName) !== storedName
  ) {
    throw new Error("A safe stored file name is required.");
  }

  const storageRoot = getStorageRoot();
  const targetPath = path.join(storageRoot, storedName);

  await fs.mkdir(storageRoot, { recursive: true });
  await fs.writeFile(targetPath, encryptedBuffer, { flag: "wx", mode: 0o600 });

  const relativePath = path.relative(backendRoot, targetPath);
  return relativePath.startsWith("..") ? targetPath : relativePath;
};

const readFile = async (storagePath) =>
  fs.readFile(resolveStoredPath(storagePath));

const deleteFile = async (storagePath) => {
  try {
    await fs.unlink(resolveStoredPath(storagePath));
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
};

module.exports = {
  storeFile,
  readFile,
  deleteFile,
};
