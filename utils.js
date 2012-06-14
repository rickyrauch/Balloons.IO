
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
exports.createRoom = function(client, room, req) {
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
