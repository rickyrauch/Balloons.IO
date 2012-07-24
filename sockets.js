
/*
 * Module dependencies
 */

var parent = module.parent.exports 
  , app = parent.app
  , client = parent.client
  , sessionStore = parent.sessionStore
  , sio = require('socket.io');

var io = sio.listen(app);

io.set('authorization', function (hsData, accept) {
  if(hsData.headers.cookie) {
    var cookie = app.parseCookie(hsData.headers.cookie)
      , sid = cookie['balloons'];

    sessionStore.load(sid, function(err, session) {
      if(err || !session) {
        return accept('Error retrieving session!', false);
      }

      hsData.balloons = {
        user: session.passport.user,
        room: /\/rooms\/(?:([^\/]+?))\/?$/g.exec(hsData.headers.referer)[1]
      };

      return accept(null, true);
      
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
  console.log(socket.handshake.balloons);
  var hs = socket.handshake
    , nickname = hs.balloons.user.username
    , room_id = hs.balloons.room
    , now = new Date()
    // Chat Log handler
    , chatlogFileName = './chats/' + room_id + (now.getFullYear()) + (now.getMonth() + 1) + (now.getDate()) + ".txt"
    , chatlogWriteStream = fs.createWriteStream(chatlogFileName, {'flags': 'a'});

  socket.join(room_id);

  client.sadd('users:' + nickname + ':sockets', socket.id, function(err, socketAdded) {
    if(socketAdded) {
      client.sadd('socketio:sockets', socket.id);
      client.sadd('rooms:' + room_id + ':online', nickname, function(err, userAdded) {
        if(userAdded) {
          client.hincrby('rooms:' + room_id + ':info', 'online', 1);
          client.get('users:' + nickname + ':status', function(err, status) {
            io.sockets.in(room_id).emit('new user', {
              nickname: nickname,
              status: status || 'available'
            });
          });
        }
      });
    }
  });

  socket.on('my msg', function(data) {
    var no_empty = data.msg.replace("\n","");
    if(no_empty.length > 0) {
      var chatlogRegistry = {
        type: 'message',
        from: nickname,
        atTime: new Date(),
        withData: data.msg
      }

      chatlogWriteStream.write(JSON.stringify(chatlogRegistry) + "\n");
      
      io.sockets.in(room_id).emit('new msg', {
        nickname: nickname,
        msg: data.msg
      });        
    }   
  });

  socket.on('set status', function(data) {
    var status = data.status;

    client.set('users:' + nickname + ':status', status, function(err, statusSet) {
      io.sockets.emit('user-info update', {
        username: nickname,
        status: status
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
    // 'sockets:at:' + room_id + ':for:' + nickname
    client.srem('users:' + nickname + ':sockets', socket.id, function(err, removed) {
      if(removed) {
        client.srem('socketio:sockets', socket.id);
        client.scard('users:' + nickname + ':sockets', function(err, members_no) {
          if(!members_no) {
            client.srem('rooms:' + room_id + ':online', nickname, function(err, removed) {
              if (removed) {
                client.hincrby('rooms:' + room_id + ':info', 'online', -1);
                chatlogWriteStream.destroySoon();
                io.sockets.in(room_id).emit('user leave', {
                  nickname: nickname
                });
              }
            });
          }
        });
      }
    });
  });
});
