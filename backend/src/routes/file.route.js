const express = require('express');

const router = express.Router(); 

router.get('/', (req, res) => {
  res.json({msg: 'default'});
});

router.post('/upload', (req, res) => {
  res.json({msg: 'uplaod'});
});

router.get('/:id', (req, res) => {
  res.json({msg: "single file"});
});

router.get('/:id/download', (req, res) => {
  res.json({msg: "download"});
});

router.delete('/:id', (req, res) => {
  res.json({msg: "delete"});
});

module.exports = router;