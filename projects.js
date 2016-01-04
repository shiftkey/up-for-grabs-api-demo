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

      var issueCountUrl = "https://api.github.com/repos/" + owner + "/" + repo + "/issues?labels=" + labelEncoded + "&per_page=100";

      // TODO: attach some other properties here

      var obj = { "issueCount": issueCountUrl};

      dict.set(nativeObject.name, obj);
    } else {
      console.log("Project \'" + file + "\' does not integrate with GitHub, skipping...");
    }
  }

  return dict;
};
