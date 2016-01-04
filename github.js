var https = require('https');
var rp = require('request-promise');
var Rx = require('rx');

var request = function (path) {

  var headers = {
      'User-Agent': "Up For Grab Data Service"
  };

  if (process.env.GITHUB_TOKEN != null)
  {
     headers['Authorization'] = "Token " + process.env.GITHUB_TOKEN;
  }

  var options = {
      uri: 'https://api.github.com' + path,
      headers: headers,
      json: true
  };

  var promise = rp(options);

  return Rx.Observable.fromPromise(promise);
};

exports.request = request;

exports.computeIssueCounts = function(projects) {

  return Rx.Observable.from(projects)
    .take(2)
    .select(function (project) {

      var name = project[0];
      var url = project[1].issueCount;

      console.log("Fetching issue count for project: \'" + name + "\'...")

      return request(url)
        .select(function(issues) {
            return { 'project': name, 'count': issues.length }
        });
    })
    .mergeAll();
}
