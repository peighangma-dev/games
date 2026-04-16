const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

router.post('/:command', auth, async (req, res) => {
  try {
    const handler = require('../socket/commands');
    const result = await handler.handle(
      req.params.command,
      req.body.target,
      req.body.args,
      {
        userId: req.user.id,
        username: req.user.username,
        grade: req.user.grade,
        faction: req.user.faction,
        sect: req.user.sect,
        sect_title: req.user.sect_title
      }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
