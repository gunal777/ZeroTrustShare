const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

module.exports = function validateEnv() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required.");
  const key = process.env.ENCRYPTION_KEY || "";
  if (
    Buffer.from(key, /^[a-f\d]{64}$/i.test(key) ? "hex" : "base64").length !==
    32
  ) {
    throw new Error("ENCRYPTION_KEY must encode exactly 32 bytes.");
  }
  if (!process.env.JWT_SECRET && process.env.NODE_ENV !== "production") {
    const secretPath = path.resolve(__dirname, "../../.local-jwt-secret");
    try {
      fs.writeFileSync(secretPath, crypto.randomBytes(48).toString("hex"), {
        flag: "wx",
        mode: 0o600,
      });
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
    process.env.JWT_SECRET = fs.readFileSync(secretPath, "utf8").trim();
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
    throw new Error("JWT_SECRET must contain at least 32 characters.");
  if (process.env.NODE_ENV === "production" && !process.env.APP_ORIGIN)
    throw new Error(
      "APP_ORIGIN must be the public HTTPS origin in production.",
    );
  if (process.env.APP_ORIGIN) {
    const origin = new URL(process.env.APP_ORIGIN);
    if (
      origin.origin !== process.env.APP_ORIGIN ||
      (process.env.NODE_ENV === "production" && origin.protocol !== "https:")
    ) {
      throw new Error(
        "APP_ORIGIN must be an origin without a trailing slash (HTTPS in production).",
      );
    }
  }
};
