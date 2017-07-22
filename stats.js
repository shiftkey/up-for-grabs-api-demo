
var cache = require('./cache.js')
var github = require('./github.js')

var expiration = 600; // 10 minutes

var OPEN_ISSUE_COUNT_ALL_KEY = "issue-count-open-all";
var OPEN_ISSUE_COUNT_PROJECT_PREFIX = "issue-count-open-";

exports.getProject = function(project, error, success) {
    var key = OPEN_ISSUE_COUNT_PROJECT_PREFIX + project.name;

    cache.get(key, function(err, val) {
      if (err != null) {
        console.log(err);
        error('Unable to connect to database');
      }

      var isCached = err == null && val != null;

      if (!isCached) {
        console.log("value for \'" + key + "\' not cached");

        var stats = github.getProjectStats(project, function (results) {
          cache.set(key, results, function(err, val) {
            if (err != null) {
              console.log(err);
            }

            console.log("stored value: \'" + key + "\' - \'" + JSON.stringify(results) + "\'");

            success({ cached: false, stats: results });
          }, expiration);

        }, function (err) {
          console.log('Error found in response');
          console.log('Status Code: ' + err.statusCode);
          console.log('Response: ' + err.response.body);
          error("something happened");
        });
      } else {
        var str = val.toString();
        var stats = JSON.parse(str);

        console.log("value for \'" + key + "\' cached - got \'" + str + "\'");
        success({ cached: isCached, stats: stats });
      }
    });
}

exports.getAll = function(error, cacheMiss, success) {
  // no project specified -> return all results
  cache.get(OPEN_ISSUE_COUNT_ALL_KEY, function(err, val) {
    if (err != null) {
       console.log(err);
       error('Unable to connect to store');
    }

    if(!val) {
      cacheMiss();
      return;
    }

     var text = val.toString();
     var json = JSON.parse(text);

     success(json);
    });
}

exports.refresh = function(projects, error, success) {
  var stats = github.computeStats(projects, function (results) {
      console.log('Completed, storing in memcached');

      cache.set(OPEN_ISSUE_COUNT_ALL_KEY, results, function(err, val) {
        if (err != null) {
          console.log(err);
        }

        success({ projects: results });

      }, expiration);
  },
  function (err) {
    // TODO detect different types of errors i.e. http vs broken code
    //console.log('Error found in response');
    //console.log('Status Code: ' + err.statusCode);
    //console.log('Response: ' + err.response.body);
    console.log(err);
    error("something happened");
  });
}
