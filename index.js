var fs = require('fs');
var YAML = require('yamljs');
var express = require('express')
var bodyParser = require('body-parser')
var memjs = require('memjs')

// process YAML from files under data into in-memory structure
var dataDir =  __dirname + '/data';
var files = fs.readdirSync( __dirname + '/data');

var dict = new Map();

for (var i = 0; i < files.length; i++)
{
  var file = files[i];
  var nativeObject = YAML.load(dataDir + "/" + file);
  dict.set(nativeObject.name, nativeObject);
}

console.log("Loaded " + (dict.size + 1) + " projects into memory...");

// launch site
var app = express()

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))
app.use(bodyParser.json());

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
