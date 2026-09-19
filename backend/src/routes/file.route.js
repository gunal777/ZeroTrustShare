const fileController = require('../controllers/file.controller');
const upload = require("../middleware/upload.middleware");
const authMiddleware = require("../middleware/auth.middleware");
const express = require('express');

const router = express.Router(); 

router.use(authMiddleware);

router.post("/upload", upload.single("file"), fileController.uploadFile);

router.get('/', fileController.getFiles);

router.get('/:id', fileController.getFile);

router.get('/download/:id', fileController.downloadFile);

router.delete('/:id', fileController.deleteFile);

module.exports = router;