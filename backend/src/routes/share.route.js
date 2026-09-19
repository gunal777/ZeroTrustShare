const express = require('express');
const shareController = require('../controllers/share.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', authMiddleware, shareController.createShareLink);

router.get('/:token', shareController.accessSharedFile);

router.post('/:token/access', shareController.verifySharePassword)

router.delete('/:token', authMiddleware, shareController.revokeShareLink);

module.exports = router;