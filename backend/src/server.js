const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "ZeroTrustShare API is running"
  });
});

//connect to db
connectDB().then(() => {
  app.listen(process.env.PORT || 5000, () => {
    console.log("Server is running");
  });
});