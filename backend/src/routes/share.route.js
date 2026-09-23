const express = require('express');
const shareController = require('../controllers/share.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', authMiddleware, shareController.createShareLink);
router.delete('/:token', authMiddleware, shareController.revokeShareLink);

router.get('/:token', shareController.accessSharedFile);
router.post("/:token/preview", shareController.streamPreview);
router.post("/:token/download", shareController.downloadSharedFile);

module.exports = router;