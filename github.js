var https = require('https');
var rp = require('request-promise');
var Rx = require('rx');

exports.request = function (path, callback) {

  var headers = {
      'User-Agent': "Up For Grab Data Service"
  };

  if (process.env.GITHUB_TOKEN != null)
  {
     headers['Authorization'] = "Token " + process.env.GITHUB_TOKEN;
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
    .take(2)
    .select(function (project) {

      var name = project[0];
      var url = project[1].issueCount;

      console.log("Fetching issue count for project: \'" + name + "\'...")

      var headers = {
          'User-Agent': "Up For Grab Data Service"
      };

      if (process.env.GITHUB_TOKEN != null)
      {
         headers['Authorization'] = "Token " + process.env.GITHUB_TOKEN;
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
