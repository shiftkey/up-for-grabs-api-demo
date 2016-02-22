exports.log = function(err, response) {
  console.log('Error found in response');
  console.log('Status Code: ' + err.statusCode);
  console.log('Response: ' + err.response.body);

  response.status(500).send("something happened");
}
