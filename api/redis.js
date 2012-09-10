// To check if a user can join a room, if rooms is private, then 
// it has to be into his "prs" (private-rooms) 
var parent = module.parent.exports
	, utils = require('../utils')
	, client = parent.client;

var keys = {
	room: function(rid) {
		return 'rooms:$'.replace('$', rid);
	},

	roomUsers: function(rid) {
		return 'rooms:$:users'.replace('$', rid);
	},

	user: function(uid) {
		return 'users:$'.replace('$', uid);
	},

	roomsKeys: function(params) {
		return 'balloons:rooms:keys';
	},

	publicRooms: function(params) {
		return 'balloons:public:rooms';
	},

	clientSockets: function(uid, sid) {
		return 'sockets:for:$:at:$'.replace('$', uid).replace('$', sid);
	},

	appSockets: function(params) {
		return 'socket.io:sockets';
	}
};


/*
 *	HASH: Room
 *	rooms:<room_key>
 *	|- key: <room_key> [hashGeneratedValue]
 *	|- name: <room_name> [submitedName]
 *	|- admin: <user_key> [ <user_provider>:<user_provider_id> ]
 *	|- locked: [Boolean]
 * 	|- online: [Number] [ (SET) rooms:<room_key>:users ]
 *
*/

exports.createRoom = function(roomData, roomAdmin, fn) {
	var room = {
		key: utils.genRoomKey(),
		name: roomData.room_name,
		admin: utils.genUserKey(roomAdmin),
		locked: 0,
		online: 0
	};

	client.hmset(keys.room(room.key), room, function(err, saved) {
		if(err) return fn(err);
		if(!saved) return fn("Couldn't create room.");
		exports.addRoomKey(room);
		exports.addPublicRoom(room);
		return fn(null, room);
	});
};

exports.getRoom = function(roomKey, fn) {
	client.hgetall(keys.room(roomKey), function(err, room) {
		if(err) return fn(err);
		if(!room) return fn("Room not found!");
		return fn(null, room);
	});
};

exports.getFullRoom = function(roomKey, fn) {
	exports.getRoom(roomKey, function(err, room) {
		if(err) return fn(err);
		if(!room) return fn("Room not found!");
		exports.getRoomUsers(roomKey, function(err, users) {
			if(err) return fn(err);
			room.users = users;
			return fn(null, room);
		})
	});
};

exports.updateRoomCounter = function(roomKey, value, fn) {
	client.hincrby(keys.room(roomKey), 'online', value, function(err, saved) {
		if(err) return fn(err);
		if(!saved) return fn("Couldn't update room counter!");
		return fn(null);
	})
}
/*
 *	SET: Public Rooms
 *	balloons:public:rooms
 *	[<room_key>, <room_key>, ... ]
 *
*/
exports._getPublicRoomsKeys = function(fn) {
	client.smembers(keys.publicRooms(), function(err, roomKeys) {
		if(err) return fn(err);
		if(!roomKeys.length) return fn(null, []);
		return fn(null, roomKeys);
	});
};

exports.getPublicRooms = function(fn) {
	var multi = client.multi();
	exports._getPublicRoomsKeys(function(err, roomsKeys) {
		roomsKeys.forEach(function(roomKey) {
			multi.hgetall(keys.room(roomKey));
		});
		multi.exec(function(err, rooms) {
			return fn(err, rooms);
		})
	});
};


/*
 *	SET: Room Online Users
 *	rooms:<room_key>:users
 *	|- [<room_key>, <room_key>, ... ]
 *
*/
exports._getRoomUsersKeys = function(roomKey, fn) {
	client.smembers(keys.roomUsers(roomKey), function(err, users) {
		if(err) return fn(err);
		return fn(null, users);
	});
};

exports.getRoomUsers = function(roomKey, fn) {
	var users = [];
	exports._getRoomUsersKeys(roomKey, function(err, usersKeys) {
		if(err) return fn(err);
		var multi = client.multi();
		usersKeys.forEach(function(userKey) {
			multi.hgetall(keys.user(userKey), function(err, user) {
				// if(err) return fn(err);
				// if(!user) return fn("Coudn't find user.");
				return user;
			});
		});
		multi.exec(function(err, results) {
			results.forEach(function(u) {
				users.push(utils.clearUserInfo(u));
			});
			return fn(null, users);
		});
	});
};

exports.addUserToRoom = function(roomKey, userKey, fn) {
	client.sadd(keys.roomUsers(roomKey), userKey, function(err, saved) {
		if(err) return fn(err);
		if(!saved) return fn("Couldn't add user to room.");
		return fn(null);
	})
};

exports.removeUserFromRoom = function(roomKey, userKey, fn) {
	client.srem(keys.roomUsers(roomKey), userKey, function(err, removed) {
		if(err) return fn(err);
		if(!removed) return fn("Couldn't remove user from room.");
		return fn(null);
	})
};

exports.removeAllUsersFromRooms = function() {
  client.keys(keys.roomUsers('*'), function(err, keys) {
    if(err) return console.error(err);
    var roomNames = []
      , multi = client.multi()
      , key;
    
    if(keys.length) {
      roomNames = roomNames.concat(keys);
      client.del(keys);
    }

    roomNames.forEach(function(roomName, index) {
      key = roomName.replace(':users', '');
      multi.hset(key, 'online', 0);
    });

    multi.exec(function(err, results) {
      return console.log('Deletion of online users from rooms >> ', err || "Done!");
    });
  });
};


