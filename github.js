var https = require('https');

exports.request = function (path, callback) {

  var authorization = "";
  if (process.env.GITHUB_TOKEN == null)
  {
    console.log("No environment variable set for GitHub token, unauthenticated client is very restricted...");
  } else {
    console.log("Found GITHUB_TOKEN variable, setting header...");
    authorization = 'Token ' + process.env.GITHUB_TOKEN;
  }

  var options = {
    host: 'api.github.com',
    path: path,
    headers: {
      'Authorization': authorization,
      'User-Agent': "Up For Grab Data Service"
    }
  };

  var str = '';

  https.get(options, function(res)
  {
    console.log("Got response: " + res.statusCode);

    res.on("data", function(chunk) {
      str += chunk;
    });

    res.on('error', function(e) {
      callback(e, null);
    });

    res.on('end', function () {
      console.log("END: " + str);

      var result = JSON.parse(str);

      callback(null, result);
    });
  });

}
