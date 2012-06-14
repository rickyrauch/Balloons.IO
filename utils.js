
/*
 * Restrict paths
 */

exports.restrict = function(req, res, next){
  req.authenticate(['oauth'], function(error, authenticated){ 
    if(authenticated){
      next();
    }
    else{
      res.redirect('/');
    }
  });
};

/*
 * Create a room
 */       
exports.createRoom = function(req, res, client, room) {
  var room = {
      name: encodeURIComponent(req.body.room_name)
    , admin: req.getAuthDetails().user.username
    , locked: 0
  };

  client.hmset('rooms:' + req.body.room_name + ':info', room, function(err, id) {
    if(!err) {
    client.sadd('balloons:public:rooms', req.body.room_name);
    res.redirect('/rooms/' + encodeURIComponent(req.body.room_name));
    } else {
      res.send(500);
    }
  });
};

/*
 * Room name is valid
 */

exports.validRoomName = function(req, res, next) {
  if(req.body.room_name.length <= 30)
    next();
  else
    res.redirect('back');
};


/*
 * Is a valid room
 */

exports.isValidRoom = function(req, res, client, fn) { 
  client.hgetall('rooms:' + req.params.id + ':info', function(err, room) {
    if(!err && room && Object.keys(room).length) fn(room);
    else res.redirect('back');
  });
};

/*
 * Get connected users at room
 */

exports.getUsersInRoom = function(req, res, client, room, fn) {
  client.smembers('rooms:' + req.params.id + ':online', function(err, online_users) {
    var users = [];

    online_users.forEach(function(username, index) {
      client.get('users:' + username + ':status', function(err, status) {
        users.push({
            username: username
          , status: status || 'available'
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

exports.getUserStatus = function(username, client, fn){
  client.get('users:' + username + ':status', function(err, status) {
    if (!err && status) fn(status);
    else fn('available');
  });
};
/*
 * Enter to a room
 */

exports.enterRoom = function(req, res, room, users, rooms, status){
  res.locals({
    rooms: rooms,
    room_name: decodeURIComponent(room.name),
    room_id: req.params.id,
    username: req.getAuthDetails().user.username,
    user_status: status,
    users_list: users
  });
  res.render('room');
};
