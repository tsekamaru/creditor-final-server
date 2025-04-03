const express = require('express');
const router = express.Router();

/* GET home page */
router.get("/", (req, res, next) => {
  // Pass the current user to the layout
  res.locals.currentUser = req.session.currentUser;
  res.render("index");
});

module.exports = router;