/*
 *	HASH: User
 *	users:<user_key>
 *	|- key: <user_key>
 *	|- status: <status>
 *	|- [passport-data]
 *
*/

exports.createUser = function(passport, fn) {
	passport.key = utils.genUserKey(passport);
	passport.status = 'available';
	client.hmset(keys.user(passport.key), passport, function(err, saved) {
		if(err) return fn(err);
		if(!saved) return fn("Couldn't create user.");
		return fn(null, passport);
	});
};

exports.getUser = function(userKey, fn) {
	client.hgetall(keys.user(userKey), function(err, user) {
		if(err) return fn(err);
		if(!user) return fn("Coudn't find user.");
		return fn(null, user);
	});
};

exports.getOrCreateUser = function(passport, fn) {
	exports.getUser(utils.genUserKey(passport), function(err, user) {
		// I should avoid error and create user instead!
		// if(err) return fn(err);
		if(user) return fn(null, user);
		exports.createUser(passport, function(err, user) {
			if(err) return fn(err);
			console.log('created user');
			return fn(null, user);
		});
	});
}

exports.updateUserField = function(userKey, fieldName, value, fn) {
	client.hset(keys.user(userKey), fieldName, value, function(err, isNew) {
		if(err) return fn(err); //Couldn't update user field!
		return fn(null);
	})
}
exports.updateUserStatus = function(userKey, statusUpdate, fn) {
	// faltaria aca hacer el checkeo de los status validos!!
	exports.updateUserField(userKey, 'status', statusUpdate, function(err) { // this is same as fn does!
		if(err) return fn(err);
		return fn(null);
	});
};


/*
 *	SET: SocketIO Sockets
 *	socket.io:sockets 
 *	|- [<soket_id>, <soket_id>, ... ]
 *
*/

exports.addSocketToApp = function(socketId, fn) {
	client.sadd(keys.appSockets(), socketId, function(err, saved) {
		if(err) return fn(err);
		if(!saved) return fn("Couldn't save socket to App!");
		return fn(null);
	});
};

exports.removeSocketFromApp = function(socketId, fn) {
	client.srem(keys.appSockets(), socketId, function(err, removed) {
		if(err) return fn(err);
		if(!removed) return fn("Couldn't remove socket from App!");
		return fn(null);
	});
};

exports.removeAllSocketIOSockets = function() {
  client.smembers(keys.appSockets(), function(err, sockets) {
    if(sockets.length) client.del(sockets);
    client.del(keys.appSockets());
    return console.log('Deletion of socket.io stored sockets data >> ', err || "Done!");
  });
};


/*
 *	SET: Client Sockets
 *	sockets:for:<user_key>:at:<room_key> 
 *	|- [<soket_id>, <soket_id>, ... ]
 *
*/

exports.addSocketToClient = function(userKey, roomId, socketId, fn) {
	client.sadd(keys.clientSockets(userKey, roomId), socketId, function(err, saved) {
		if(err) return fn(err);
		if(!saved) return fn("Couldn't add socket to client list");
		return fn(null);
	});
};

exports.removeSocketFromClient = function(userKey, roomId, socketId, fn) {
	client.srem(keys.clientSockets(userKey, roomId), socketId, function(err, removed) {
		if(err) return fn(err);
		if(!removed) return fn("Couldn't remove socket from client list");
		return fn(null);
	});
};

exports.getClientSocketsCount = function(userKey, roomId, fn) {
	client.scard(keys.clientSockets(userKey, roomId), function(err, count) {
		if(err) return fn(err);
		return fn(null, count);
	});
};

exports.deleteAllClientSockets = function() {
  client.keys(keys.clientSockets('*','*'), function(err, keys) {
    if(keys.length) client.del(keys);
    console.log('Deletion of sockets reference for each user >> ', err || "Done!");
  });
}

exports.manageSocketOnConnection = function(userKey, roomId, socketId, fn) {
	exports.addSocketToClient(userKey, roomId, socketId, function(err) {
		if(err) return fn(err);
		exports.addSocketToApp(socketId, function(err) { // this is same as fn does!
			if(err) return fn(err);
			return fn(null);
		});
	});
};

exports.manageSocketOnDisconnection = function(userKey, roomId, socketId, fn) {
	exports.removeSocketFromClient(userKey, roomId, socketId, function(err) {
		if(err) return fn(err);
		exports.removeSocketFromApp(socketId, function(err) { // this is same as fn does!
			if(err) return fn(err);
			return fn(null);
		});
	});
};


/*
 *	HASH: Room Keys track
 *	balloons:rooms:keys 
 *	|- <room_name>: <room_key>
 *
*/

exports.roomExists = function(roomName, fn) {
	client.hget(keys.roomsKeys(), encodeURIComponent(roomName), function(err, roomKey) {
		if(err) console.log(err);
		return fn(roomKey);
	});
};

exports.addRoomKey = function(room, fn) {
  client.hset(keys.roomsKeys(), encodeURIComponent(room.name), room.key);
};


/*
 *	SET: Public Rooms track
 *	balloons:rooms:keys 
 *	|- [<room_key>, <room_key>, ... ]
 *
*/

exports.addPublicRoom = function(room) {
	client.sadd(keys.publicRooms(), room.key);
};