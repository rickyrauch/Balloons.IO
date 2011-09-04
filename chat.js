var express = require('express'),
sys = require('sys'),
sio = require('socket.io'),
auth= require('connect-auth'),
redis = require("redis"),
client = redis.createClient();

var consumer_key = 's6iO5CDeqZiJrpgnivltQ',
	consumer_secret = 'gqRlE3dG0m7svYWSkuIlTd0hZCO3JN5Bk4eYch5KE';

var access_token= '308711490-aGd70sodkgzAJ4xrRephF5myVXuDT025vF7RIwau';
var access_token_secret= 'vlzu0NUCzrWXUtpYnLX1o1hqFJQ3aOKH8cGUQDtsCs';



var app = express.createServer(
	express.bodyParser(),
);

app.configure(function(){
  app.set('view engine', 'jade');  
  app.use(express.static(__dirname + '/public'));
	app.use(express.cookieParser());
	app.use(express.session({ secret: 'foobar' }));
	app.use(auth( [
		auth.Twitter({consumerKey: consumer_key, consumerSecret: consumer_secret})
  ]));
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

app.get('/room/:id',protect,function(req,res,next){
	client.lindex(['rooms',req.params.id],function(err,room_name){
		res.locals({'room_name':room_name,'room_id':req.params.id});
		res.render('room');
	});
});

var io = sio.listen(app);

io.sockets.on('connection', function (socket) {
	socket.on('set nickname',function(data){
		socket.join(data.room_id);
	   socket.set('nickname', data.nickname, function () {
	    socket.set('room_id', data.room_id, function () {
				client.sadd('users'+data.room_id,data.nickname);
	 	 	socket.broadcast.to(data.room_id).emit('new user',{'nickname':data.nickname});
				client.smembers('users'+data.room_id,function(error,usrs){
					socket.emit('ready',{'user_list':usrs});
				});
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


function protect(req, res, next) {
  if( req.isAuthenticated() ) next();
  else {
    req.authenticate(function(error, authenticated) {
      if( error ) next(new Error("Problem authenticating"));
      else {
        if( authenticated === true)next();
        else if( authenticated === false ) next(new Error("Access Denied!"));
        else {
          // Abort processing, browser interaction was required (and has happened/is happening)
        }
      }
    })
  }
}
