var express = require('express');
var app = express();
var http = require('http')

var port = process.env.PORT || 3000
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res){
	res.sendfile('index.html');
});

var options = {
    debug: true
}

var server = http.createServer(app)
app.use('/peerjs', ExpressPeerServer(server, options));
server.listen(port)

var DEBUG = 0;
