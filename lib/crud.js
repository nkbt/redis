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

/**
 * @name RedisCrud
 * @constructor
 * @param {RedisClient} client
 * @param {Gleam} gleam
 */
function RedisCrud(client, gleam) {
	this._client = client;
	this._gleam = gleam;
}


RedisCrud.prototype.index = function (entityName, callback) {
	var _this = this;
	callback = _.last(arguments);
	entityName = _.first(arguments);

	return async.waterfall([
		redisKeysGetter(_this.client, [entityName, '*'].join(':')),
		asyncMapper(redisGet(_this.client)),
		asyncMapper(entityRestorer(_this._gleam))
	], callback);
};


RedisCrud.prototype.item = function (entityName, id, callback) {
	var _this = this,
		args = _.initial(arguments);
	callback = _.last(arguments);
	entityName = args.shift();
	id = args.shift();

	return async.waterfall([
		async.apply(rowGetter(_this._client, entityName), id),
		entityRestorer(_this._gleam)
	], callback);
};


RedisCrud.prototype.add = function (entityName, data, ttl, callback) {
	var _this = this,
		args = _.initial(arguments), entity, id;
	callback = _.last(arguments);
	entityName = args.shift();
	data = args.shift();
	ttl = args.shift();

	entity = Gleam.is(data, entityName) && data || _this._gleam.entity(entityName, data);
	id = entity.id();

	return rowGetter(_this._client, entityName)(id, function (error, existingEntity) {
		if (error) {
			return callback(error);
		}
		if (existingEntity) {
			return callback(new Error('Already exists'));
		}

		if (!ttl) {
			return _this._client.client().set(_this._client.wrapKey([entityName, id].join(':')), JSON.stringify(entity), function (error) {
				return callback(error, entity);
			});
		}

		return _this._client.client().set(_this._client.wrapKey([entityName, id].join(':')), JSON.stringify(entity), 'ex', ttl, function (error) {
			return callback(error, entity);
		});
	});
};


RedisCrud.prototype.upsert = function (entityName, data, ttl, callback) {
	var _this = this,
		args = _.initial(arguments), entity, id;
	callback = _.last(arguments);
	entityName = args.shift();
	data = args.shift();
	ttl = args.shift();

	entity = Gleam.is(data, entityName) && data || _this._gleam.entity(entityName, data);
	id = entity.id();

	if (!ttl) {
		return _this._client.client().set(_this._client.wrapKey([entityName, id].join(':')), JSON.stringify(entity), function (error) {
			return callback(error, entity);
		});
	}

	return _this._client.client().set(_this._client.wrapKey([entityName, id].join(':')), JSON.stringify(entity), 'ex', ttl, function (error) {
		return callback(error, entity);
	});
};


RedisCrud.prototype.edit = function (entityName, data, ttl, callback) {
	var _this = this,
		args = _.initial(arguments), entity, id;
	callback = _.last(arguments);
	entityName = args.shift();
	data = args.shift();
	ttl = args.shift();

	entity = Gleam.is(data, entityName) && data || _this._gleam.entity(entityName, data);
	id = entity.id();

	if (!ttl) {
		return _this._client.client().set(_this._client.wrapKey([entityName, id].join(':')), JSON.stringify(entity), function (error) {
			return callback(error, entity);
		});
	}

	return _this._client.client().set(_this._client.wrapKey([entityName, id].join(':')), JSON.stringify(entity), 'ex', ttl, function (error) {
		return callback(error, entity);
	});
};


RedisCrud.prototype.del = function (entityName, id, callback) {
	var _this = this,
		args = _.initial(arguments);
	callback = _.last(arguments);
	entityName = args.shift();
	id = args.shift();

	return _this._client.client().del(_this._client.wrapKey([entityName, id].join(':')), function (error) {
		return callback(error);
	});
};


module.exports = exports = RedisCrud;
