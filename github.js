var https = require('https');
var rp = require('request-promise');
var Rx = require('rx');
var parseLinkHeader = require('parse-link-header');
var Promise = require('promise');

var requestPath = function(path) {
  return request('https://api.github.com' + path);
}

var request = function (uri) {
  var headers = {
      'User-Agent': "Up For Grab Data Service"
  };

  if (process.env.GITHUB_TOKEN != null)
  {
     headers['Authorization'] = "Token " + process.env.GITHUB_TOKEN;
  }

  var options = {
      uri: uri,
      headers: headers,
      json: true,
      resolveWithFullResponse: true
  };

  var promise = rp(options);

  return Rx.Observable.fromPromise(promise);
};

var getProjectIssueCount = function(project, urlProperty) {
  var name = project.name;
  var url = project.counts[urlProperty];
  return getProjectCount(name, url, urlProperty);
}

var getProjectCount = function(name, path, key) {
  console.log("Fetching issue count (" + key + ") for project: \'" + name + "\'...");

  return requestPath(path)
    .select(function(response) {
        var rawLinkHeader = response.headers['link'];
        if(rawLinkHeader) {
          console.log("Making second request to get total count for " + name + " (" + key + ")")
          var last = parseLinkHeader(rawLinkHeader).last;

          return request(last.url).select(function(response) {
            var lastPageCount = response.body.length;
            var count = (parseInt(last.per_page) * (parseInt(last.page) - 1)) + lastPageCount;
            return { 'project': name, 'count': count, 'type': key }
          });
        }

        return Rx.Observable.fromPromise(
          Promise.resolve({ 'project': name, 'count': response.body.length, 'type': key })
        );
    })
    .mergeAll();
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

exports.getProjectStats = function(project, success, error) {
  getProjectStats(project).subscribe(success, error);
}

exports.computeStats = function(projects, success, error) {
  var statObservers = Rx.Observable.from(projects)
    .take(20)
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
