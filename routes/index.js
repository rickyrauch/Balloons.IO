
/*
 * Module dependencies
 */

var app = module.parent.exports.app
  , passport = require('passport')
  , client = module.parent.exports.client
  , config = require('../config')
  , utils = require('../utils')
  , api = require('../api');

/*
 * Homepage
 */

app.get('/', function(req, res, next) {
  api.redis.getPublicRooms(function(err, rooms) {
    if(err) console.error(err);
    if(req.isAuthenticated()) var user = req.user;
    return res.render('homepage', { rooms: rooms || [], user: user || null });
  });
  // if(req.isAuthenticated()) return res.redirect('/new_splash');
  // return res.render('new_splash');
});

/*
 * Authentication routes
 */

if(config.auth.twitter && config.auth.twitter.consumerkey.length) {
  app.get('/auth/twitter', passport.authenticate('twitter'));

  app.get('/auth/twitter/callback', 
    passport.authenticate('twitter', {
      successRedirect: '/',
      failureRedirect: '/'
    })
  );
}

if(config.auth.facebook && config.auth.facebook.clientid.length) {
  app.get('/auth/facebook', passport.authenticate('facebook'));

  app.get('/auth/facebook/callback', 
    passport.authenticate('facebook', {
      successRedirect: '/',
      failureRedirect: '/'
    })
  );
}

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

/*
 * Rooms list
 */

app.get('/rooms', utils.restrict, function(req, res) {
  api.redis.getPublicRooms(function(err, rooms) {
    if(err) console.error(err);
    return res.render('room_list', { rooms: rooms });
  });
});

/*
 * Create a rooom
 */

app.post('/create', utils.restrict, utils.validRoomName, function(req, res) {
  api.redis.roomExists(req.body.room_name, function(roomKey) {
    if(roomKey) return res.redirect('/' + roomKey);
    api.redis.createRoom(req.body, req.user, function(err, room) {
      if(err) return res.send(403);
      return res.redirect('/' + room.key);
    });
  });
});

app.get('/new_splash', function(req, res) {
  utils.getPublicRoomsInfo(client, function(rooms) {
    res.render('homepage', { rooms: rooms });
  });
});

/*
 * Join a room
 */

app.get('/:id', utils.restrict, function(req, res) {
  api.redis.getFullRoom(req.params.id, function(err, room) {
    if(err) return res.redirect('/');
    console.log(room);
    api.redis.getPublicRooms(function(err, rooms) {
      if(err) return res.redirect('/');
      utils.enterRoom(req, res, room, rooms);
    });
  });
});

