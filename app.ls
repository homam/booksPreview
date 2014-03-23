connect = require \connect
http = require 'http'

directory = 'public_html';

connect()
    .use(connect.static(directory))
    .listen(8091);

console.log('Listening on port 8091');