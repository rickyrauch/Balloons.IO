var parent = module.parent.exports
	, client = exports.client = parent.client;
	
exports.redis = require('./redis');