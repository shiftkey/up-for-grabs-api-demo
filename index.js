var express = require('express')
var bodyParser = require('body-parser')
var memjs = require('memjs')
var Rx = require('rx');

if (process.env.GITHUB_TOKEN == null) {
  console.warn("No GITHUB_TOKEN environment variable set, unauthenticated access is very limited...");
} else {
  console.log("Found GITHUB_TOKEN environment variable, authenticated requests permit much more usage...");
}

if (process.env.AUTH_TOKEN == null) {
  console.warn("No AUTH_TOKEN environment variable set, access to some actions will be restricted...");
}

var projects = require('./projects.js')
var dict = projects.setup();

var expiration = 600; // 10 minutes

console.log("Loaded " + (dict.size + 1) + " projects into memory...");

var github = require('./github.js')
var observables = require('./observables.js')

// launch site
var app = express()

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))
app.use(bodyParser.json());

// just a little test method to verify the service is running
app.get('/meta', function(request, response) {
   response.send({ projects: dict.size });
});

app.get('/refresh', function(request, response) {

  if (process.env.AUTH_TOKEN == null) {
    response.status(403).send("unable to authenticate");
    return;
  }

  if (request.get("Authorization") != "TOKEN " + process.env.AUTH_TOKEN) {
    response.status(403).send("user not permitted");
    return;
  }

  var array = { };

  github
    .computeIssueCounts(dict)
    .subscribe(
      function (map) {
        array[map.project] = map.count;
      },
      function (err) {
        observables.log(err, response);
      },
      function () {
          console.log('Completed, storing in memcached');

          var client = memjs.Client.create();

          client.set("issue-count-all", JSON.stringify(array), function(err, val) {
            if (err != null) {
              console.log(err);
            }

            response.send({ issueCount: array });

          }, expiration);
      }
    );
});


// /issues/count?project={blah}
// {blah} is just the project name - URL encoded/decoded

app.get('/issues/count', function(request, response) {
  var projectName = request.query.project;

  if (projectName == null)
  {
    // no project specified -> return all results
    var client = memjs.Client.create();
    client.get("issue-count-all", function(err, val) {

      if (err != null) {
         console.log(err);
         response.status(500).send('Unable to connect to store');
      }

       var text = val.toString();
       var json = JSON.parse(text);

       response.send(json);
      });
    return;
  }

  var projectJson = dict.get(projectName);

  if (projectJson == null)
  {
     response.status(400).send('Unknown project: \'' + projectName + '\'');
     return;
  }

  var key = "issue-count-" + projectName;

  var client = memjs.Client.create();
  client.get(key, function(err, val) {

    if (err != null) {
      console.log(err);
      response.status(500).send('Unable to connect to database');
    }

    var isCached = err == null && val != null;

    if (!isCached) {
      console.log("value for \'" + key + "\' not cached");

      github
        .request(projectJson.issueCount)
        .subscribe(
          function (issues) {
            var count = issues.length;

            client.set(key, count.toString(), function(err, val) {
              if (err != null) {
                console.log(err);
              }

              console.log("stored value: \'" + key + "\' - \'" + val.toString() + "\'");

              response.send({ cached: false, result: count });
            }, expiration);

          },
          function (err) {
            observables.log(err, response);
          }
      );
    } else {
      var str = val.toString();
      var count = parseInt(str);

      console.log("value for \'" + key + "\' cached - got \'" + str + "\'");
      response.send({ cached: isCached, result: count });
    }
  });
})

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
