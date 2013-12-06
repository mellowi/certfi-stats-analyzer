// dependencies
var redis = require("redis");

var config = require("../config");

// redis connection
var cache = redis.createClient(config.cache.port, config.cache.host);

// get all frequencies
var get = function(cb) {
  var frequencies = {};
  cache.get(config.cache.key.category, function(err, reply) {
    if(err) throw err;
    if(!reply) return cb();
    frequencies.category = JSON.parse(reply);

    cache.get(config.cache.key.location, function(err, reply) {
      if(err) throw err;
      if(!reply) return cb();
      frequencies.location = JSON.parse(reply);

      cache.get(config.cache.key.date, function(err, reply) {
        if(err) throw err;
        if(!reply) return cb();
        frequencies.date = JSON.parse(reply);

        return cb(frequencies);
      });
    });
  });
}

// set all frequencies
var set = function(frequencies) {
  cache.set(config.cache.key.category, JSON.stringify(frequencies.category));
  cache.set(config.cache.key.location, JSON.stringify(frequencies.location));
  cache.set(config.cache.key.date, JSON.stringify(frequencies.date));
}

// clear all frequencies
var clean = function() {
  cache.del(config.cache.key.category);
  cache.del(config.cache.key.location);
  cache.del(config.cache.key.date);
}

module.exports = {
  get : get,
  set : set,
  clean: clean
}
