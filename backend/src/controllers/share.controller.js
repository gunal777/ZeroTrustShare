const createShareLink = async (req, res) => {
  res.status(201).json({
    success: true,
    message: "Create share link endpoint",
  });
};

const accessSharedFile = async (req, res) => {
  const { token } = req.params;

  res.status(200).json({
    success: true,
    message: "Access shared file endpoint",
    token,
  });
};

const revokeShareLink = async (req, res) => {
  const { token } = req.params;

  res.status(200).json({
    success: true,
    message: "Revoke share link endpoint",
    token,
  });
};

module.exports = {
  createShareLink,
  accessSharedFile,
  revokeShareLink,
};
