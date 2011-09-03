var express = require('express'),
sio = require('socket.io'),
redis = require("redis"),
client = redis.createClient();

var rooms = 0;

var app = express.createServer(
    express.bodyParser()
);

app.configure(function(){
  app.set('view engine', 'jade');  
});

app.get('/',function(req,res,next){
	client.smembers('rooms');
  res.render('index');
});

app.post('/create',function(req,res,next){
	client.set(rooms,req.body.room_name);
	res.redirect('/room/'+rooms);
	rooms++;
});

app.get('/room/:id',function(req,res,next){
	client.get(req.params.id,function(err,room_name){
		res.locals({'room_name':room_name,'room_id':req.params.id});
		res.render('room');
	});
});

var io = sio.listen(app);

io.sockets.on('connection', function (socket) {
	socket.on('set nickname',function(data){
		socket.join(data.room_id);
    socket.set('nickname', data.nickname, function () {
    });
		client.sadd('users'+data.room_id,data.nickname);
  	socket.broadcast.to(data.room_id).emit('new user',{'nickname':data.nickname});
		client.smembers('users'+data.room_id,function(error,usrs){
			socket.emit('ready',{'user_list':usrs});
		});
	});

	socket.on('my msg',function(data){
		socket.get('nickname',function(err,nickname){
	  	io.sockets.in(data.room_id).emit('new msg',{'nickname':nickname,'msg':data.msg});		
		});
	});

});

app.listen(3000, function (err) {
  if (err) throw err;

  console.log('listening on http://localhost:3000');
});

