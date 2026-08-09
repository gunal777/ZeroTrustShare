const crypto = require("crypto");

const generateShareId = () => crypto.randomBytes(24).toString("base64url");

module.exports = generateShareId;
