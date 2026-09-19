const User = require('../model/User'); 

//login user
const login = async (req, res) => {
  res.json({msg: "login user"});
}

//sign up user
const register = async (req, res) => {
  res.json({msg: "signup user"});
}

module.exports = { login, register };