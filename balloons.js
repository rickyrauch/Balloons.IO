/*
 * Module dependencies
 */

var express = require('express')
  , sio = require('socket.io')
  , redis = require('redis')
  , connect = require('express/node_modules/connect')
  , parseCookie = connect.utils.parseCookie
  , passport = require('passport')
  , RedisStore = require('connect-redis')(express)
  , sessionStore = new RedisStore
  , config = require('./config.json')
  , utils = require('./utils')
  , fs = require('fs')
  , init = require('./init');


/*
 * Instantiate redis
 */

var client = redis.createClient();

/*
 * Clean db and create folder
 */

init(client);

require('./strategy');

/*
 * Create and config server
 */

var app = express.createServer();

app.configure(function() {
  app.set('view engine', 'jade'); 
  app.set('views', __dirname + '/views/themes/' + config.theme.name);
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({
    secret: config.session.secret,
    key: "balloons",
    store: sessionStore
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
});

/*
 * Routes
 */

/*
 * Homepage
 */

app.get('/', function(req, res, next) {
  if(req.isAuthenticated()){
    client.hmset(
        'users:' + req.user.username
      , req.user
    );
    res.redirect('/rooms/list');
  } else{
    res.render('index');
  }
});

/*
 * Authentication routes
 */

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/callback', 
  passport.authenticate('twitter', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/');
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

/*
 * Rooms list
 */

app.get('/rooms/list', utils.restrict, function(req, res) {
  utils.getPublicRoomsInfo(client, function(rooms) {
    res.render('room_list', { rooms: rooms });
  });
});

/*
 * Create a rooom
 */

app.post('/create', utils.restrict, function(req, res) {
  utils.validRoomName(req, res, function(roomKey) {
    utils.roomExists(req, res, client, roomKey, function() {
      utils.createRoom(req, res, client, roomKey);
    });
  });
});

/*
 * Join a room
 */

app.get('/rooms/:id', utils.restrict, function(req, res) {
  utils.getRoomInfo(req, res, client, function(room) {
    utils.getUsersInRoom(req, res, client, room, function(users) {
      utils.getPublicRoomsInfo(client, function(rooms) {
        utils.getUserStatus(req.user.username, client, function(status) {
          utils.enterRoom(req, res, room, users, rooms, status);
        });
      });
    });
  });
});


/*
 * Socket.io
 */

var io = sio.listen(app);

io.set('authorization', function (hsData, accept) {
  if(hsData.headers.cookie) {
    var cookie = parseCookie(hsData.headers.cookie)
      , sid = cookie['balloons'];

    sessionStore.load(sid, function(err, session) {
      console.log(session);
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


app.listen(config.app.port);

console.log('Balloons.io started at port %d', app.address().port);
