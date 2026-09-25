const service = require("../services/share.service");
const fileService = require("../services/file.service");
exports.createShareLink = async (req, res) => {
  const data = await service.createShareLink({
    ...req.body,
    ownerId: req.user._id,
  });
  res.status(201).json({ success: true, data });
};
exports.listShareLinks = async (req, res) =>
  res.json({
    success: true,
    links: await service.listShareLinks(req.user._id),
  });
exports.accessSharedFile = async (req, res) => {
  const link = await service.findLink(req.params.token);
  res.json({
    success: true,
    passwordRequired: Boolean(link.passwordHash),
    allowDownload: link.allowDownload,
    expiresAt: link.expiresAt,
    file: {
      name: link.file.originalName,
      size: link.file.size,
      mimeType: link.file.mimeType,
    },
  });
};
const sendFile = (preview) => async (req, res) => {
  const link = await service.accessShareLink(
    req.params.token,
    req.body?.password,
  );
  if (!preview && !link.allowDownload)
    return res.status(403).json({
      success: false,
      message: "This is a preview-only link. Downloads are disabled.",
    });
  if (
    preview &&
    !["application/pdf", "text/plain"].includes(link.file.mimeType)
  )
    return res.status(415).json({
      success: false,
      message: "Preview is available for PDF and TXT files only.",
    });
  const result = await fileService.downloadFile(link.file._id);
  if (!result)
    return res
      .status(404)
      .json({ success: false, message: "The shared file no longer exists." });
  await service.recordAccess(link._id);
  res.attachment(result.file.originalName);
  if (preview) {
    res.set(
      "Content-Disposition",
      res.get("Content-Disposition").replace(/^attachment/, "inline"),
    );
    res.set("Content-Security-Policy", "default-src 'none'; sandbox");
  }
  res.type(result.file.mimeType).send(result.buffer);
};
exports.streamPreview = sendFile(true);
exports.downloadSharedFile = sendFile(false);
exports.revokeShareLink = async (req, res) => {
  await service.revokeShareLink(req.params.token, req.user._id);
  res.json({ success: true, message: "Share link revoked." });
};
