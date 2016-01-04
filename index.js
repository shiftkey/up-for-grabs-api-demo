
var express = require('express')
var bodyParser = require('body-parser')
var memjs = require('memjs')

var projects = require('./projects.js')
var dict = projects.setup();

var expiration = 600; // 10 minutes

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

// /issues/count?project={blah}
// {blah} is just the project name - URL encoded/decoded

app.get('/issues/count', function(request, response) {
  var projectName = request.query.project;

  if (projectName == null)
  {
     response.status(400).send('Missing querystring parameter: \'project\'');
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

      var path = projectJson.issueCount;

      github.request(path, function(err, res){
        var count = res.length;

        client.set(key, count, function(err, val) {
          if (err != null) {
            console.log(err);
          }
        }, expiration);

        response.send({ cached: false, result: count });
      });

    } else {
      console.log("value for \'" + key + "\' cached - got \'" + val.toString() + "\'");
      response.send({ cached: isCached, result: val.toString() });
    }
  });
})

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
