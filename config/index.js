/**
 * Module dependencies.
 */

var log = require('debug')('balloons:config')
  , express = require('express')
  , redis = require('redis')
  , RedisStore = require('connect-redis')(express)
  , passport = require('passport')
  , path = require('path')
  , url = require('url')
  , config = {}
  , env = require('./env')
  , utils = require('../utils');

/**
 * Expose Configuration scope
 */

module.exports = Config;

/**
 * Applies configurations settings
 * for application.
 *
 * @param {Express} app `Express` instance.
 * @api public
 */

function Config (app) {
  log("Attempt to load from config.json")
  try {
    config = require('./config.json');
    log('Loaded from config.json %j', config);
  } catch (err) {
    log("Failed to load file config.json %j", err);
  }

  log('Attemp to load from environment');
  utils.merge(config, env);

  log('Save configuration values in app %j', config);
  app.set('config', config);

  log('Setting port as %d', config.app.port);
  app.set('port', config.app.port);

  log('Setting view engine as %s', 'jade');
  app.set('view engine', 'jade');

  log('Setting redisURL', config.redisURL);
  app.set('redisURL', config.redisURL);

  log('Opening a redis client connection');
  // This should be moved to a db.js module
  var redisConfig = url.parse(config.redisURL);
  var redisClient = redis.createClient(redisConfig.port, redisConfig.hostname);
  
  redisClient
  .on('error', function(err) {
    log('Error connecting to redis %j', err);
  }).on('connect', function() {
    log('Connected to redis.');
  }).on('ready', function() {
    log('Redis client ready.');
  });

  if (redisConfig.auth) {
    // auth 1st part is username and 2nd is password separated by ":"
    redisClient.auth(redisConfig.auth.split(':')[1]);
  };

  log('Saving redisClient connection in app');
  app.set('redisClient', redisClient);

  log('Creating and saving a session store instance with redis client.');
  app.set('sessionStore', new RedisStore({client: redisClient}));

  log('Setting views lookup root path.');
  app.set('views', path.join(__dirname, '..', '/views/themes/', config.theme.name));
  
  log('Setting static files lookup root path.');
  app.use(express.static(path.join(__dirname, '..', '/public')));
  
  log('Use of express body parser middleware.');
  app.use(express.bodyParser());
  
  log('Use of express cookie parser middleware.');
  app.use(express.cookieParser(config.session.secret));
  
  log('Use of express session middleware.');
  app.use(express.session({
    key: "balloons",
    store: app.get('sessionStore'),
    cookie: {
        maxAge: config.session.age || null
    }
  }));
  
  log('Use of passport middlewares.');
  app.use(passport.initialize());
  app.use(passport.session());
  
  log('Use of express router.');
  app.use(app.router);
}