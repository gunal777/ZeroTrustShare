module.exports = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let status = err.statusCode || err.status || 500;
  let message = err.message;

  if (err.code === "LIMIT_FILE_SIZE") {
    status = 413;
    message = "Files must be 25 MB or smaller.";
  } else if (err.name === "MulterError" || err.code === "INVALID_FILE_TYPE") {
    status = 400;
  } else if (err.name === "CastError" || err.name === "ValidationError") {
    status = 400;
    message = "Please check the supplied values.";
  } else if (err.code === 11000) {
    status = 409;
    message = "An account with this email already exists.";
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Invalid JSON body.";
  }

  if (status >= 500) {
    console.error(
      "Request failed: " +
        (err.name || "Error") +
        " (" +
        (err.code || "INTERNAL_ERROR") +
        ")"
    );
    message = "Something went wrong. Please try again.";
  }

  res.status(status).json({
    success: false,
    message,
    code: typeof err.code === "string" ? err.code : undefined,
  });
};
