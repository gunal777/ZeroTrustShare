const express = require('express');
const shareController = require('../controllers/share.controller');

const router = express.Router();

router.post('/', shareController.createShareLink);

router.get('/:token', shareController.accessSharedFile);

router.delete('/:token', shareController.revokeShareLink);

module.exports = router;