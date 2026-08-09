const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const FILE_HEADER = Buffer.from("ZTS1");
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

const encrypt = (plainBuffer, key) => {
  if (!Buffer.isBuffer(plainBuffer)) {
    throw new TypeError("The file content to encrypt must be a Buffer.");
  }

  if (!Buffer.isBuffer(key) || key.length !== 32) {
    throw new Error("AES-256-GCM requires a 32-byte encryption key.");
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plainBuffer),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([FILE_HEADER, iv, authTag, ciphertext]);
};

module.exports = encrypt;
