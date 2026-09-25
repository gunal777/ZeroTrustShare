const service = require("../services/file.service");
exports.uploadFile = async (req, res) => {
  if (!req.file)
    return res
      .status(400)
      .json({ success: false, message: "Choose a file to upload." });
  const record = await service.uploadFile(req.file, req.user._id);
  const file = await service.getFile(record._id, req.user._id);
  res.status(201).json({ success: true, file });
};
exports.getFiles = async (req, res) =>
  res.json({ success: true, files: await service.getFiles(req.user._id) });
exports.getFile = async (req, res) => {
  const file = await service.getFile(req.params.id, req.user._id);
  if (!file)
    return res.status(404).json({ success: false, message: "File not found." });
  res.json({ success: true, file });
};
exports.downloadFile = async (req, res) => {
  const result = await service.downloadFile(req.params.id, req.user._id);
  if (!result)
    return res.status(404).json({ success: false, message: "File not found." });
  res
    .attachment(result.file.originalName)
    .type(result.file.mimeType)
    .send(result.buffer);
};
exports.deleteFile = async (req, res) => {
  const file = await service.deleteFile(req.params.id, req.user._id);
  if (!file)
    return res.status(404).json({ success: false, message: "File not found." });
  res.json({ success: true, message: "File deleted." });
};
