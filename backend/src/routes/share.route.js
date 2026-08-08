const express = require('express');

const router = express.Router();

router.post('/', (req, res) => {
  res.json({msg: "default share"});
});

router.get('/:token', (req, res) => {
  res.json({msg: "shared file"});
});

router.delete('/:token', (req, res) => {
  res.json({msg: "delete share link"});
});

module.exports = router;