
/*
 * Module dependencies
 */

var express = require('express')
  , sio = require('socket.io')
  , easyoauth = require('easy-oauth')
  , redis = require('redis')
  , RedisStore = require('connect-redis')(express)
  , config = require('./config.json')
  , utils = require('./utils')
  , fs = require('fs');

/*
 * Instantiate redis
 */

var client = redis.createClient();

/*
 * Clean all forgoten sockets in Redis.io
 */

// Delete all users sockets from their lists
client.keys('users:*:sockets', function(err, keys) {
    client.del(keys);
    console.log('Deleted all user\'s sockets lists', err);
});

// No one is online when starting up
client.keys('rooms:*:online', function(err, keys) {
    keys.forEach(function(key, index) {
        client.del(key);
    });
    console.log('Deleted all rooms\'s online users lists', err);
});

// Delete all socket.io's sockets data from Redis
client.smembers('socketio:sockets', function(err, sockets) {
    var num = sockets.length;
    sockets.forEach(function(socketId, index) {
        client.del(socketId, function(err, deleted) {
            if(index == num - 1) {
                client.del('socketio:sockets', function(err, deleted) {
                    console.log('Deletion of socket.io storage Done!', deleted, err);
                });
            }
        });
    });
});


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
        store: new RedisStore
    }));
    app.use(easyoauth(config.auth));
    app.use(app.router);
});

/*
 * Routes
 */

app.get('/', function(req, res, next) {
    req.authenticate(['oauth'], function(error, authenticated) { 
        if(authenticated) {
            client.hmset('users:' + req.getAuthDetails().user.username, req.getAuthDetails().user);
            res.redirect('/rooms/list');
        } else {
            res.render('index');
        } 
    });
});

app.get('/rooms/list', utils.restrict, function(req, res) {
    client.smembers('balloons:public:rooms', function(err, rooms) {
        res.locals({
            rooms: rooms
        });
        res.render('room_list');
    });
});

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
                        res.redirect('/rooms/' + encodeURIComponent(req.body.room_name));
                        client.sadd('balloons:public:rooms', req.body.room_name);
                    }
                });
            }
        });
    } else {
        res.redirect('back');
    }
});

app.get('/rooms/:id', utils.restrict, function(req, res) {
    client.hgetall('rooms:' + req.params.id + ':info', function(err, room) {
    	if(Object.keys(room).length) {
            client.smembers('rooms:' + req.params.id + ':online', function(err, online_users) {
                var users = []
                  , user_status = 'available';

                online_users.forEach(function(username, index) {
                    client.get('users:' + username + ':status', function(err, status) {
                        if(req.getAuthDetails().user.username == username) {
                            user_status = status || 'available';
                        }
                        users.push({
                            username: username,
                            status: status || 'available'
                        });
                    });
                });

                client.smembers("balloons:public:rooms", function(err, rooms) {

                    res.locals({
                        rooms: rooms,
                        room_name: room.name,
                        room_id: req.params.id,
                        username: req.getAuthDetails().user.username,
                        user_status: user_status,
                        users_list: users
                    });

                    res.render('room');
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

io.configure(function() {
	io.set('store', new sio.RedisStore);
	io.enable('browser client minification');
	io.enable('browser client gzip');
});


io.sockets.on('connection', function (socket) {
    var chatlogFileName,
        chatlogWriteStream;

	socket.on('set nickname', function(data) {
        var nickname = data.nickname
           , room_id = data.room_id
           , now = new Date();

        socket.join(room_id);

        /*
         * Chat Log handler
         *
         * Use of {'flags': 'a'} to append
         * and {'flags': 'w'} to erase and write
         *
         */
        chatlogFileName = room_id + (now.getFullYear()) + (now.getMonth() + 1) + (now.getDate()) + ".txt"
        chatlogWriteStream = fs.createWriteStream(chatlogFileName, {'flags': 'a'});

        socket.set('nickname', nickname, function () {
            socket.set('room_id', room_id, function () {

                client.sadd('users:' + nickname + ':sockets', socket.id, function(err, socketAdded) {
                    if(socketAdded) {

                        client.sadd('socketio:sockets', socket.id);

                        client.sadd('rooms:' + room_id + ':online', nickname, function(err, userAdded) {
                            if(userAdded) {
                                client.get('users:' + nickname + ':status', function(err, status) {
                                    socket.emit('ready');
                                    io.sockets.in(data.room_id).emit('new user', {
                                        nickname: nickname,
                                        status: status || 'available'
                                    });
                                });
                            }
                        });
                    }
                });
            });
		});
	});

	socket.on('my msg', function(data) {
		socket.get('nickname', function(err, nickname) {
			socket.get('room_id', function(err, room_id) {	
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
		});
	});

    socket.on('set status', function(data) {
        var status = data.status;

        socket.get('nickname', function(err, nickname) {
            client.set('users:' + nickname + ':status', status, function(err, statusSet) {
                io.sockets.emit('user-info update', {
                    username: nickname,
                    status: status
                });
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
        socket.get('room_id', function(err, room_id) {
            socket.get('nickname', function(err, nickname) {
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
    });
});


app.listen(3000);

console.log('Balloons.io started at port %d', app.address().port);
