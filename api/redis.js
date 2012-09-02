// To check if a user can join a room, if rooms is private, then 
// it has to be into his "prs" (private-rooms) 


/*
 *	HASH: Room
 *	rooms:<room_key>
 *	|- key: <room_key> [hashGeneratedValue]
 *	|- name: <room_name> [submitedName]
 *	|- admin: <user_key> [ <user_provider>:<user_provider_id> ]
 *	|- private: [Boolean]
 * 	|- online: [Number] [ (SET) rooms:<room_key>:users ]
 *
*/
exports.getRoom = function(roomKey, fn) {
	client.hgetall("rooms:" + roomKey, function(err, room) {
		if(err) return fn(err);
		if(!room) return fn("Room not found!");
		return fn(null, room);
	});
};

exports.getFullRoom = function(roomKey, fn) {
	exports.getRoom(roomKey, function(err, room) {
		if(err) return fn(err);
		if(!room) return fn("Room not found!");
		exports.getRoomsUsers(roomKey, function(err, users) {
			if(err) return fn(err);
			room.users = users;
			return fn(null, room);
		})
	});
};

/*
 *	SET: Room Online Users
 *	rooms:<room_key>:users
 *	[<user_key>, <user_key>, ... ]
 *
*/
exports.getRoomUsers = function(roomKey, fn) {
	client.smembers(roomKey, function(err, users) {
		if(err) return fn(err);
		return fn(users);
	})
};

/*
 *	HASH: User
 *	users:<user_key>
 *	|- key: <user_key>
 *	|- provider: <provider>
 *	|- status: <status>
 *	|- [passport-data]
 *
*/
exports.createUser = function(passport, fn) {
	passport.key = utils.genUserKey(passport);
	passport.status = 'available';
	client.hmset('users:' + userKey, passport, function(err, saved) {
		if(err) return fn(err);
		if(!saved) return fn("Couldn't create user");
		return fn(null, passport)
	})
};

exports.getUser = function(userKey, fn) {
	client.hgetall(userKey, function(err, user) {
		if(err) return fn(err);
		if(!user) return fn("Coudn't find user");
		return fn(null, user);
	});
};

exports.getOrCreateUser = function(passport, fn) {
	exports.getUser(utils.genUserKey(passport), function(err, user) {
		if(!err && user) return fn(null, user);
		exports.createUser(passport, function(err, user) {
			if(err) return fn(err);
			return fn(null, user);
		});
	});
}