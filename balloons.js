/*
 * Module dependencies
 */

var express = require('express')
  , http = require('http')
  , passport = require('passport')
  , config = require('./config.json');


/*
 * Instantiate redis
 */
var redis = require('redis')
  , client;

// client connect
if (process.env.REDISTOGO_URL) {
  var rtg = require('url').parse(process.env.REDISTOGO_URL);
  client = redis.createClient(rtg.port, rtg.hostname);
  if(rtg.auth) client.auth(rtg.auth.split(':')[1]);
} else {
  client = redis.createClient();
}

// externalize client
exports.client = client;

// session store
var RedisStore = require('connect-redis')(express)
  , sessionStore = exports.sessionStore = new RedisStore({ client: client });

var api = require('./api');


/*
 * Clean db and create folder
 */

require('./init')(api);


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
