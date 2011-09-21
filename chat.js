var express = require('express'),
sys = require('sys'),
sio = require('socket.io'),
easyoauth = require('easy-oauth'),
redis = require("redis"),
client = redis.createClient();


var app = express.createServer(
	express.bodyParser()
);

app.configure(function(){
  app.set('view engine', 'jade');  
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({ secret: 'foobar' }));
  app.use(easyoauth(require('./keys_file')));
  app.use(app.router);
});

app.get('/',function(req,res,next){
	client.lrange(['rooms',0,-1],function(err,rooms){
		res.locals({'rooms':rooms});
	  res.render('index');
	});
});

app.post('/create',function(req,res,next){
	client.rpush('rooms',req.body.room_name);
	client.llen('rooms',function(err,len){
		res.redirect('/room/'+(len - 1));
	});
});

app.get('/room/:id',function(req,res,next){
	if(req.getAuthDetails().user){
		client.lindex(['rooms',req.params.id],function(err,room_name){
			client.smembers('users'+req.params.id,function(error,user_list){
					res.locals({'room_name':room_name,'room_id':req.params.id,'username': req.getAuthDetails().user.username,'user_list':user_list});
					res.render('room');
			});
		});
	}
	else
		res.redirect('back');
});

var io = sio.listen(app);

io.sockets.on('connection', function (socket) {
	socket.on('set nickname',function(data){
		socket.join(data.room_id);
	   socket.set('nickname', data.nickname, function () {
	    socket.set('room_id', data.room_id, function () {
				client.sadd('users'+data.room_id,data.nickname);
	 	 		socket.broadcast.to(data.room_id).emit('new user',{'nickname':data.nickname});
			});
		});
	});

	socket.on('my msg',function(data){
		socket.get('nickname',function(err,nickname){
			socket.get('room_id',function(err,room_id){			
	 		 	io.sockets.in(room_id).emit('new msg',{'nickname':nickname,'msg':data.msg});		
			});
		});
	});

	socket.on('disconnect',function(){
		socket.get('nickname',function(err,nickname){
			socket.get('room_id',function(e,room_id){
				client.srem('users'+room_id,nickname);
		  	io.sockets.in(room_id).emit('user leave',{'nickname': nickname});		
			});
		});
	});
});

app.listen(3000, function (err) {
  if (err) throw err;
  console.log('listening on http://localhost:3000');
});

