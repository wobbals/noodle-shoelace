const express = require('express');

let trending = require('./routes/trending');
let app = express();

app.use('/', trending);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // render the error page
  res.status(err.status || 500);
  res.json({ message: err.message });
});

module.exports = app;
