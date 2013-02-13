
/*
 * Module dependencies
 */

var passport = require('passport')
  , config = require('../config')
  , models = require('./models')
  , crypto = require('crypto')
  , debug = require('debug')('Balloons:routes');

/**
 * Get models
 */

var Room = models('Room');

/**
 * Set routes
 */

module.exports = function(app, db) {
  app.get(  '/',          isAuth, redirect('/rooms'));
  app.get(  '/logout',    logout, redirect('/'));
  app.get(  '/rooms',     isAuth, loadPublicGroups, render('room_list'));
  app.post( '/create',    isAuth, validateRoom, createRoom);
  app.post( '/:room_key', isAuth, loadRoom, loadRoomUsers, loadRooms, getStatus, render('room'));
};

/**
 * check if user is auth
 * otherwise show homepage
 */

var isAuth = function(req, res, next) {
  (req.isAuthenticated()) ? 
    next() : res.render('index');
};

/**
 * Render a specific path
 */

var render = function(path) {
  return function(req, res) {
    res.render(path);
  };
};

/**
 * Redirect to specific uri
 */

var redirect = function(path) {
  return function(req, res) {
    res.redirect(path);
  };
};

/**
 * Logout
 */

var logout = function(req, res, next) {
  req.logout();
  next();
};

/**
 * Load public rooms
 */

var loadPublicRooms = function(db) {
  return function(req, res, next) {
    Room.getPublic(db, function(err, rooms){
      if(err) throw err;
      res.locals.rooms = rooms;
      next();  
    }); 
  };  
};

/**
 * Validate room
 */

var validateRoom = function(req, res, next) {
  var room_name = encodeURIComponent(req.body.room_name.trim());
  if(validRoomName(room_name)) {
    Room.findById(db, room_name, function(err, room){
      if(err) throw err;
      if(!room) {
        req.room_name = room_name;
        next();
      } else {
        // TODO: flash message
        res.redirect('back');
      }
    });
  } else {
    // TODO: flash message
    res.redirect('back');
  }
}; 

/**
 * Validate room name
 */

var validRoomName = function(str) {
  return str && str.length < 255;
};

/**
 * Create a room and redirect
 */

var createRoom = function(req, res) {
  var room = new Room.model({
    key: genRoomKey(),
    name: req.room_name,
    admin: req.user.provider + ":" + req.user.username,
    locked: 0,
    online: 0
  });

  room.save(function(err, r){
    if(err) throw err;
    res.redirect('/' + r.key);
  });
};
 
/**
 * Generate a room key
 */

var genRoomKey = function() {
  var shasum = crypto.createHash('sha1');
  shasum.update(Date.now().toString());
  return shasum.digest('hex').substr(0,6);
};

/*
 * Authentication routes 
 * 
 * TODO: Fix this
 */

if(config.auth.twitter.consumerkey.length) {
  app.get('/auth/twitter', passport.authenticate('twitter'));

  app.get('/auth/twitter/callback', 
    passport.authenticate('twitter', {
      successRedirect: '/',
      failureRedirect: '/'
    })
  );
}

if(config.auth.facebook.clientid.length) {
  app.get('/auth/facebook', passport.authenticate('facebook'));

  app.get('/auth/facebook/callback', 
    passport.authenticate('facebook', {
      successRedirect: '/',
      failureRedirect: '/'
    })
  );
}

