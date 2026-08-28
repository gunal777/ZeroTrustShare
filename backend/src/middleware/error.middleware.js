const errorHandler = (err, req, res, next) => {
  console.error("Error caught by global handler:", err);

  // 1. Multer built-in file size limit error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "File size exceeds the allowed limit (max 25 MB).",
    });
  }

  // 2. Custom file filter rejection from upload.middleware.js
  if (err.code === "INVALID_FILE_TYPE") {
    return res.status(400).json({
      success: false,
      message: err.message || "Invalid file type.",
    });
  }

  // 3. Custom application/service errors (like in your share.service.js)
  if (err.code === "FILE_NOT_FOUND" || err.code === "LINK_NOT_FOUND") {
    return res.status(404).json({
      success: false,
      message: err.message,
    });
  }

  if (err.code === "LINK_EXPIRED") {
    return res.status(410).json({
      success: false,
      message: err.message,
    });
  }

  if (err.code === "INVALID_PASSWORD") {
    return res.status(401).json({
      success: false,
      message: err.message,
    });
  }

  // 4. Generic fallback for all other 500 errors
  const statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

module.exports = errorHandler;