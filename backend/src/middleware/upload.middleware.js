const path = require("path");
const multer = require("multer");

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const allowedFileTypes = new Map([
  [".pdf", "application/pdf"],
  [".doc", "application/msword"],
  [
    ".docx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  [".txt", "text/plain"],
]);

const fileFilter = (req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const expectedMimeType = allowedFileTypes.get(extension);

  if (expectedMimeType && file.mimetype === expectedMimeType) {
    return callback(null, true);
  }

  const error = new Error("Only PDF, DOC, DOCX, and TXT files are allowed.");
  error.code = "INVALID_FILE_TYPE";
  return callback(error, false);
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter,
});

module.exports = upload;
