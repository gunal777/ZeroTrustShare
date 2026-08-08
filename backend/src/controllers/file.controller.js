const uploadFile = async (req, res) => {
  res.status(201).json({
    success: true,
    message: "File upload endpoint",
  });
};

const getFiles = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Get files endpoint",
  });
};

const getFile = async (req, res) => {
  const { id } = req.params;

  res.status(200).json({
    success: true,
    message: "Get file endpoint",
    fileId: id,
  });
};

const downloadFile = async (req, res) => {
  const { id } = req.params;

  res.status(200).json({
    success: true,
    message: "Download file endpoint",
    fileId: id,
  });
};

const deleteFile = async (req, res) => {
  const { id } = req.params;

  res.status(200).json({
    success: true,
    message: "Delete file endpoint",
    fileId: id,
  });
};

module.exports = {
  uploadFile,
  getFiles,
  getFile,
  downloadFile,
  deleteFile,
};
