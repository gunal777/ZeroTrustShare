const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET_NAME;

const storeFile = async (encryptedBuffer, storedName) => {
  if (!Buffer.isBuffer(encryptedBuffer)) {
    throw new TypeError("Encrypted file content must be a Buffer.");
  }

  if (!storedName || typeof storedName !== "string") {
    throw new Error("A valid stored file key is required.");
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: storedName,
    Body: encryptedBuffer,
    ContentType: "application/octet-stream",
  });

  await s3.send(command);

  // Return the S3 object key so it gets saved to MongoDB storagePath
  return storedName;
};

const readFile = async (storedName) => {
  if (!storedName || typeof storedName !== "string") {
    throw new Error("A valid storage key is required.");
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: storedName,
  });

  const response = await s3.send(command);

  // Convert the S3 incoming stream directly into a Buffer for decryption
  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
};

const deleteFile = async (storedName) => {
  if (!storedName || typeof storedName !== "string") {
    return false;
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: storedName,
    });

    await s3.send(command);
    return true;
  } catch (error) {
    if (error.name === "NoSuchKey") {
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