var crypto = require('crypto')
  , type = require('component-type');

/*
 * Restrict paths
 */

exports.restrict = function(req, res, next){
  if(req.isAuthenticated()) next();
  else res.redirect('/');
};

/*
 * Generates a URI Like key for a room
 */       

exports.genRoomKey = function() {
  var shasum = crypto.createHash('sha1');
  shasum.update(Date.now().toString());
  return shasum.digest('hex').substr(0,6);
};

/*
 * Room name is valid
 */

exports.validRoomName = function(req, res, fn) {
  req.body.room_name = req.body.room_name.trim();
  var nameLen = req.body.room_name.length;

  if(nameLen < 255 && nameLen >0) {
    fn();
  } else {
    res.redirect('back');
  }
};

/*
 * Checks if room exists
 */
exports.roomExists = function(req, res, client, fn) {
  client.hget('balloons:rooms:keys', encodeURIComponent(req.body.room_name), function(err, roomKey) {
    if(!err && roomKey) {
      res.redirect( '/' + roomKey );
    } else {
      fn()
    }
  });
};

/*
 * Creates a room
 */       
exports.createRoom = function(req, res, client) {
  var roomKey = exports.genRoomKey()
    , room = {
        key: roomKey,
        name: req.body.room_name,
        admin: req.user.provider + ":" + req.user.username,
        locked: 0,
        online: 0
      };

  client.hmset('rooms:' + roomKey + ':info', room, function(err, ok) {
    if(!err && ok) {
      client.hset('balloons:rooms:keys', encodeURIComponent(req.body.room_name), roomKey);
      client.sadd('balloons:public:rooms', roomKey);
      res.redirect('/' + roomKey);
    } else {
      res.send(500);
    }
  });
};

/*
 * Get Room Info
 */

exports.getRoomInfo = function(req, res, client, fn) { 
  client.hgetall('rooms:' + req.params.id + ':info', function(err, room) {
    if(!err && room && Object.keys(room).length) fn(room);
    else res.redirect('back');
  });
};

exports.getPublicRoomsInfo = function(client, fn) {
  client.smembers('balloons:public:rooms', function(err, publicRooms) {
    var rooms = []
      , len = publicRooms.length;
    if(!len) fn([]);

    publicRooms.sort(exports.caseInsensitiveSort);

    publicRooms.forEach(function(roomKey, index) {
      client.hgetall('rooms:' + roomKey + ':info', function(err, room) {
        // prevent for a room info deleted before this check
        if(!err && room && Object.keys(room).length) {
          // add room info
          rooms.push({
            key: room.key || room.name, // temp
            name: room.name,
            online: room.online || 0
          });

          // check if last room
          if(rooms.length == len) fn(rooms);
        } else {
          // reduce check length
          len -= 1;
        }
      });
    });
  });
};
/*
 * Get connected users at room
 */

exports.getUsersInRoom = function(req, res, client, room, fn) {
  client.smembers('rooms:' + req.params.id + ':online', function(err, online_users) {
    var users = [];

    online_users.forEach(function(userKey, index) {
      client.get('users:' + userKey + ':status', function(err, status) {
        var msnData = userKey.split(':')
          , username = msnData.length > 1 ? msnData[1] : msnData[0]
          , provider = msnData.length > 1 ? msnData[0] : "twitter";

        users.push({
            username: username,
            provider: provider,
            status: status || 'available'
        });
      });
    });

    fn(users);

  });
};

/*
 * Get public rooms
 */

exports.getPublicRooms = function(client, fn){
  client.smembers("balloons:public:rooms", function(err, rooms) {
    if (!err && rooms) fn(rooms);
    else fn([]);
  });
};
/*
 * Get User status
 */

exports.getUserStatus = function(user, client, fn){
  client.get('users:' + user.provider + ":" + user.username + ':status', function(err, status) {
    if (!err && status) fn(status);
    else fn('available');
  });
};

/*
 * Enter to a room
 */

exports.enterRoom = function(req, res, room, users, rooms, status){
  res.locals({
    room: room,
    rooms: rooms,
    user: {
      nickname: req.user.username,
      provider: req.user.provider,
      status: status
    },
    users_list: users
  });
  res.render('room');
};

/*
 * Sort Case Insensitive
 */

exports.caseInsensitiveSort = function (a, b) { 
   var ret = 0;

   a = a.toLowerCase();
   b = b.toLowerCase();

   if(a > b) ret = 1;
   if(a < b) ret = -1; 

   return ret;
};

/**
 * Merge object `b` into `a`.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api public
 */

exports.merge = function merge(a, b) {
  for (var key in b) {
    if (exports.has.call(b, key) && b[key]) {
      if ('object' === type(b[key])) {
        if ('undefined' === type(a[key])) a[key] = {};
        exports.merge(a[key], b[key]);
      } else {
        a[key] = b[key];
      }
    }
  }
  return a;
};

/**
 * HOP 
 */

exports.has = Object.prototype.hasOwnProperty;
