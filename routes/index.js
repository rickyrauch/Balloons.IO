
/*
 * Module dependencies
 */

var app = module.parent.exports.app
  , passport = require('passport')
  , client = module.parent.exports.client
  , config = require('../config')
  , utils = require('../utils')
  , async = require('async');

/*
 * Homepage
 */

app.get('/', function(req, res, next) {
  if(req.isAuthenticated()){
    client.hmset(
        'users:' + req.user.provider + ":" + req.user.username
      , req.user
    );
    res.redirect('/rooms');
  } else{
    res.render('index');
  }
});

/*
 * Authentication routes
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

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

/*
 * Rooms list
 */

app.get('/rooms', utils.restrict, function(req, res) {
  utils.getPublicRoomsInfo(client, function(rooms) {
    res.render('room_list', { rooms: rooms });
  });
});

/*
 * Create a rooom
 */

app.post('/create', utils.restrict, function(req, res) {
  utils.validRoomName(req, res, function(roomKey) {
    utils.roomExists(req, res, client, function() {
      utils.createRoom(req, res, client);
    });
  });
});

/*
 * Join a room
 */

app.get('/:id', utils.restrict, function(req, res) {
  async.auto({
    room:   function (cb) { utils.getRoomInfo(req, res, client, function (room) { cb(null, room) }) },
    users:  ['room', function (cb, o) { utils.getUsersInRoom(req, res, client, o.room, function (users) { cb(null, users) }) }],
    rooms:  function (cb) { utils.getPublicRoomsInfo(client, function (rooms) { cb(null, rooms) }) },
    status: function (cb) { utils.getUserStatus(req.user, client, function (status) { cb(null, status) }) },
    enter:  ['room', 'users', 'rooms', 'status', function (cb, o) { utils.enterRoom(req, res, o.room, o.users, o.rooms, o.status); cb(); }]
  });
});

