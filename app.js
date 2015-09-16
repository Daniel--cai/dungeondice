var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res){
  res.sendfile('index.html');listen
});


io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('first request', function(data){
  	console.log('message:' + data)
  	io.emit('first request', 'helell');

  	socket.broadcast.emit('first request', {for: 'everyone'});
  })
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});