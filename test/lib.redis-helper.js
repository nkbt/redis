"use strict";


var chai = require('chai');
chai.use(require('sinon-chai'));

var nock = require('nock');
var expect = require('chai').expect;
var requireText = require('./support/require-text');

var redisHelper = require('..');

describe('Redis Helper', function () {

	it('should response to [RedisClient, RedisCrud, RedisCache] static methods', function () {
		expect(redisHelper).itself.to.respondTo('RedisClient');
		expect(redisHelper).itself.to.respondTo('RedisCrud');
		expect(redisHelper).itself.to.respondTo('RedisCache');
	});

});
