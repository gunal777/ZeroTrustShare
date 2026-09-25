const COOKIE_NAME = "zts_session";
const SESSION_SECONDS = 8 * 60 * 60;
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api",
});
module.exports = { COOKIE_NAME, SESSION_SECONDS, cookieOptions };
