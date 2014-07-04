'use strict';

var _ = require('underscore');
var async = require('async');
var Gleam = require('gleam');


function asyncMapper(mapFunction) {
	return function (collection, callback) {
		return async.map(collection, mapFunction, callback);
	};
}


function entityRestorer(gleam) {
	return function (data, callback) {
		var entity;
		try {
			entity = gleam.fromJson(data);
		} catch (error) {
			return callback(error);
		}
		return callback(null, entity);
	};
}


function redisGet(client) {
	return function (key, callback) {
		callback = _.last(arguments);
		key = _.first(arguments);
		return client.client().get(client.wrapKey(key), callback);
	};
}

function redisKeysGetter(client, condition) {
	return function (callback) {
		return client.client().keys(client.wrapKey(condition), callback);
	};
}


function rowGetter(client, entityName) {
	return function getRow(id, callback) {
		var key = [entityName, id].join(':');
		return client.client().get(client.wrapKey(key), callback);
	};
}


function ensureEntity(_this, data, callback) {

	var entity;

	if (Gleam.is(data, _this.entityName)) {
		return callback(null, data);
	}

	try {
		entity = _this.gleam.entity(_this.entityName, data);
	} catch (error) {
		return callback(error);
	}

	return callback(null, entity);
}


/**
 * @constructor
 * @name RedisCrud
 *
 * @param {String} entityName
 * @param {RedisClient} client
 * @param {Gleam} gleam
 */
function RedisCrud(entityName, client, gleam) {
	this.entityName = entityName;
	this.client = client;
	this.gleam = gleam;
}


RedisCrud.prototype.set = function (id, data, ttl, callback) {
	var _this = this;

	return async.waterfall([
		async.apply(ensureEntity, _this, data),
		function (entity, next) {
			var key = _this.client.wrapKey([_this.entityName, id].join(':')),
				value = JSON.stringify(entity);

			if (!ttl) {
				return _this.client.client().set(key, value, function (error) {
					return next(error, entity);
				});
			}
			return _this.client.client().set(key, value, 'ex', ttl, function (error) {
				return next(error, entity);
			});
		}
	], callback);
};


RedisCrud.prototype.get = function (id, callback) {
	var _this = this;

	return async.waterfall([
		async.apply(rowGetter(_this.client, _this.entityName), id),
		entityRestorer(_this.gleam)
	], callback);
};


RedisCrud.prototype.index = function (callback) {
	var _this = this;

	return async.waterfall([
		redisKeysGetter(_this.client, [_this.entityName, '*'].join(':')),
		asyncMapper(redisGet(_this.client)),
		asyncMapper(entityRestorer(_this.gleam))
	], callback);
};


RedisCrud.prototype.item = function (id, callback) {
	return this.get(id, callback);
};


RedisCrud.prototype.upsert = function (data, ttl, callback) {
	var _this = this;

	return async.waterfall([
		async.apply(ensureEntity, _this, data),
		function (entity, next) {
			return _this.set(entity.id(), entity, ttl, next);
		}
	], callback);
};


RedisCrud.prototype.add = function (data, ttl, callback) {
	var _this = this;

	return async.waterfall([
		async.apply(ensureEntity, _this, data),
		function (entity, next) {
			return rowGetter(_this.client, _this.entityName)(entity.id(), function (error, existingEntity) {
				if (error) {
					return next(error);
				}
				if (existingEntity) {
					return next(new Error('Already exists'));
				}
				return _this.set(entity.id(), entity, ttl, next);
			});
		}
	], callback);
};


RedisCrud.prototype.edit = function (data, ttl, callback) {
	var _this = this;

	return async.waterfall([
		async.apply(ensureEntity, _this, data),
		function (entity, next) {
			return rowGetter(_this.client, _this.entityName)(entity.id(), function (error, existingEntity) {
				if (error) {
					return next(error);
				}
				if (!existingEntity) {
					return callback(new Error('Does not exist'));
				}
				return _this.set(entity.id(), entity, ttl, next);
			});
		}
	], callback);
};


RedisCrud.prototype.del = function (id, callback) {
	var _this = this;
	id = _.isString(id) ? id : (Gleam.is(id, _this.entityName) && id.id() || null);

	if (!id) {
		return callback(new Error('Id required'));
	}

	return _this.client.client().del(_this.client.wrapKey([_this.entityName, id].join(':')), function (error) {
		return callback(error);
	});
};


module.exports = exports = RedisCrud;
