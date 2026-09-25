const path = require("node:path");
require("dotenv").config({
  path: [
    path.resolve(__dirname, "../.env.local"),
    path.resolve(__dirname, "../.env"),
  ],
  quiet: true,
});
const mongoose = require("mongoose");
const validateEnv = require("./config/env");
const connectDB = require("./config/db");

async function start() {
  validateEnv();
  await connectDB();
  const app = require("./app");
  const port = Number(process.env.PORT || 5000);
  const server = app.listen(port, process.env.HOST || "0.0.0.0", () =>
    console.log("ZeroTrust API listening on port " + port),
  );
  server.on("error", () => {
    console.error("Unable to start HTTP server. Check the configured port.");
    process.exitCode = 1;
    mongoose.disconnect();
  });
  const shutdown = () => {
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}
start().catch((error) => {
  console.error(
    "Startup failed: " +
      (error.name.startsWith("Mongo")
        ? "Database connection failed. Check URI and network access."
        : error.message),
  );
  process.exitCode = 1;
});
