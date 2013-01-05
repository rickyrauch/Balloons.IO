/*
 * Module dependencies
 */

var express = require('express')
  , http = require('http')
  , passport = require('passport')
  , config = require('./config.json')
  , init = require('./init')
  , redis = require('redis')
  , RedisStore = require('connect-redis')(express)
  , io;

/*
 * Instantiate redis
 */

var client = redis.createClient(config.db.port, config.db.host);
if(config.db.password)
  client.auth(config.db.password); 

var sessionStore = new RedisStore({client: client});

/*
 * Create app
 */

var app = express();

/*
 * Clean db and create folder
 */

init(client);

/*
 * Passportjs auth strategy
 */

require('./strategy')(app);

/*
 * Config app
 */

app.configure(function() {
  app.set('port', process.env.PORT || config.app.port || 6789);
  app.set('config', config);
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

require('./routes')(app, client, io);

/*
 * Web server
 */

var server = http.createServer(app).listen(app.get('port'), function() {
  console.log('Balloons.io started on port %d', app.get('port'));
});

/*
 * Socket.io
 */

io = require('./sockets')(app, server);

/*
 * Catch uncaught exceptions
 */

process.on('uncaughtException', function(err){
  console.log('Exception: ' + err.stack);
});
