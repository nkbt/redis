module.exports = process.env.REDIS_HELPER_COV ? require('./lib-cov/redis-helper') : require('./lib/redis-helper');
