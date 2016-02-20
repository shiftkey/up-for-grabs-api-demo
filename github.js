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
  var url = project.counts[urlProperty];
  return getProjectCount(name, url, urlProperty);
}

var getProjectCount = function(name, url, key) {
  console.log("Fetching issue count (" + key + ") for project: \'" + name + "\'...");

  return request(url)
    .select(function(items) {
        return { 'project': name, 'count': items.length, 'type': key };
    });
}

var computeIssueCounts = function(projects, urlProperty) {
  return Rx.Observable.from(projects)
    .take(2)
    .select(function (project) {
      return getProjectIssueCount(project[1], urlProperty);
    })
    .mergeAll();
}

var getProjectStats = function(project, initialiser) {
  initialiser = initialiser || {};

  var name = project.name;

  console.log('Getting stats for ' + name)

  var countObservables = Object.keys(project.counts)
          .map(function(key) {
            var url = project.counts[key];
            console.log(key + " " + url);
            return getProjectCount(name, url, key)
          });

  var counts = Rx.Observable.merge(countObservables);

  return counts.reduce(function (result, stat, i, source) {
    result[stat.type] = stat.count;
    return result;
  }, initialiser);
};

exports.request = request;

exports.getProjectStats = function(project, success, error) {
  getProjectStats(project).subscribe(success, error);
}

exports.computeStats = function(projects, success, error) {
  var statObservers = Rx.Observable.from(projects)
    .take(2)
    .select(function(projectEntry) {
      var project = projectEntry[1];
      return getProjectStats(project, { name: project.name });
    })
    .mergeAll()
    .reduce(function (result, stat, i, source) {
      var name = stat.name;
      stat.name = undefined;
      result[name] = stat;
      return result;
    }, {})
    .subscribe(success, error);
}
