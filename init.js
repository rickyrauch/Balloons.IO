
/*
 * Initialize the application
 */

/*
 * Module dependencies
 */

var fs = require('fs');


/*
 * Initialize the 
 *
 * @param {Object} Redis client instance
 * API @public
 */

module.exports = function(api) {
  /*
   * Clean all forgoten sockets in Redis.io
   */

  // Delete all users sockets from their lists
  api.redis.deleteAllClientSockets();

  // No one is online when starting up
  api.redis.removeAllUsersFromRooms();

  // Delete all socket.io's sockets data from Redis
  api.redis.removeAllSocketIOSockets();

  /*
   * Create 'chats' dir
   */
  fs.mkdir('./chats');

};

