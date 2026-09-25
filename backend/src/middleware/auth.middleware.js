const jwt = require("jsonwebtoken");
const User = require("../model/User");
const { COOKIE_NAME } = require("../config/session");

module.exports = async (req, res, next) => {
  const cookie = (req.headers.cookie || "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(COOKIE_NAME + "="));

  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : cookie?.slice(COOKIE_NAME.length + 1);

  let payload;

  try {
    payload = jwt.verify(token || "", process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "zerotrust-vault",
      audience: "zerotrust-app",
    });
  } catch {
    return res.status(401).json({
      success: false,
      message: "Your session has expired. Please sign in.",
      code: "UNAUTHENTICATED",
    });
  }

  const user = await User.findById(payload.id).select("+tokenVersion");

  if (!user || (user.tokenVersion || 0) !== payload.version) {
    return res.status(401).json({
      success: false,
      message: "Please sign in to continue.",
      code: "UNAUTHENTICATED",
    });
  }

  req.user = user;
  next();
};
