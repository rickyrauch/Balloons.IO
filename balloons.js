/*
 * Module dependencies
 */

var express = require('express')
  , http = require('http')
  , passport = require('passport')
  , config = exports.config = require('./config/' + (process.env.NODE_ENV || 'development') + '.json')
  , init = require('./init')
  , redis = require('redis')
  , RedisStore = require('connect-redis')(express)
  , client = null;

/*
 * Instantiate redis
 */

// explicit redis config - usually for Nodejitsu
if (config.redis) {
  console.log("---- USING EXPLICIT REDIS CONFIG ---- " + config.redis.hostname + ":" + config.redis.port);
  client = redis.createClient(config.redis.port, config.redis.hostname, config.redis.options);
  if (config.redis.password) client.auth(config.redis.password);
}

// Redis To Go connections string - usually for Heroku 
else if (process.env.REDISTOGO_URL) {

  var rtg   = require('url').parse(process.env.REDISTOGO_URL);
  client = redis.createClient(rtg.port, rtg.hostname);
  client.auth(rtg.auth.split(':')[1]); // auth 1st part is username and 2nd is password separated by ":"

// default redis client settings - usually for development environment
} else {

  client = redis.createClient();
}
exports.client = client;

var sessionStore = exports.sessionStore = new RedisStore({client: client});

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

var app = exports.app = express();

app.configure(function() {
  app.set('port', process.env.PORT || config.app.port || 6789);
  app.set('view engine', 'jade'); 
  app.set('views', __dirname + '/views/themes/' + config.theme.name);
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser());
  app.use(express.cookieParser(config.session.secret));
  app.use(express.session({
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
 * Web server
 */

exports.server = http.createServer(app).listen(app.get('port'), function() {
  console.log('Balloons.io started on port %d', app.get('port'));
});

/*
 * Socket.io
 */

require('./sockets');


/*
 * Catch uncaught exceptions
 */

process.on('uncaughtException', function(err){
  console.log('Exception: ' + err.stack);
});
