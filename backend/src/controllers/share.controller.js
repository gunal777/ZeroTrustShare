const createShareLink = async (req, res) => {
    res.json({
        message: "Create share link controller reached"
    });
};

const accessSharedFile = async (req, res) => {
    res.json({
        message: "Access shared file controller reached",
        token: req.params.token
    });
};

const revokeShareLink = async (req, res) => {
    res.json({
        message: "Revoke share link controller reached",
        token: req.params.token
    });
};

module.exports = {
    createShareLink,
    accessSharedFile,
    revokeShareLink
};