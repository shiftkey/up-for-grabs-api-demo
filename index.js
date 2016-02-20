var express = require('express')
var bodyParser = require('body-parser')
var Rx = require('rx');
var cache = require('./cache.js')
var stats = require('./stats.js')

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

console.log("Loaded " + (dict.size + 1) + " projects into memory...");

var github = require('./github.js')

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

  stats.refresh(dict, function (err) {
    console.log('Error found in response');
    console.log('Status Code: ' + err.statusCode);
    console.log('Response: ' + err.response.body);

    response.status(500).send("something happened");
  }, function(counts) {
    response.send(counts);
  });
});


// /issues/count?project={blah}
// {blah} is just the project name - URL encoded/decoded

app.get('/issues/count', function(request, response) {
  var projectName = request.query.project;

  if (projectName == null)
  {
    // no project specified -> return all results
    stats.getAll(function(msg) {
      response.status(500).send(msg);
    }, function() {
      response.status(204).send();
    }, function(json) {
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

  stats.getProject(projectJson, function(msg) {
    response.status(500).send(msg);
  }, function(result) {
    response.send(result);
  })
})

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
