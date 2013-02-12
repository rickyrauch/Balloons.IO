
/*
 * Module dependencies
 */

var redis = require('redis')
  , debug = require('debug')('Balloons:db');

var DB = function(options) {
  if(options.redistogo) {
    var rtg = require('url').parse(options.redistogo.url);
    this.client = redis.createClient(rtg.port, rtg.hostname);
    // auth 1st part is username and 2nd is password separated by ":"
    this.client.auth(rtg.auth.split(':')[1]);
  } else {
    this.client = redis.createClient();
  }

  return this;
};

DB.createConnection = function(options) {
  return new DB(options);
};

module.exports = DB;

DB.prototype.removePath = function(path, fn) {
  this.client.keys(path, function(err, keys){
    this.del(keys, fn); 
  });
};

DB.prototype.users = {};
DB.prototype.sockets = {};
DB.prototype.rooms = {};

/*DB.prototype.users.remove = function(fn) {
};*/

DB.prototype.sockets.clean = function(fn) {
  this.client.smembers('socketio:sockets', function(err, sockets) {
    if(sockets.length) client.del(sockets);
      debug('Sockets cleaned');
  });
};

DB.prototype.clean = function(fn) {
  debug('Cleaning db');
  this.removePath('sockets:for:*', function(err){
    debug("Deleted sockets reference for each user >> %s", err || "Done!");
  });

  this.removePath('rooms:*:users*', function(err){
    debug("Deleted users reference in rooms >> %s", err || "Done!");
  });

  this.sockets.clean();
};

DB.prototype.user.getRooms = function(id, fn) {
  this.client
      .multi()
      .
  this.client.smembers('rooms:public', function(err, rooms){
  });
};

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
