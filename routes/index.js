
/*
 * Module dependencies
 */

var passport = require('passport')
  , utils = require('../utils')
  , client
  , io;

module.exports = function(app, _client, _io) { 
  client = _client;
  io = _io;

  app.get('/', redirectLogged, render('index'));
  app.get('/logout', logout, redirect('/'));
  app.get('/rooms', isAuth, getPublicRooms, render('room_list'));
  app.post('/create', isAuth, availableRoom, createRoom);
  app.get('/:room_id', isAuth, getRoom, getRoomUsers, getPublicRooms, getUser, render('room'));
};

var redirectLogged = function(req, res, next) {
  if(req.isAuthenticated()) res.redirect('/rooms');
  else next();
};

var isAuth = function(req, res, next) {
  if(req.isAuthenticated()) next();
  else res.redirect('/');
};

var render = function(path) {
  return function(req, res) {
    res.render(path);
  };
};

var redirect = function(route) {
  return function(req, res) {
    res.redirect(route);
  };
};

var logout = function(req, res, next){
  req.logout();
  next();
};

var getPublicRooms = function(req, res, next) {
  utils.getPublicRoomsInfo(client, function(rooms) {
    res.locals.rooms = rooms;
    next();
  });
};

var availableRoom = function(req, res, next) {
  utils.availableRoom(client, req.body.room_name, function(valid) {
    if(valid) next();
    else res.send(500);
  });
};

var createRoom = function(req, res) {
  utils.createRoom(client, req.body.room_name, function(err, key){
    if(err) res.send(500);
    else res.redirect('/' + key);
  });
};

var getRoom = function(req, res, next) {
  utils.getRoomInfo(client, req.params.room_id, function(err, room) {
    if(err) {
      next(err);
    } else {
      res.locals.room = req.room = room;
      next();
    }
  });
};

var getRoomUsers = function(req, res, next) {
  utils.getUsersInRoom(client, req.params.room_id, req.room, function(err, users){
    if(err) {
      next(err);
    } else {
      res.locals.users_list = req.users_list = users;
      next();
    }
  });
};

var getPublicRooms = function(req, res, next) {
  utils.getPublicRoomsInfo(client, function(err, rooms) {
    if(err) {
      next(err);
    } else {
      res.locals.rooms = req.rooms = rooms;
      next();
    }
  });
};

var getUser = function(req, res, next) {
  utils.getUserStatus(req.user, client, function(err, status){
    if(err) {
      next(err);
    } else {
      res.locals.user = {
        nickname: req.user.username,
        provider: req.user.provider,
        status: status
      };
      next();
    }
  });
};

