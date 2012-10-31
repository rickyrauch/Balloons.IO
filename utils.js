var crypto = require('crypto');


/*
 * Generates a URI Like key for a room
 */       

var genRoomKey = function() {
  var shasum = crypto.createHash('sha1');
  shasum.update(Date.now().toString());
  return shasum.digest('hex').substr(0,6);
};

/*
 * Is room available
 */

exports.availableRoom = function(client, name, fn) {
  var valid = validRoomName(name);
  roomExists(client, name, function(exists) {
    if(!exists && valid) fn(true);
    else fn(false);
  });
};

/*
 * Valid room name
 */

var validRoomName = function(name) {
  name = name.trim();
  var name_len = name.length;
  return name_len < 255 && name_len > 0;
};

/*
 * Checks if room exists
 */
var roomExists = function(client, name, fn) {
  client.hget('balloons:rooms:keys', encodeURIComponent(name), function(err, roomKey) {
    if(!err && roomKey) {
      fn(true);
    } else {
      fn(false)
    }
  });
};

/*
 * Creates a room
 */       

exports.createRoom = function(client, room_name, user, fn) {
  var room_key = genRoomKey()
    , room = {
        key: room_key,
        name: room_name,
        admin: user.provider + ":" + user.username,
        locked: 0,
        online: 0
      };

  client.hmset('rooms:' + room_key + ':info', room, function(err, ok) {
    if(!err && ok) {
      client.hset('balloons:rooms:keys', encodeURIComponent(room_name), room_key);
      client.sadd('balloons:public:rooms', room_key);
      fn(null, room_key);
    } else {
      fn(err, null);
    }
  });
};

/*
 * Get Room Info
 */

exports.getRoomInfo = function(client, id, fn) { 
  client.hgetall('rooms:' + id + ':info', function(err, room) {
    if(!err && room && Object.keys(room).length) fn(null, room);
    else fn(err, null);
  });
};

exports.getPublicRoomsInfo = function(client, fn) {
  client.smembers('balloons:public:rooms', function(err, public_rooms) {
    var rooms = []
      , len = public_rooms.length;
    if(!len) fn([]);

    public_rooms.sort(caseInsensitiveSort);

    public_rooms.forEach(function(room_key, index) {
      client.hgetall('rooms:' + room_key + ':info', function(err, room) {
        // prevent for a room info deleted before this check
        if(!err && room && Object.keys(room).length) {
          // add room info
          rooms.push({
            key: room.key || room.name, // temp
            name: room.name,
            online: room.online || 0
          });

          // check if last room
          if(rooms.length == len) fn(null, rooms);
        } else {
          if(err) return fn(err, null);
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

exports.getUsersInRoom = function(client, id, room, fn) {
  client.smembers('rooms:' + id + ':online', function(err, online_users) {
    var users = [];

    online_users.forEach(function(user_key, index) {
      client.get('users:' + user_key + ':status', function(err, status) {
        var msn_data = user_key.split(':')
          , username = msn_data.length > 1 ? msn_data[1] : msn_data[0]
          , provider = msnData.length > 1 ? msn_data[0] : "twitter";

        users.push({
            username: username,
            provider: provider,
            status: status || 'available'
        });
      });
    });

    fn(err, users);
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
    if (!err && status) fn(null, status);
    else if(!err) fn(null, 'available');
    else fn(err, null);
  });
};

/*
 * Sort Case Insensitive
 */

var caseInsensitiveSort = function (a, b) { 
   var ret = 0;

   a = a.toLowerCase();
   b = b.toLowerCase();

   if(a > b) ret = 1;
   if(a < b) ret = -1; 

   return ret;
};
