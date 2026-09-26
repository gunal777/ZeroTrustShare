// Isolated, disposable database used only by browser tests. Never loads backend/.env.
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const crypto = require("node:crypto");
const { Readable } = require("node:stream");
const { mockClient } = require("aws-sdk-client-mock");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

async function main() {
  const mongo = await MongoMemoryServer.create();
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = crypto.randomBytes(48).toString("hex");
  process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString("hex");
  process.env.APP_ORIGIN = "http://127.0.0.1:5101";

  // Dummy AWS config: storage.service.js needs these to construct its
  // S3Client, but every call is intercepted below by an in-memory fake
  // bucket, so browser tests never touch real AWS.
  process.env.AWS_REGION = "us-east-1";
  process.env.AWS_ACCESS_KEY_ID = "test";
  process.env.AWS_SECRET_ACCESS_KEY = "test";
  process.env.AWS_S3_BUCKET_NAME = "test-bucket";

  const s3Store = new Map();
  const s3Mock = mockClient(S3Client);
  s3Mock.on(PutObjectCommand).callsFake((input) => {
    s3Store.set(input.Key, Buffer.from(input.Body));
    return {};
  });
  s3Mock.on(GetObjectCommand).callsFake((input) => {
    const body = s3Store.get(input.Key);
    if (!body) {
      const error = new Error("The specified key does not exist.");
      error.name = "NoSuchKey";
      throw error;
    }
    return { Body: Readable.from(body) };
  });
  s3Mock.on(DeleteObjectCommand).callsFake((input) => {
    s3Store.delete(input.Key);
    return {};
  });

  await mongoose.connect(mongo.getUri());
  const app = require("../src/app");
  const server = app.listen(5101, "127.0.0.1", () =>
    console.log("Isolated browser test server ready"),
  );
  const stop = () =>
    server.close(async () => {
      s3Mock.restore();
      await mongoose.disconnect();
      await mongo.stop();
      process.exit(0);
    });
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});