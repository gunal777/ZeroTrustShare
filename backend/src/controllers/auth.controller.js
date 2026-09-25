const service = require("../services/auth.service");
const User = require("../model/User");
const {
  COOKIE_NAME,
  SESSION_SECONDS,
  cookieOptions,
} = require("../config/session");
const authenticate = (method, status) => async (req, res) => {
  const { user, token } = await service[method](req.body || {});
  res.cookie(COOKIE_NAME, token, {
    ...cookieOptions(),
    maxAge: SESSION_SECONDS * 1000,
  });
  res.status(status).json({ success: true, user });
};
exports.login = authenticate("loginUser", 200);
exports.register = authenticate("registerUser", 201);
exports.getProfile = (req, res) =>
  res.json({ success: true, user: service.publicUser(req.user) });
exports.logout = async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
  res.clearCookie(COOKIE_NAME, cookieOptions());
  res.json({ success: true });
};
