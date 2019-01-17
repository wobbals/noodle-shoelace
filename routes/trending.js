const debug = require('debug')('routes:trending');
const config = require('config');
const express = require('express');

const transmogrifier = require('../helpers/transmogrifier');
let router = express.Router();

router.get('/trending', async function(req, res) {
  let response;
  try {
    let feedURLs = config.get('feed_urls');
    let nTrends = config.get('number_trends');
    let documents = await transmogrifier.collectDocuments(feedURLs);
    response = transmogrifier.detectTrends(documents, nTrends);
  } catch (e) {
    res.status(500).json({
      error: e.message
    })
  }
  res.status(200).json(response);
});

module.exports = router;
