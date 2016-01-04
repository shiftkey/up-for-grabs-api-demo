var https = require('https');

exports.request = function (path) {

  var authorization = "";
  if (process.env.GITHUB_TOKEN == null)
  {
    console.log("No environment variable set for GitHub token, unauthenticated client is very restricted...");
  } else {
    authorization = 'Token ' + process.env.GITHUB_TOKEN;
  }

  var options = {
    host: 'api.github.com',
    path: path,
    headers: {
      'Authorization': authorization
    }
  };

  var str = '';

  callback = function(response) {
    //another chunk of data has been recieved, so append it to `str`
    response.on('data', function (chunk) {
      str += chunk;
    });

    //the whole response has been recieved, so we just print it out here
    response.on('end', function () {
      console.log(str);
    });
  }

  https.request(options, callback).end();

  return JSON.parse(str);
}
