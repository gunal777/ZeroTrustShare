const jwt = require("jsonwebtoken");
const User = require("../model/User");

const createAuthError = (message, code, statusCode = 400) => {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
};

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables.");
  }

  return jwt.sign(
    {
      id: user._id,
      email: user.email,
    },
    secret,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

const registerUser = async ({ email, password }) => {
  if (!email || !password) {
    throw createAuthError("Please provide both email and password.", "VALIDATION_ERROR", 400);
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw createAuthError("An account with this email already exists.", "EMAIL_IN_USE", 409);
  }

  const user = await User.create({
    email,
    password,
  });

  const token = generateToken(user);

  return {
    user: {
      id: user._id,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  };
};

const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw createAuthError("Please provide both email and password.", "VALIDATION_ERROR", 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user) {
    throw createAuthError("Invalid email or password.", "INVALID_CREDENTIALS", 401);
  }

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    throw createAuthError("Invalid email or password.", "INVALID_CREDENTIALS", 401);
  }

  const token = generateToken(user);

  return {
    user: {
      id: user._id,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  };
};

const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select("-__v");
  if (!user) {
    throw createAuthError("User not found.", "USER_NOT_FOUND", 404);
  }
  return user;
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
};