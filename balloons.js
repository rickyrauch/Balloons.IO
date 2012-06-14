
/*
 * Module dependencies
 */

var express = require('express')
  , sio = require('socket.io')
  , easyoauth = require('easy-oauth')
  , redis = require('redis')
  , connect = require('express/node_modules/connect')
  , parseCookie = connect.utils.parseCookie
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
  app.use(easyoauth(config.auth));
  app.use(app.router);
});


/*
 * Routes
 */

/*
 * Homepage
 */

app.get('/', utils.restrict, function(req, res, next) {
  client.hmset(
      'users:' + req.getAuthDetails().user.username
     , req.getAuthDetails().user
  );
  res.redirect('/rooms/list');
});

/*
 * Rooms list
 */

app.get('/rooms/list', utils.restrict, function(req, res) {
  client.smembers('balloons:public:rooms', function(err, rooms) {
    res.locals({
      rooms: rooms
    });
    res.render('room_list');
  });
});

/*
 * Create a rooom
 */

app.post('/create', utils.restrict, function(req, res) {
  if(req.body.room_name.length <= 30) {
    client.hgetall('rooms:' + req.body.room_name + ':info', function(err, room) {
      if(room && Object.keys(room).length) {
        res.redirect( '/rooms/' + room.name );

      } else {
        var room = {
          name: encodeURIComponent(req.body.room_name),
          admin: req.getAuthDetails().user.username,
          locked: 0
        };

        client.hmset('rooms:' + req.body.room_name + ':info', room, function(err, id) {
          if(!err) {
            client.sadd('balloons:public:rooms', req.body.room_name);
            res.redirect('/rooms/' + encodeURIComponent(req.body.room_name));
          }
        });
      }
    });
  } else {
    res.redirect('back');
  }
});

/*
 * Join a room
 */

app.get('/rooms/:id', utils.restrict, function(req, res) {
  client.hgetall('rooms:' + req.params.id + ':info', function(err, room) {
    if(!err && room && Object.keys(room).length) {
      client.smembers('rooms:' + req.params.id + ':online', function(err, online_users) {
        var users = [];

        online_users.forEach(function(username, index) {
          client.get('users:' + username + ':status', function(err, status) {
            users.push({
              username: username,
              status: status || 'available'
            });
          });
        });

        client.smembers("balloons:public:rooms", function(err, rooms) {
          client.get('users:' + req.getAuthDetails().user.username + ':status', function(err, user_status) {
            res.locals({
              rooms: rooms,
              room_name: decodeURIComponent(room.name),
              room_id: req.params.id,
              username: req.getAuthDetails().user.username,
              user_status: user_status || 'available',
              users_list: users
            });

            res.render('room');
          })
        });
      });
    } else {
      res.redirect('back');
    }
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
      if(err || !session) {
        return accept('Error retrieving session!', false);
      }

      hsData.balloons = {
        user: session.auth.user,
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
  var hs = socket.handshake
    , nickname = hs.balloons.user.username
    , room_id = hs.balloons.room
    , now = new Date()
    // Chat Log handler
    , chatlogFileName = 'chats/' + room_id + (now.getFullYear()) + (now.getMonth() + 1) + (now.getDate()) + ".txt"
    , chatlogWriteStream = fs.createWriteStream(chatlogFileName, {'flags': 'a'});

  socket.join(room_id);

  client.sadd('users:' + nickname + ':sockets', socket.id, function(err, socketAdded) {
    if(socketAdded) {

      client.sadd('socketio:sockets', socket.id);

      client.sadd('rooms:' + room_id + ':online', nickname, function(err, userAdded) {
        if(userAdded) {
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
