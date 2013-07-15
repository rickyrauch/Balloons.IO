/*
 * Module dependencies
 */

var express = require('express')
  , init = require('./init')

/*
 * Create and config server
 */

var app = exports.app = express();

/**
 * Configure application
 */

require('./config')(app);

/*
 * Clean db and create folder
 */

// init(app.get('redisClient'));

/*
 * Passportjs auth strategy
 */

require('./strategy')(app);


/*
 * Routes
 */

require('./routes')(app);

/*
 * Web server
 */

if(app.get('config').credentials) {
  exports.server = require('https')
  .createServer(app.get('config').credentials, app).listen(app.get('port'), function() {
    console.log('Balloons.io started on port %d', app.get('port'));
  });
} else {
  exports.server = require('http')
  .createServer(app).listen(app.get('port'), function() {
    console.log('Balloons.io started on port %d', app.get('port'));
  });
}

/*
 * Socket.io
 */

require('./sockets')(app, exports.server);


/*
 * Catch uncaught exceptions
 */

process.on('uncaughtException', function(err){
  console.log('Exception: ' + err.stack);
});
