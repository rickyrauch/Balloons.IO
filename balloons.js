/*
 * Module dependencies
 */

var express = require('express')
  , redis = require('redis')
  , passport = require('passport')
  , RedisStore = require('connect-redis')(express)
  , sessionStore = exports.sessionStore = new RedisStore
  , config = require('./config.json')
  , utils = require('./utils')
  , fs = require('fs')
  , init = require('./init');


/*
 * Instantiate redis
 */

var client = exports.client  = redis.createClient();

/*
 * Clean db and create folder
 */

init(client);

/*
 * Passportjs auth strategy
 */

require('./strategy');

/*
 * Create and config server
 */

var app = exports.app = express.createServer();

app.configure(function() {
  app.set('view engine', 'jade'); 
  app.set('views', __dirname + '/views/themes/' + config.theme.name);
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({
    secret: config.session.secret,
    key: "balloons",
    store: sessionStore
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
});

/*
 * Routes
 */

require('./routes');

/*
 * Socket.io
 */

require('./sockets');

app.listen(config.app.port);

console.log('Balloons.io started at port %d', app.address().port);
