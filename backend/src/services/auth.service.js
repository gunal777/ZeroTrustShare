const jwt = require("jsonwebtoken");
const User = require("../model/User");
const { SESSION_SECONDS } = require("../config/session");
const fail = (message, statusCode = 400) =>
  Object.assign(new Error(message), { statusCode });
const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});
function validate(email, password, signup) {
  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    email.length > 254
  )
    throw fail("Enter a valid email address.");
  if (
    typeof password !== "string" ||
    password.length < (signup ? 8 : 1) ||
    Buffer.byteLength(password) > 72
  )
    throw fail("Use a password of at least 8 characters and at most 72 bytes.");
}
function result(user) {
  return {
    user: publicUser(user),
    token: jwt.sign(
      { id: user._id.toString(), version: user.tokenVersion || 0 },
      process.env.JWT_SECRET,
      {
        expiresIn: SESSION_SECONDS,
        issuer: "zerotrust-vault",
        audience: "zerotrust-app",
        algorithm: "HS256",
      },
    ),
  };
}
exports.registerUser = async ({ email, password, name = "" }) => {
  validate(email, password, true);
  if (typeof name !== "string" || name.trim().length > 80)
    throw fail("Name must be 80 characters or fewer.");
  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail }))
    throw fail("An account with this email already exists.", 409);
  return result(
    await User.create({ email: normalizedEmail, password, name: name.trim() }),
  );
};
exports.loginUser = async ({ email, password }) => {
  validate(email, password, false);
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
    "+password +tokenVersion",
  );
  if (!user || !(await user.comparePassword(password)))
    throw fail("Invalid email or password.", 401);
  return result(user);
};
exports.publicUser = publicUser;
