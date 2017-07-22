
var memjs = require('memjs');


function getClient() {
  return memjs.Client.create();
}

exports.set = function(key, item, callback, expiration) {
  var client = getClient();

  client.set(key, JSON.stringify(item), callback, expiration);
}

exports.get = function(key, callback) {
  var client = getClient();

  client.get(key, callback);
}
