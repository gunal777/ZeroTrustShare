const shareService = require("../services/share.service");
const fileService = require("../services/file.service");

const createShareLink = async (req, res) => {
  try {
    const { fileId, expiresAt, password } = req.body;
    const ownerId = req.user ? req.user._id : undefined;

    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: "File ID is required",
      });
    }

    const shareLink = await shareService.createShareLink({
      fileId,
      expiresAt,
      password,
      ownerId,
    });

    res.status(201).json({
      success: true,
      message: "Share link created successfully",
      data: {
        token: shareLink.token,
        expiresAt: shareLink.expiresAt,
        isPasswordProtected: Boolean(shareLink.passwordHash),
      },
    });
  } 

  catch (error) {
    const status = error.code === "FILE_NOT_FOUND" ? 404 : 400;

    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

const accessSharedFile = async (req, res) => {
  try {
    const { token } = req.params;

    let shareLink;

    try {
      shareLink = await shareService.accessShareLink(token);
    } 
    
    catch (error) {
      // if error is INVALID_PASSWORD
      if (error.code === "INVALID_PASSWORD") {
        const rawLink = await require("../model/ShareLink")
          .findOne({ token, isRevoked: false })
          .populate("file");

        if (!rawLink || rawLink.expiresAt <= new Date()) {
          return res.status(410).json({
            success: false,
            message: "Share link has expired or is invalid",
          });
        }

        return res.status(200).json({
          success: true,
          passwordRequired: true,
          file: {
            name: rawLink.file.originalName,
            size: rawLink.file.size,
            mimeType: rawLink.file.mimeType,
          },
        });
      }
      throw error;
    }

    return res.status(200).json({
      success: true,
      passwordRequired: false,
      file: {
        id: shareLink.file._id,
        name: shareLink.file.originalName,
        size: shareLink.file.size,
        mimeType: shareLink.file.mimeType,
      },
    });
  } 
  
  catch (error) {
    const statusCode =
      error.code === "LINK_NOT_FOUND"
        ? 404
        : error.code === "LINK_EXPIRED"
          ? 410
          : 400;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const verifySharePassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const shareLink = await shareService.accessShareLink(token, password);

    const downloadResult = await fileService.downloadFile(shareLink.file._id);

    if (!downloadResult) {
      return res.status(404).json({
        success: false,
        message: "File not found.",
      });
    }

    // set download headers and send decrypted buffer
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${downloadResult.file.originalName}"`,
    );

    res.setHeader("Content-Type", downloadResult.file.mimeType);

    return res.send(downloadResult.buffer);
  } 
  
  catch (error) {
    const statusCode = error.code === "INVALID_PASSWORD" 
      ? 401
        : error.code === "LINK_NOT_FOUND"
          ? 404 : error.code === "LINK_EXPIRED"
            ? 410 : 400;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const revokeShareLink = async (req, res) => {
  try {
    const { token } = req.params;

    const shareLink = await shareService.revokeShareLink(token);

    if (!shareLink) {
      return res.status(404).json({
        success: false,
        message: "Share link not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Share link revoked successfully",
    });
  } 
  
  catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createShareLink,
  accessSharedFile,
  revokeShareLink,
  verifySharePassword,
};
