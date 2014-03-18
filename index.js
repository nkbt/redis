module.exports = process.env.REDIS_COV ? require('./lib-cov/redis') : require('./lib/redis');
