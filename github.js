var https = require('https');
var rp = require('request-promise');
var Rx = require('rx');

var getAuthorizationHeader = function() {
  if (process.env.GITHUB_TOKEN == null)
  {
    console.log("No environment variable set for GitHub token, unauthenticated client is very restricted...");
  } else {
    console.log("Found GITHUB_TOKEN variable, setting header...");
  }
  return process.env.GITHUB_TOKEN;
}

exports.request = function (path, callback) {

  var headers = {
      'User-Agent': "Up For Grab Data Service"
  };

  var authorization = getAuthorizationHeader();

  if (authorization != null)
  {
     headers['Authorization'] = "Token " + authorization;
  }

  var options = {
    host: 'api.github.com',
    path: path,
    headers: headers
  };

  var str = '';

  https.get(options, function(res)
  {
    res.on("data", function(chunk) {
      str += chunk;
    });

    res.on('error', function(e) {
      callback(e, null);
    });

    res.on('end', function () {
      var result = JSON.parse(str);
      callback(null, result);
    });
  });
}

exports.computeIssueCounts = function(projects) {

  return Rx.Observable.from(projects)
    .select(function (project) {

      var name = project[0];
      var url = project[1].issueCount;

      var headers = {
          'User-Agent': "Up For Grab Data Service"
      };

      var authorization = getAuthorizationHeader();
      if (authorization != null)
      {
         headers['Authorization'] = "Token " + authorization;
      }

      var options = {
          uri: 'https://api.github.com' + url,
          headers: headers,
          json: true
      };

      var promise = rp(options);

      return Rx.Observable.fromPromise(promise)
        .select(function(issues) {
            return { 'project': name, 'count': issues.length }
        });
    })
    .mergeAll();
}
