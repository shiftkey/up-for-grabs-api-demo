var express = require('express')
var bodyParser = require('body-parser')
var jackrabbit = require('jackrabbit')
var memjs = require('memjs')
var Rx = require('rx');

//export RABBIT_URL=amqp://localhost

if (process.env.AUTH_TOKEN == null) {
  console.warn("No AUTH_TOKEN environment variable set, access to some actions will be restricted...");
}

var rabbit = jackrabbit(process.env.RABBIT_URL);
var exchange = rabbit.default();
var TASK_QUEUE_KEY = 'task_queue';
var taskQueue = exchange.queue({ name: TASK_QUEUE_KEY, durable: true });

var projects = require('./projects.js')
var dict = projects.setup();

console.log("Loaded " + (dict.size + 1) + " projects into memory...");

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

  exchange.publish("issue-count-all", { key: TASK_QUEUE_KEY });

  response.status(201).send();
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
        return;
      }

      if(!val) {
        response.status(204).send();
        return;
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

      exchange.publish(projectName, { key: TASK_QUEUE_KEY });
      response.status(204).send();
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
