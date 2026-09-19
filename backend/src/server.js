const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const morgan = require('morgan');

const fileRoutes = require('./routes/file.route');
const shareRoutes = require('./routes/share.route');
const authRoutes = require('./routes/auth.route');
const errorHandler = require('./middleware/error.middleware');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use(morgan("dev"));

//api routes
app.use("/api/files", fileRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/auth', authRoutes);

//error handler
app.use(errorHandler);

//connect to db
connectDB().then(() => {
  app.listen(process.env.PORT || 5000, () => {
    console.log("Server is running");
  });
});