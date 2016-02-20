var fs = require('fs');
var YAML = require('yamljs');
var url = require('url');

exports.setup = function () {
  // process YAML from files under data into in-memory structure
  var dataDir =  __dirname + '/data';
  var files = fs.readdirSync( __dirname + '/data');

  var dict = new Map();

  for (var i = 0; i < files.length; i++)
  {
    var file = files[i];
    var nativeObject = YAML.load(dataDir + "/" + file);

    var label = nativeObject.upforgrabs.name;
    var link = nativeObject.upforgrabs.link;
    var linkUrl = url.parse(link);

    if (linkUrl.hostname == "github.com") {

      var values = linkUrl.path.split('/', 3);

      var owner = values[1];
      var repo = values[2];
      var labelEncoded = encodeURI(label);

      var repoUrl = "/repos/" + owner + "/" + repo;
      var issueCountUrl = repoUrl + "/issues?labels=" + labelEncoded + "&per_page=100";
      var closedIssueCountUrl = issueCountUrl + "&state=closed"
      var openIssueCountUrl = issueCountUrl + "&state=open";

      var contributorsCountUrl = repoUrl + "/stats/contributors";

      var obj = {
        name: nativeObject.name,
        counts: {
          closedIssueCount: closedIssueCountUrl,
          openIssueCount: openIssueCountUrl,
          contributorsCount: contributorsCountUrl
        }
      };

      dict.set(nativeObject.name, obj);
    } else {
      console.warn("Project \'" + file + "\' does not integrate with GitHub, skipping...");
    }
  }

  return dict;
};
