"use strict"; // This is for es6 (so we can use 'let' for instance)
var express = require("express");
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var helper = require('./helpers.js');
var models = require('./models.js');
var games = require('./pingpong.js');
var bodyParser = require('body-parser')
var Socket = require('socket.io/lib/socket');

//Globals
let connections = [];
let adminsockets = [];
let activeGames = {};
let allConecctions = [];
let phoniroUsers = [];
let phoniroHosts = [];
let counter = 0;

//Adding custom stuff to the Socket object..
Socket.prototype.ping = function(req, res, callback){
  this.tempPingData = {
    pingStartTime : new Date().getTime(),
    pingResponseTime : 0,
    request : req,
    response : res,
    callback : callback
  }
  this.emit('pingding')
};

//For stats in god view..
activeGames.numberOfPlayers = 0;
activeGames.numberOfObservers = 0;
activeGames.numberOfGames = 0;

activeGames.getStatPack = function(){
  return {activeGames: this.numberOfGames,
                    numberOfPlayers: this.numberOfPlayers,
                    numberOfObservers: this.numberOfObservers}
}


app.set('view engine', 'ejs');
app.set('views', __dirname + '/Views');
app.use(express.static('Public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var router = new require( __dirname + '/Routes/routes_get.js').Router(app,connections,activeGames);


server.listen(process.env.PORT || 3000);
console.log('Server running..');
console.log('Listening on: ' + process.env.PORT);



//Socket events..
io.sockets.on('connection', (socket) => {
    let id = helper.getRandomId5();
    while (connections[id] != undefined) {
        id = helper.getRandomId5();
    }
    allConecctions[counter] = socket;
    for(var i = 0; i<allConecctions.length; i++){
      //console.log(allConecctions[i].id);
    }
    counter++;
    socket.id = id;
    connections[socket.id] = socket;
    connections.length++;
    console.log('Connected: %s sockets connected', connections.length);

    //Disconnect
  socket.on('disconnect', (data)=> {
      if(socket.type === 'output'){
          delete activeGames[socket.roomId].viewSockets[socket.id];
          activeGames.numberOfObservers--;
          //generate disconnect event
      }
      else if(socket.type === 'input'){
          delete activeGames[socket.roomId].inputSockets[socket.id];
          activeGames.numberOfPlayers--;
      }
      else if(socket.type == 'admin'){
        adminsockets.splice(adminsockets.indexOf(socket), 1);
      }
      else if(socket.type === 'user'){
        delete phoniroUsers[socket.username];
      }
      else if(socket.type === 'host'){
        delete phoniroHosts[socket.username];
      }
      else{
          console.log('Error in disconnect' + socket);
      }

      adminsockets.forEach((socket)=>{
        socket.emit('baseStatPack', activeGames.getStatPack())
      });

      delete connections[socket.id];
      connections.length--;
      console.log('Disconnected: %s sockets connected', connections.length);
  });


  //Send message
  socket.on('send message', (data)=> {
      for(var viewSocketId in activeGames[data.id].viewSockets){
          connections[viewSocketId].emit('new message', {msg: data.msg, nick: data.nick});
      }
  });

  //Register a new socket
  socket.on('register', (data)=> {

      //Checking if he socket is a browser or phone
      if (data.type === 'output') {

        //Is the viewSocket starting the game ir joining as observer?
        if(activeGames[data.id] === undefined){
          //Creating a new Game-object
          let game = new models.Game();
          game.viewSockets[socket.id] = socket.id;

          //Adding the instance
          activeGames[data.id] = game;
          socket.roomId = data.id;
          socket.type = 'output';

          console.log('Registred room: ' + data.id);

          //Here maybe an instance of the game should be created..
          activeGames[data.id].gameState = new games.PingpongGame(activeGames[data.id], connections);

          activeGames[data.id].meta.isActive = true;

          activeGames.numberOfGames++;
          activeGames.numberOfObservers++;

        }
        else {
          socket.roomId = data.id;
          socket.type = 'output';
          activeGames[data.id].viewSockets[socket.id] = socket.id;
          activeGames.numberOfObservers++;
          console.log('Connected new observer socket!');
        }


      }

      else if (data.type === 'input') {
          if (activeGames[data.id] === undefined) {
              socket.emit('new message', {msg: 'No room found', success: false});
              socket.disconnect();
              //disconnect the socket here..
          }
          else {
              activeGames[data.id].inputSockets[socket.id] = socket.id;
              socket.roomId = data.id;
              socket.type = 'input';
              socket.player = activeGames[data.id].gameState.getNextPlayerNumber();

              for(var viewSocketId in activeGames[data.id].viewSockets){
                  connections[viewSocketId].emit('new player connected', data);
              }
              socket.emit('new message', {msg: 'You are connected as input!', success: true});

              //Special for andriodtester..
              if(data.nick === 'testare'){
                console.log('testare!')
                socket.isTesting = true;
              }

              activeGames.numberOfPlayers++;
              console.log('Registred new input to room: ' + data.id);
          }
      }
      else if(data.type === 'admin'){
        adminsockets.push(socket);
        socket.emit('baseStatPack', activeGames.getStatPack())
      };

      adminsockets.forEach((adminsocket)=>{
        adminsocket.emit('baseStatPack', activeGames.getStatPack());
      });
  });

  //Trigger vibrate event on phone.. WILL NOT WORK FOR MULTIPLE PHONES...
  socket.on('feedback', (data)=>{
    for(let socketId in activeGames[socket.roomId].inputSockets){
      connections[socketId].emit('move received', data);
    }
  });

  //Disconnect input
  socket.on('quit session', (data)=>{

    });

    //Register new move to game
  socket.on('new move', (data)=>{
      data.player = socket.player;
      activeGames[socket.roomId].gameState.setDirection(data);

      if(socket.isTesting === true){
        for(let socketId in activeGames[socket.roomId].viewSockets){
          connections[socketId].emit('new move', data);
        }
      }
  });

  socket.on('start game', (data)=>{
        activeGames[socket.roomId].gameState.start();
    });

  socket.on('ping response', (data)=>{
    socket.tempPingData.pingResponseTime = new Date().getTime();
    let tStart = socket.tempPingData.pingStartTime;
    let tStop = socket.tempPingData.pingResponseTime;
    let req = socket.tempPingData.request;
    let res = socket.tempPingData.response;
    socket.tempPingData.callback(req, res, tStart, tStop);
    socket.tempPingData.callback = function(req, res, tStart, tStop){};

  });

  socket.on('getBaseStatPack', (data)=>{
    socket.emit('baseStatPack', activeGames.getStatPack());
  });

  //test remove
  socket.on('sendto', (data)=>{
    console.log("in sendto event");
    socket.broadcast.emit('sendback', {msg: 'Hello'});
  });

  socket.on('register phoniro', (data)=>{
    console.log('register phonieo : ' + data);
    phoniroUsers[data] = socket;
    phoniroUsers[data].emit('registerd', {msg: 'reg'});
    //console.log(phoniroUsers[data]);
    /*;
    if(data.type === 'user' || data.type === "user"){
      phoniroUsers[data.id] = socket;
      socket.type = 'user';
      socket.username = data.id;s
      console.log('registerd user : ' + data.id);
    }
    else if(data.type === 'host' || data.type === "host"){
      phoniroHosts[data.id] = socket;
      socket.type = 'host';
      socket.username = data.id;
      console.log('registerd host : ' + data.id);
    }
    else{
      console.log('error in register phoniro');
    }
    */
  });

  socket.on('setup call', (data)=>{
    console.log('in setup call :' + data.id);
    console.log('in setup call data :' + data);
    console.log(phoniroUsers[data]);
    if(phoniroUsers[data.toString()] != null){
      //console.log(phoniroUsers[data]);
      console.log("1");
      phoniroUsers[data].emit('call', {msg: 'ringer'});
    }
    if(phoniroUsers[data.id] != null){
      //onsole.log(phoniroUsers[data.id]);
      console.log("2");
      phoniroUsers[data.id].emit('call', {msg: 'ringer'});
    }
  });

});
