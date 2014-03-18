"use strict";

var _ = require('underscore');


/**
 * @name RedisCache
 * @constructor
 * @param {RedisClient} client
 */
function RedisCache(client) {
	this._client = client;
}


RedisCache.prototype.get = function (id, callback) {
	var _this = this,
		args = _.initial(arguments);
	callback = _.last(arguments);
	id = args.shift();
	return _this._client.client().get(_this._client.wrapKey(['cache', id].join(':')), callback);
};


RedisCache.prototype.set = function (id, data, ttl, callback) {
	var _this = this,
		args = _.initial(arguments);
	callback = _.last(arguments);
	id = args.shift();
	data = args.shift();
	ttl = args.shift();
	return _this._client.client().set(_this._client.wrapKey(['cache', id].join(':')), data, 'ex', ttl, callback);
};


module.exports = exports = RedisCache;
