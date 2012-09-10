
/*
 * Module dependencies
 */

var parent = module.parent.exports 
  , app = parent.app
  , server = parent.server
  , express = require('express')
  , client = exports.client = parent.client
  , api = require('./api')
  , sessionStore = parent.sessionStore
  , sio = require('socket.io')
  , parseCookies = require('connect').utils.parseSignedCookies
  , cookie = require('cookie')
  , config = require('./config.json')
  , fs = require('fs');


var io = sio.listen(server);
io.set('authorization', function (hsData, accept) {
  if(hsData.headers.cookie) {
    var cookies = parseCookies(cookie.parse(hsData.headers.cookie), config.session.secret)
      , sid = cookies['balloons'];

    sessionStore.load(sid, function(err, session) {
      if(err || !session) {
        return accept('Error retrieving session!', false);
      }

      api.redis.getUser(session.passport.user, function(err, user) {
        if(err) return accept(err, false);
        
        hsData.balloons = {
          user: user,
          room: /\/(?:([^\/]+?))\/?$/g.exec(hsData.headers.referer)[1]
        };

        return accept(null, true);
      });
      
    });
  } else {
    return accept('No cookie transmitted.', false);
  }
});

io.configure(function() {
  io.set('store', new sio.RedisStore);
  io.enable('browser client minification');
  io.enable('browser client gzip');
});


io.sockets.on('connection', function (socket) {
  var hs = socket.handshake
    , user = hs.balloons.user
    , userKey = user.key
    , username = user.username
    , provider = user.provider
    , userStatus = user.status
    , room_id = hs.balloons.room
    , now = new Date()
    // Chat Log handler
    , chatlogFileName = './chats/' + room_id + (now.getFullYear()) + (now.getMonth() + 1) + (now.getDate()) + ".txt"
    , chatlogWriteStream = fs.createWriteStream(chatlogFileName, {'flags': 'a'});

  socket.join(room_id);

  api.redis.manageSocketOnConnection(userKey, room_id, socket.id, function(err) {
    if(err) return console.error(err);
    api.redis.addUserToRoom(room_id, userKey, function(err) {
      if(err) return console.error(err);
      api.redis.updateRoomCounter(room_id, 1, function(err) {
        if(err) return console.log(err);
        io.sockets.in(room_id).emit('new user', {
          username: username,
          provider: provider,
          status: userStatus || 'available'
        });
      })
    })
  });

  socket.on('my msg', function(data) {
    var no_empty = data.msg.replace("\n","");
    if(no_empty.length > 0) {
      var chatlogRegistry = {
        type: 'message',
        from: userKey,
        atTime: new Date(),
        withData: data.msg
      }

      chatlogWriteStream.write(JSON.stringify(chatlogRegistry) + "\n");
      
      io.sockets.in(room_id).emit('new msg', {
        key: userKey,
        username: username,
        provider: provider,
        msg: data.msg
      });        
    }   
  });

  socket.on('set status', function(data) {
    //revisar si hace falta actualizar el valor en la session!!
    userStatus = data.status;

    api.redis.updateUserStatus(userKey, userStatus, function(err) {
      if(err) return console.error(err);
      io.sockets.emit('user-info update', {
        username: username,
        provider: provider,
        status: userStatus || 'available'
      });
    });
  });

  socket.on('history request', function() {
    var history = [];
    var tail = require('child_process').spawn('tail', ['-n', 5, chatlogFileName]);
    tail.stdout.on('data', function (data) {
      var lines = data.toString('utf-8').split("\n");
      
      lines.forEach(function(line, index) {
        if(line.length) {
          var historyLine = JSON.parse(line);
          history.push(historyLine);
        }
      });

      socket.emit('history response', {
        history: history
      });
    });
  });

  socket.on('disconnect', function() {
    api.redis.manageSocketOnDisconnection(userKey, room_id, socket.id, function(err) {
      if(err) return console.error(err);
      api.redis.getClientSocketsCount(userKey, room_id, function(err, count) {
        if(err) return console.error(err);
        if(!count) {
          api.redis.removeUserFromRoom(room_id, userKey, function(err) {
            if(err) return console.error(err);
            api.redis.updateRoomCounter(room_id, -1, function(err) {
              if(err) return console.error(err);
              chatlogWriteStream.destroySoon();
              io.sockets.in(room_id).emit('user leave', {
                username: username,
                provider: provider
              });
            });
          });
        };
      });
    });
  });

});
