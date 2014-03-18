"use strict";

var redis = require('redis');


/**
 * @name RedisClient
 * @constructor
 * @param options
 */
function RedisClient(options) {
	this._ns = options.namespace;
	this._client = redis.createClient(options.server.port, options.server.host, options.server.options);
}


/**
 * @return {Object}
 */
RedisClient.prototype.client = function () {
	return this._client;
};


/**
 * @param {String} key
 * @return {String}
 */
RedisClient.prototype.wrapKey = function (key) {
	return key.match(new RegExp(['^', this._ns, ':'].join(''))) === null && [this._ns, key].join(':') || key;
};


module.exports = exports = RedisClient;
