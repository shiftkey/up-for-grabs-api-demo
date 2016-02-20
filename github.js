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

var getProjectIssueCount = function(project, urlProperty) {
  var name = project.name;
  var url = project[urlProperty];

  console.log("Fetching issue count (" + urlProperty + ") for project: \'" + name + "\'...");

  return request(url)
    .select(function(issues) {
        return { 'project': name, 'count': issues.length, 'type': urlProperty };
    });
}

var computeIssueCounts = function(projects, urlProperty) {
  return Rx.Observable.from(projects)
    .take(2)
    .select(function (project) {

      var name = project[0];
      var url = project[1][urlProperty];

      console.log("Fetching issue count (" + urlProperty + ") for project: \'" + name + "\'...")

      return request(url)
        .select(function(issues) {
            return { 'project': name, 'count': issues.length, 'type': urlProperty };
        });
    })
    .mergeAll();
}

exports.request = request;

exports.getProjectOpenIssueCount = function(project) {
  return getProjectIssueCount(project, "openIssueCount");
}

exports.getProjectClosedIssueCount = function(project) {
  return getProjectIssueCount(project, "closedIssueCount");
}

exports.computeOpenIssueCounts = function(projects) {
  return computeIssueCounts(projects, "openIssueCount");
}

exports.computeClosedIssueCounts = function(projects) {
  return computeIssueCounts(projects, "closedIssueCount");
}
