const fileController = require('../controllers/file.controller');
const upload = require("../middleware/upload.middleware");
const express = require('express');

const router = express.Router(); 

router.post("/upload", upload.single("file"), fileController.uploadFile);

router.get('/', fileController.getFiles);

router.get('/:id', fileController.getFile);

router.get('/:id/download', fileController.downloadFile);

router.delete('/:id', fileController.deleteFile);

module.exports = router;