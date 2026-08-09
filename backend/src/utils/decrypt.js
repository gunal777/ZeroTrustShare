const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const FILE_HEADER = Buffer.from("ZTS1");
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const METADATA_LENGTH = FILE_HEADER.length + IV_LENGTH + AUTH_TAG_LENGTH;

const decrypt = (encryptedBuffer, key) => {
  if (!Buffer.isBuffer(encryptedBuffer)) {
    throw new TypeError("The encrypted file content must be a Buffer.");
  }

  if (!Buffer.isBuffer(key) || key.length !== 32) {
    throw new Error("AES-256-GCM requires a 32-byte encryption key.");
  }

  if (
    encryptedBuffer.length < METADATA_LENGTH ||
    !encryptedBuffer.subarray(0, FILE_HEADER.length).equals(FILE_HEADER)
  ) {
    throw new Error("The encrypted file has an invalid format.");
  }

  const ivStart = FILE_HEADER.length;
  const authTagStart = ivStart + IV_LENGTH;
  const ciphertextStart = authTagStart + AUTH_TAG_LENGTH;
  const iv = encryptedBuffer.subarray(ivStart, authTagStart);
  const authTag = encryptedBuffer.subarray(authTagStart, ciphertextStart);
  const ciphertext = encryptedBuffer.subarray(ciphertextStart);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
};

module.exports = decrypt;
