const authService = require("../services/auth.service");

//login user
const login = async (req, res) => {
try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      ...result,
    });
  } 
  
  catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

//sign up user
const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.registerUser({ email, password });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      ...result,
    });
  } 
  
  catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
}

//get profile
const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getUserProfile(req.user._id);

    return res.status(200).json({
      success: true,
      user,
    });
  } 
  
  catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { login, register, getProfile };