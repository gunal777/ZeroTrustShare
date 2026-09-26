const COOKIE_NAME = "zts_session";

const SESSION_SECONDS = 8 * 60 * 60;

const cookieOptions = () => ({
  httpOnly: true,
  // Cross-site deployment (frontend on Vercel, API on Render) means the
  // cookie must be sent on cross-site requests. SameSite=None requires
  // Secure, and browsers reject Secure cookies over plain HTTP, so this
  // only works correctly when NODE_ENV=production (HTTPS on both sides).
  // In local dev (http://localhost), Lax is used instead since both
  // frontend and backend are effectively same-site there.
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/api",
});

module.exports = { COOKIE_NAME, SESSION_SECONDS, cookieOptions };