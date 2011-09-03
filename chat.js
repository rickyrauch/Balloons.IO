var express = require('express')
  , sio = require('socket.io')

,app = express.createServer(
    express.bodyParser()
  , express.static('public')
);

var ids = [];

app.configure(function(){
  app.set('view engine', 'jade');  
});

app.get('/',function(req,res,next){
  res.render('index');
});

app.post('/create',function(req,res,next){
	ids.push(req.body.room_name);
	var room_id = ids.length - 1;
  res.redirect('/room/'+room_id);
});

app.get('/room/:id',function(req,res,next){
	res.locals({'room_name':ids[req.params.id],'room_id':req.params.id});
	res.render('room');
});

var io = sio.listen(app);

io.configure(function () {
  io.set('log level', 2);
});

io.sockets.on('connection', function (socket) {
	console.log(io);
	socket.on('set nickname',function(data){
		socket.join(data.room_id);
    socket.set('nickname', data.nickname, function () {
    	socket.broadcast.to(data.room_id).emit('new user',{nickname:data.nickname});
		});
	});

});

app.listen(3000, function (err) {
  if (err) throw err;

  console.log('listening on http://localhost:3000');
});

