const fileService = require("../services/file.service");

const uploadFile = async (req, res) => {
  try {
    if(!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const ownerId = req.user._id;
    const file = await fileService.uploadFile(req.file, ownerId);

    return res.status(201).json({
      success: true,
      message: "File uploaded Successfully",
      file
    })
  }

  catch(error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

const getFiles = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const files = await fileService.getFiles(ownerId);

    return res.status(200).json({
      sucess: true,
      files
    })
  }

  catch(error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

const getFile = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user._id;

    const file = await fileService.getFile(id, ownerId);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    return res.status(200).json({
      success: true,
      file
    });
  }

  catch(error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user._id;

    const result = await fileService.downloadFile(id, ownerId); 

    if(!result) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    const { file, buffer } = result;

    res.setHeader("Content-Disposition", `attachment; filename="${file.originalName}"`);
    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Content-Length", buffer.length);

    return res.status(200).send(buffer);
  }

  catch(error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user._id;

    const file = await fileService.deleteFile(id, ownerId);

    if(!file) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "File deleted Successfully"
    });
  }

  catch(error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  uploadFile,
  getFiles,
  getFile,
  downloadFile,
  deleteFile,
};