var jackrabbit = require('jackrabbit');
var memjs = require('memjs');
var rp = require('request-promise');

if (process.env.GITHUB_TOKEN == null) {
  console.warn("No GITHUB_TOKEN environment variable set, unauthenticated access is very limited...");
} else {
  console.log("Found GITHUB_TOKEN environment variable, authenticated requests permit much more usage...");
}

var expiration = 600; // 10 minutes

var github = require('./github');
var projects = require('./projects.js')
var dict = projects.setup();

var rabbit = jackrabbit(process.env.RABBIT_URL);
var exchange = rabbit.default();
var taskQueue = exchange.queue({ name: 'task_queue', durable: true });

function getAllIssues(ack) {
  var array = {};

  github
    .computeIssueCounts(dict)
    .subscribe(
      function (map) {
        array[map.project] = map.count;
      },
      function (err) {
        console.log(err, response);

        ack();
      },
      function () {
          console.log('Completed, storing in memcached');

          var memclient = memjs.Client.create();

          memclient.set("issue-count-all", JSON.stringify(array), function(err, val) {
            if (err != null) {
              console.log(err);
            }
                    
            ack();
          }, expiration);
      }
    );
}

function getProjectIssues(projectName, ack) {
  var key = "issue-count-" + projectName;

  var projectJson = dict.get(projectName);

  if (projectJson == null) {
    console.log('Could not find project: ' + projectName);
    return;
  }

  console.log('Getting stats for : ' + projectName);

  github
      .request(projectJson.issueCount)
      .subscribe(
        function (issues) {
          var count = issues.length;

          var memclient = memjs.Client.create();
          memclient.set(key, count.toString(), function(err, val) {
            if (err != null) {
              console.log(err);
            }

            console.log("stored value: \'" + key + "\' - \'" + val.toString() + "\'");
            ack();
          }, expiration);

        },
        function (err) {
          console.log(err, response);
          ack();
        }
    );
}
taskQueue.consume(function onMessage(key, ack) {
  console.log('received:', key);

  var memclient = memjs.Client.create();
  memclient.get(key, function(err, val) {
    if (err != null) {
       console.log(err);
       ack();
       return;
    }

    if(val) {
      console.log('Got cached item for: ' + key);
      ack();
      return;
    }

    if(key === 'issue-count-all') {
      getAllIssues(ack);
    } else {
      getProjectIssues(key, ack);
    }
  });
});

exchange.on('drain', process.exit);
