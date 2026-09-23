const shareService = require("../services/share.service");
const fileService = require("../services/file.service");
const ShareLink = require("../model/ShareLink");

const createShareLink = async (req, res) => {
  try {
    const { fileId, expiresAt, password, allowDownload } = req.body;
    const ownerId = req.user._id;

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
      allowDownload,
    });

    return res.status(201).json({
      success: true,
      message: "Share link created successfully",
      data: {
        token: shareLink.token,
        expiresAt: shareLink.expiresAt,
        allowDownload: shareLink.allowDownload,
        isPasswordProtected: Boolean(shareLink.passwordHash),
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
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
    } catch (error) {
      if (error.code === "INVALID_PASSWORD") {
        const rawLink = await ShareLink.findOne({ token, isRevoked: false }).populate("file");

        if (!rawLink || rawLink.expiresAt <= new Date()) {
          return res.status(410).json({
            success: false,
            message: "Share link has expired or is invalid",
          });
        }

        if (!rawLink.file) {
          return res.status(404).json({
            success: false,
            message: "The file associated with this link no longer exists.",
          });
        }

        return res.status(200).json({
          success: true,
          passwordRequired: true,
          allowDownload: rawLink.allowDownload,
          file: {
            name: rawLink.file.originalName,
            size: rawLink.file.size,
            mimeType: rawLink.file.mimeType,
          },
        });
      }
      throw error;
    }

    if (!shareLink.file) {
      return res.status(404).json({
        success: false,
        message: "The file associated with this link no longer exists.",
      });
    }

    return res.status(200).json({
      success: true,
      passwordRequired: false,
      allowDownload: shareLink.allowDownload,
      file: {
        id: shareLink.file._id,
        name: shareLink.file.originalName,
        size: shareLink.file.size,
        mimeType: shareLink.file.mimeType,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};

// Stream inline for browser rendering (Preview)
const streamPreview = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const shareLink = await shareService.accessShareLink(token, password);
    const downloadResult = await fileService.downloadFile(shareLink.file._id);

    if (!downloadResult) {
      return res.status(404).json({
        success: false,
        message: "Associated file not found.",
      });
    }

    res.setHeader("Content-Type", downloadResult.file.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${downloadResult.file.originalName}"`
    );
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    return res.send(downloadResult.buffer);
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};

// Attachment download with strict permission checking
const downloadSharedFile = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const shareLink = await shareService.accessShareLink(token, password);

    if (!shareLink.allowDownload) {
      return res.status(403).json({
        success: false,
        message: "Download is restricted for this link. View-only access permitted.",
      });
    }

    const downloadResult = await fileService.downloadFile(shareLink.file._id);

    if (!downloadResult) {
      return res.status(404).json({
        success: false,
        message: "Associated file not found.",
      });
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${downloadResult.file.originalName}"`
    );
    res.setHeader("Content-Type", downloadResult.file.mimeType);
    return res.send(downloadResult.buffer);
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};

const revokeShareLink = async (req, res) => {
  try {
    const { token } = req.params;
    const ownerId = req.user._id;

    const shareLink = await shareService.revokeShareLink(token, ownerId);

    if (!shareLink) {
      return res.status(404).json({
        success: false,
        message: "Share link not found or access denied",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Share link revoked successfully",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createShareLink,
  accessSharedFile,
  streamPreview,
  downloadSharedFile,
  revokeShareLink,
};