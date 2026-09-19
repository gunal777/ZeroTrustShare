const jwt = require("jsonwebtoken");
const User = require("../model/User");

const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if(!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required.",
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "JWT configuration error on server.",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } 
    catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token has expired. Please log in again.",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    const user = await User.findById(decoded.id).select("-password -__v");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User session is no longer valid.",
      });
    }

    req.user = user;
    next();
  } 
  
  catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;