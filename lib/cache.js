"use strict";

var _ = require('underscore');


/**
 * @name RedisCache
 * @constructor
 * @param {RedisClient} client
 */
function RedisCache(client) {
	this.client = client;
}


RedisCache.prototype.get = function (id, callback) {
	var _this = this,
		args = _.initial(arguments);
	callback = _.last(arguments);
	id = args.shift();
	return _this.client.client().get(_this.client.wrapKey(['cache', id].join(':')), callback);
};


RedisCache.prototype.set = function (id, data, ttl, callback) {
	var _this = this,
		args = _.initial(arguments);
	callback = _.last(arguments);
	id = args.shift();
	data = args.shift();
	ttl = args.shift();
	return _this.client.client().set(_this.client.wrapKey(['cache', id].join(':')), data, 'ex', ttl, callback);
};


module.exports = exports = RedisCache;
