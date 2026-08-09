const encrypt = require("../utils/encrypt");
const decrypt = require("../utils/decrypt");

const getEncryptionKey = () => {
  const configuredKey = process.env.ENCRYPTION_KEY;

  if (!configuredKey) {
    throw new Error("ENCRYPTION_KEY is not configured.");
  }

  const encoding = /^[a-f\d]{64}$/i.test(configuredKey) ? "hex" : "base64";
  const key = Buffer.from(configuredKey, encoding);

  if (key.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must be 32 bytes encoded as 64 hex characters or Base64.",
    );
  }

  return key;
};

const encryptFile = (plainBuffer) => encrypt(plainBuffer, getEncryptionKey());

const decryptFile = (encryptedBuffer) =>
  decrypt(encryptedBuffer, getEncryptionKey());

module.exports = {
  encryptFile,
  decryptFile,
};
