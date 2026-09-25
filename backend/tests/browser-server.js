// Isolated, disposable database used only by browser tests. Never loads backend/.env.
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
async function main() {
  const storage = await fs.mkdtemp(
    path.join(os.tmpdir(), "zerotrust-browser-"),
  );
  const mongo = await MongoMemoryServer.create();
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = crypto.randomBytes(48).toString("hex");
  process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString("hex");
  process.env.ENCRYPTED_STORAGE_PATH = storage;
  process.env.APP_ORIGIN = "http://127.0.0.1:5101";
  await mongoose.connect(mongo.getUri());
  const app = require("../src/app");
  const server = app.listen(5101, "127.0.0.1", () =>
    console.log("Isolated browser test server ready"),
  );
  const stop = () =>
    server.close(async () => {
      await mongoose.disconnect();
      await mongo.stop();
      if (
        path.dirname(storage) === os.tmpdir() &&
        path.basename(storage).startsWith("zerotrust-browser-")
      )
        await fs.rm(storage, { recursive: true, force: true });
      process.exit(0);
    });
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
