const express = require('express');
const fileController = require('../controllers/file.controller');

const router = express.Router(); 

router.get('/', fileController.getFiles);

router.post('/upload', fileController.uploadFile);

router.get('/:id', fileController.getFile);

router.get('/:id/download', fileController.downloadFile);

router.delete('/:id', fileController.deleteFile);

module.exports = router;