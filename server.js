"use strict"; // This is for es6 (so we can use 'let' for instance)
var express = require("express");
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var helper = require('./helpers.js');
//var models = require('./models.js');
var bodyParser = require('body-parser')
var Socket = require('socket.io/lib/socket');

//Globals
let connections = [];
let phoniroUsers = [];
let phoniroHosts = [];
let counter = 0;


app.set('view engine', 'ejs');
app.set('views', __dirname + '/Views');
app.use(express.static('Public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var router = new require( __dirname + '/Routes/routes_get.js').Router(app,connections);


server.listen(process.env.PORT || 3000);
console.log('Server running..');
console.log('Listening on: ' + process.env.PORT);


//Socket events..
io.sockets.on('connection', (socket) => {
    connections.length++;
    console.log('Connected: %s sockets connected', connections.length);

    //Disconnect
  socket.on('disconnect', (data)=> {
      if(phoniroUsers[socket.id] != null){
        delete phoniroUsers[socket.id];
      }
      else{
          console.log('Error in disconnect' + socket);
      }
      connections.length--;
      console.log('Disconnected: %s sockets connected', connections.length);
  });


  //test remove
  socket.on('sendto', (data)=>{
    console.log("in sendto event");
    socket.broadcast.emit('sendback', {msg: 'Hello'});
  });

// register phoniro clients
  socket.on('register phoniro', (data)=>{
    console.log('register phoniro : ' + data);
    socket.id = data;
    phoniroUsers[data] = socket;
    phoniroUsers[data].emit('registerd', {msg: 'reg'});
  });

// setup call.
  socket.on('setup call', (data)=>{
    console.log('in setup call :' + data.id);
    console.log('in setup call data :' + data);
    if(phoniroUsers[data] != null){
      //console.log(phoniroUsers[data]);
      console.log("1");
      phoniroUsers[data].emit('call', {msg: 'ringer'});
    }
    if(phoniroUsers[data.id] != null){
      //console.log(phoniroUsers[data.id]);
      console.log("2");
      phoniroUsers[data.id].emit('call', {msg: 'ringer'});
    }
  });

});
