const uploadFile = async (req, res) => {
    res.json({
        message: "Upload file controller reached"
    });
};

const getFiles = async (req, res) => {
    res.json({
        message: "Get files controller reached"
    });
};

const getFile = async (req, res) => {
    res.json({
        message: "Get single file controller reached",
        fileId: req.params.id
    });
};

const downloadFile = async (req, res) => {
    res.json({
        message: "Download file controller reached",
        fileId: req.params.id
    });
};

const deleteFile = async (req, res) => {
    res.json({
        message: "Delete file controller reached",
        fileId: req.params.id
    });
};

module.exports = {
    uploadFile,
    getFiles,
    getFile,
    downloadFile,
    deleteFile
};