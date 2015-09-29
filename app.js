var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res){
  res.sendfile('index.html');
});

    
var playersockets = []
var sockets = []
var gamesinprogress = [];
var opengames = []
var games = []
//var currentPlayer;

//game states
var GAME_STATE_ROLL = 0;
var GAME_STATE_SUMMON = 1;
var GAME_STATE_UNIT = 2;
var GAME_STATE_SELECT = 3;
var GAME_STATE_END = 4;


var Game = function (){
  this.players = []
  this.turn = 0;
  this.board;
  //this.currentPlayer;
  this.monsters =[];

  this.init = function (){
    //main();
    this.board = new Board();
    //PLAYER_ID.beginTurn();
    console.log("ready")
  }

  this.isPlaying = function (player){
    return this.turn%2 == player.num
  }

  this.makeSelection = function(player){
    //console.log(this.tileSelected.length)
    if (player.tileSelected.length > 0 && player.valid){
      var cshape = rotateShape(this.shape,this.rotate);
      for (var i=0; i<6; i++){
        x = player.tileSelected[i][0];
        y = player.tileSelected[i][1];
        this.board.setTileState([x,y],player.num);
      }
      //this.tileSelected = [];
     
      return true;
    }
    //console.log('return fasle')
    return false
  }

  return this;
}

 

var EMPTY = -1;
var PLAYER_1 = 0;
var PLAYER_2 = 1;

var Board = function (){
  this.tiles = [];
  this.units = [];
  this.boardSizeX = 13;
  this.boardSizeY = 19

  for (var i=0; i<this.boardSizeY;i++){
    this.tiles[i] = [];
    for (var j=0;j<this.boardSizeX; j++){
      this.tiles[i].push(EMPTY);
    }
  }
  
  for (var i=0; i<this.boardSizeY;i++){
    this.units[i] = [];
    for (var j=0;j<this.boardSizeX; j++){
      this.units[i].push(EMPTY);
    }
  }
  
  this.tiles[0][6] = PLAYER_2;
  this.tiles[18][6] = PLAYER_1;
//this.this.getTileState
  this.getTileState = function (x,y){
  //console.log(x, y)
    if (boundCursor(x,y)){
      return this.tiles[y][x];
    } else {
      return EMPTY;
    }
  }

  //function setBoardState(game, state, point){
  //  game.board.tiles[point[1]][point[0]] = state;
  //}

  this.setTileState = function(point, state){
    this.tiles[point[1]][point[0]] = state;
  }
  
  this.getUnitAtLoc = function (x,y){
  //console.log("unit at " + x +" " + y);
    //console.log(this.units)
    return this.units[y][x];
  }

  this.setUnitAtLoc = function (point, id){
    //console.log(point);
    //console.log(id)
    //console.log("setUnitAtLocid");
    //console.log(id);
    this.units[point[1]][point[0]] = id;
  }

  this.validPlacement = function(player){
  //var cshape;
  //if (!selection){
  //  cshape = rotateShape(shape,rotate)
  //} else {
  //  cshape = selection;
  //  console.log("known selection")
  //}
    var selection = player.tileSelected;
    if (!selection){
      return false;
    }

    if (selection.length <= 0){
      return false;
    }

    var valid = false;
    for (var i=0; i<6; i++){
      //boundaries
      //console.log(selection)
      x = selection[i][0];
      y = selection[i][1];
      
      if (!boundCursor(x,y) || this.getTileState(x,y) != EMPTY){
        return false;
      }
      //adjacent

      if (this.getTileState(x+1,y) == player.num || 
        this.getTileState(x-1,y) == player.num ||
        this.getTileState(x,y-1) == player.num ||
        this.getTileState(x,y+1) == player.num ){
        valid = true;
      }
    }

    return valid;
  }
  
  function Node(parent, point){

    this.x = point.x;
    this.y = point.y;
        this.parent = parent;
    this.value = point.x + point.y * boardSizeY;
    this.f = 0;
    this.g = 0;
    return this;
  }

  this.validWalk = function(x, y){
    if (!boundCursor(x,y)) return false;
    if (this.getUnitAtLoc(x,y) != EMPTY) return false;
    if (this.getTileState(x,y) == EMPTY) return false;
    return true
  }

  this.neighbours = function (x, y ){
    var N = y-1;
    var S = y+1;
    var E = x+1;
    var W = x-1;
    result = [];
    if (this.validWalk(x,N)) result.push({x:x, y:N});
    if (this.validWalk(x,S)) result.push({x:x, y:S});    
    if (this.validWalk(E,y)) result.push({x:E, y:y});
    if (this.validWalk(W,y)) result.push({x:W, y:y});
    return result;
  };

  this.findPossiblePath = function(pathStart, squares){
    var result = [];
    console.log("findPossiblePath()")
    for (var i=0; i<boardSizeX;i++){
      for (var j=0; j<boardSizeY;j++){
        if (!this.validWalk(i,j)) continue;
        var possible = this.findPath(pathStart, [i,j])
        //console.log(possible)
        if (possible.length > 0 && possible.length <= squares+1){
          result.push([i,j]);
          //console.log([i,j] + " " + possible.length)
        }  
      }
    }
    return result;
  }

  this.findPath = function(pathStart,pathEnd){
    var pathstart = new Node(null, {x:pathStart[0], y:pathStart[1]});
    var pathend = new Node(null, {x:pathEnd[0], y:pathEnd[1]});
    var astar = new Array(boardSizeX*boardSizeY);
    var open = [pathstart];
    var closed = [];
    var result = [];
    var neighcurr;
    var nodecurr;
    var path;
    var length, max, min, i, j;

    while (length = open.length){

      max = boardSizeX*boardSizeY;
      min = -1;
      for(var i=0;i<length;i++){
        if (open[i].f < max){
          max = open[i].f;
          min = i;
        }
      }

      nodecurr = open.splice(min,1)[0];

      if (nodecurr.value == pathend.value){
        path = closed[closed.push(nodecurr)-1];
        do {
          result.push([path.x, path.y])
        } while (path = path.parent);
        astar = closed = open = [];
        result.reverse();

      } else {
        neighcurr = this.neighbours(nodecurr.x, nodecurr.y);
        for (var i=0, j=neighcurr.length; i<j; i++){
          path = new Node(nodecurr, neighcurr[i]);
          if (!astar[path.value]){
            path.g = nodecurr.g + manhattanDistance(neighcurr[i], nodecurr);
            path.f = path.g + manhattanDistance(neighcurr[i], pathend);   
            open.push(path);
            astar[path.value] = true;
          }
        }
        closed.push(nodecurr);
      }
    }
    return result;
  }


  this.moveUnit = function (id, x, y ){
    if (id == EMPTY){
      console.log("Warning. Moving null unit.")
      return
    }
      //this.setUnitAtLoc = function ([m.x, m.y], EMPTY)
      m.x = x;
      m.y = y;
      //this.setUnitAtLoc = function ([x, y], id)
      //setUnitAtLocation(m.id, [x,y])
      //units[x][y]=id;

    }

  

  return this;
}

var shapes = [
  //t
  [[0,0],[0,-1],[-1,0],[1,0], [0,1],[0,2]],

  //T
  [[0,0],[0,3],[-1,0],[1,0], [0,1],[0,2]],
  //long s
  [[0,0],[0,-1],[0,-2],[1,0], [1,1],[1,2]],
  [[0,0],[1,-1],[1,-2],[1,0], [0,1],[0,2]],

  //short s
  [[0,0],[0,-1],[0,-2],[-1,-2], [0,1],[1,1]],
  [[0,0],[0,-1],[0,-2],[1,-2], [0,1],[-1,1]],

  //stairs
  [[0,0],[0,-1],[-1,-1],[1,0], [1,1],[2,1]],
  [[0,0],[0,-1],[1,-1],[-1,0], [-1,1],[-2,1]],

  //inverted stairs
  [[0,0],[-1,0],[0,-1],[0,1], [1,1],[0,2]],
  [[0,0],[1,0],[0,-1],[0,1], [-1,1],[0,2]],

  //duck
  [[0,0],[-1,0],[0,-1],[0,1], [1,2],[0,2]],
  [[0,0],[1,0],[0,-1],[0,1], [-1,2],[0,2]],

  //m
  [[0,0],[0,-1],[-1,-1],[1,0], [2,0],[2,1]],
  [[0,0],[0,-1],[1,-1],[-1,0], [-2,0],[-2,1]],
]


//dice pool
diceid = 0;
function Dice(type, pattern){
  this.id = diceid;
  diceid++;
  this.type = type;
  //this.move=move;
  //this.attack=attack;
  //this.defense=defense;
  //this.magic=magic;
  //this.trap=trap;
  this.pattern = pattern;
  this.roll = function(){
    //var i = ;
    //console.log(i);
    return this.pattern[getRandomInt(0,6)];
  }
}



var CREST_MOVEMENT = 0;
var CREST_ATTACK = 1;
var CREST_DEFENSE = 2;
var CREST_MAGIC = 3;
var CREST_TRAP = 4;
var CREST_SUMMON = 5;

var CREST_TEXT = ["MOVEMENT", "ATTACK","DEFENSE", "MAGIC", "TRAP", "SUMMON" ]



var id0 = {
  name: 'Teemo',
  hp: 30,
  atk: 10,
  def: 10,
}

var id1 = {
  name: 'Soraka',
  hp: 20,
  atk: 10,
  def: 20,
}

var id2 = {
  name: 'Poppy',
  hp: 40,
  atk: 10,
  def: 10,
}

var id3 = {
  name: 'Garen',
  hp: 30,
  atk: 20,
  def: 40,
}

var UNIT_IDS = [id0, id1, id2];

var Dice_Teemo = new Dice(id0, [[CREST_SUMMON,1],
                [CREST_SUMMON,1],
                [CREST_SUMMON,1],
                [CREST_SUMMON,1],
                [CREST_MAGIC,3],
                [CREST_MOVEMENT,1]])

var Dice_Soraka = new Dice(id1, [[CREST_SUMMON,1],
                 [CREST_SUMMON,1],
                 [CREST_SUMMON,1],
                 [CREST_SUMMON,1],
                 [CREST_DEFENSE,3],
                 [CREST_MAGIC,3]]);


var Dice_Poppy = new Dice(id2, [[CREST_SUMMON,1],
                 [CREST_SUMMON,1],
                 [CREST_SUMMON,1],
                 [CREST_SUMMON,1],
                 [CREST_TRAP,3],
                 [CREST_ATTACK,1]]);

var Dice_Garen = new Dice(id3, [[CREST_SUMMON,3],
                 [CREST_SUMMON,3],
                 [CREST_DEFENSE,3],
                 [CREST_MOVEMENT,1],
                 [CREST_MAGIC,3],
                 [CREST_TRAP,2]])

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

//colours
var blue    = "#000099";
var red = "#990000";
var green  = "#009900"; 
var white = "#ffffff";
var black = "#000000"




//idcounter = 0;

function Unit(game, player, type, point) {


  //idcounter++;
  this.name = type.name;
  this.type = type;
  this.x = point[0];
  this.y = point[1];
  this.hp = type.hp;
  this.maxhp = type.hp;
  this.atk = type.atk;
  this.def = type.def;
  this.player = player;
  //console.log(player);
  this.hasAttacked = false;
  this.canAttacked = true;
  this.atkcost = 1;
  this.atkrange = 1;
  game.monsters.push(this);
  this.id = game.monsters.length-1;
  game.board.setUnitAtLoc(point,this.id);
  
  

  this.attack = function(target){
    playerpool = this.player.pool;
    //console.log(target)
    if (this.hasAttacked) {
      console.log("Already attack")
      return false
    }
  

    var d = manhattanDistance(this, target);
    
    if (d > this.atkrange){
      console.log("Out of range")
      return false
    }

    if (playerpool.get(CREST_ATTACK) < this.atkcost){
      console.log("Not enough attack crest")
      return false;
    }
    console.log(target.hp)
    target.hp = target.hp - this.atk;
    console.log("after attack" +target.hp)
    //setStatePanelText(target);
    //dead
    if (target.hp <= 0){
      target.remove()
    }
    this.hasAttacked = true;
    playerpool.set(CREST_ATTACK, playerpool.get(CREST_ATTACK) - this.atkcost);
    //updateCrest();
    return true;
  }

  this.remove = function(){
    game.monsters[this.id] = null;   
  }
}


var allplayers = [];
/*
function getCurrentPlayer(){
  return currentPlayer ;
}

function nextPlayer(){
  if (currentPlayer.id == allplayers[0].id){
    currentPlayer = allplayers[1];
    
  } else {
    currentPlayer = allplayers[0];
  }
  console.log(currentPlayer)

}




//var gameState = IDLE;

function setGameState(state){
  gameState = state;
  selectedUnit = EMPTY;

  //hideButton(movementButton,true);

} 
function getGameState(){
  return gameState;
}
*/

//pool states

function Pool(){
  this.pool = [5,5,5,5,5]

  this.set = function (crest, point){
    this.pool[crest] = point;
  }
  this.get = function(crest){
    return this.pool[crest]
  }

  this.update = function(crest, point){
    this.pool[crest] += point 
    //player.pool.set(crest, player.pool.get(crest) + point);
  }

}



// player state


var playerid = 0;
var PLAYER_ID


//player1 = new Player();
//player2 = new Player();
//currentPlayer = player1;

//PLAYER_ID = player1;

var rotateShape = function(shape,rotate){
  shape = shapes[shape];
  cshape = [[0,0],[0,0],[0,0],[0,0], [0,0],[0,0]]
  if (rotate == 0){
    for (var i=0; i<6; i++){
      cshape[i][0] = shape[i][0];
      cshape[i][1] = shape[i][1];
    }
  } else if (rotate == 1){
    for (var i=0; i<6; i++){
      cshape[i][0] = -shape[i][1];
      cshape[i][1] = -shape[i][0]
    }
  } else if (rotate == 2){
    for (var i=0; i<6; i++){
      cshape[i][0] = -shape[i][0];
      cshape[i][1] = -shape[i][1];
    }
  } else if (rotate == 3){
    for (var i=0; i<6; i++){
      cshape[i][0] = shape[i][1];
      cshape[i][1] = shape[i][0]
    }
  }
  return cshape;
}


var boundCursor = function(x, y){
  if (x>= boardSizeX || y >= boardSizeY ||x < 0 || y < 0){
      return false
    }
    return true;
}



var isUnitOnCursor = function(x, y){
  return boundCursor(x,y) && getUnitAtLocation([x,y]) != EMPTY
}

var getUnitOnCursor = function(x,y){
  if (isUnitOnCursor(x,y)) {
    return monsters[getUnitAtLocation([x,y])];
  } else {
    return null;
  }
}

var getUnitById = function(id){
  return monsters[id];

}




var drawSquare = function(x,y){
  ctx.fillRect(x,y,squareSize,squareSize);
  ctx.strokeRect(x,y,squareSize,squareSize);
}

var heartImg = "<img src='assets/img/heart.png' width = 15 height = 15;/>"


function setDicePanelText(text){
  dicePanel.innerHTML = text;
}


//triggers
var TRIGGER_MOUSE_CLICK = 0;
var TRIGGER_MOUSE_MOVE = 1;
var TRIGGER_KEY_PRESSED = 2;


var eventTriggerKey = 0;

var EVENT_LIST = [];

function Event(trigger, condition, action){
  this.trigger = trigger;
  this.condition = condition;
  this.action = action; 
  this.enabled = true;
  EVENT_LIST.push(this);
}

function registerClickEvent(condition, action){
  return new Event(TRIGGER_MOUSE_CLICK, condition, action)
}

function registerMoveEvent(condition, action){
  return new Event(TRIGGER_MOUSE_MOVE, condition, action)
}

function registerPressEvent(condition, action){
  return new Event(TRIGGER_KEY_PRESSED, condition, action)
}


function manhattanDistance(point, goal){
  return Math.abs(point.x - goal.x) + Math.abs(point.y- goal.y);
}


function Player(id){
  var PLAYER_STATE_IDLE = 0;
  var PLAYER_STATE_ROLL = 1;
  var PLAYER_STATE_SUMMON = 2
  var PLAYER_STATE_PLACEMENT = 3 
  var PLAYER_STATE_ACTION = 4;

  this.id = id;
  this.num;
  this.pool = new Pool();

  this.state = GAME_STATE_END;
  this.summon = [];
  this.summonlevel = 0;
  this.summonchoice = EMPTY;

  this.shape = 0;
  this.rotate = 0;

  this.cursorX;
  this.cursorY;

  this.tileSelected = []
  this.unitSelected = EMPTY;
  this.movePath = []
  this.rolled = false;
  this.summoned = false;
  this.valid = false;
  this.dices = [Dice_Teemo, Dice_Teemo, Dice_Teemo, Dice_Teemo, Dice_Teemo,
                Dice_Soraka, Dice_Soraka,Dice_Soraka, Dice_Soraka, Dice_Soraka,
                Dice_Poppy,Dice_Poppy,Dice_Poppy,Dice_Poppy,Dice_Poppy,];


  this.endTurn = function (game){
    this.state = GAME_STATE_END;
    var opponent = game.players[((this.num == 0) ? 1 : 0)]
    opponent.beginTurn(game);

  }

  this.beginTurn = function (game){
    //this.state = PLAYER_STA1T1E_IDLE;
    //setGameState(GAME_STATE_IDLE);
    console.log("begin")
    this.state = GAME_STATE_ROLL;
    this.summoned = false;
    this.rolled = false;
    this.unitSelected = EMPTY;
    this.summon = [];
    this.summonlevel = 0;
    this.shape = 0;
    this.rotate = 0;
    this.valid = false;

    //reset data
    for (var i=0; i<game.monsters.length;i++){
      if (game.monsters[i].player.num == this.num){
        game.monsters[i].hasAttacked = false;
        game.monsters[i].canAttacked = true;
      }
    }
  }

  this.onRoll = function(data){

    var summonlevel = 0;
    var summon = [[],[],[],[],[]];

    //var dicechoice= [];
      
    for (var i=0;i<data.length; i++){
      var dices = this.dices[data[i]]
      var r = dices.roll();
      
      if (r[0] != CREST_SUMMON){
        //console.log(this.pool);
        this.pool.update(r[0],r[1])
        //console.log(this.pool);
        console.log(CREST_TEXT[r[0]] + " " + r[1]);
  
      } else {
        summon[r[1]].push(data[i]);
        console.log("SUMMON " + r[1]);
        if (summon[r[1]].length > 1){
          summonlevel = r[1]
        }
      }
    }
    if (summonlevel){
      //string += "Summoning level: " + summonlevel + "<br\>";
      this.summon = summon[summonlevel];
      console.log(this.summon)
      //this.summonlevel = summonlevel
    }
    //console.log(this.summon)
    
  }

  this.onSummon= function(){
    console.log("on summon");  
    //this.state = PLAYER_STATE_SUMMON;
    //setGameState(TILE_PLACEMENT);
    //rollButton.disabled = true;
    //summonButton.disabled = true;
    //endturnButton.disabled = true;
    //hideSummonButton(false, this.summon);

  }


  return this;
}

//var newgame = function(){
//    io.to(p1.id).emit('game', {pnum: p1.num,game :game});
//    io.to(p2.id).emit('game', {pnum: p2.num,game :game});
//}

var update = function(game){
    var p1 = game.players[0];
    var p2 = game.players[1];
    if (!p1 || !p2){
      return;
    }
    //console.log(p1.id)
    //console.log(p2.id)
    io.to(p1.id).emit('updategame', {pnum: p1.num,game :game});
    io.to(p2.id).emit('updategame', {pnum: p2.num,game :game});
}



io.on('connection', function(socket){
    console.log('a user connected');

    socket.emit('new player id', socket.id)
    var p1 = new Player(socket.id);
    playersockets.push(p1);
    //console.log(playersockets);
    sockets[socket.id] = socket;

    var game = opengames.pop();

    if (!game){
      game = new Game();
      opengames.push(game);
      num = 0;
      games[socket.id] = game
      game.players.push(p1);
      p1.num = 0;
      console.log("created new game")
    } else {
      console.log("joined new game")  
      p1.num = 1;
      
      game.players.push(p1);
      games[socket.id] = game;
      game.init();
      game.players[0].beginTurn(game);

      var temp = [5,16];
      new Unit(game, p1, id1, temp);
      update(game);
      console.log(game.players[0].id)
      console.log("connecting with...");
      console.log(p1.id)
    }

      //console.log(playersockets.length)
      //var p2 = playersockets[playersockets.length-2];
      //game.players = [p1,p2]
      //game.currentPlayer = 0
      //new game
    //var game = new Game();

    //connection

    var createUnit = function (player, id, point){
      //console.log(point)
      if (!id) return;
      var game = games[player.id]
      new Unit(game, player, id, point);
    //var unit2 = new unit(id1, 2, 2, PLAYER_2);
    }

    var getCurrentPlayer = function(id){
      var game = games[id];
      var p1 = game.players[0];
      if (p1.id != id) {
        p1 = game.players[1]
      }
      return p1;
    }



    var c_tilemove = function (cursor){
      var game = games[socket.id]
      var p1 = getCurrentPlayer(socket.id)
      //console.log(socket.id)
      p1.cursorX = cursor.X;
      p1.cursorY = cursor.Y;
      //console.log(cursor.X,cursor.Y)
      p1.tileSelected = [];
      var cshape = rotateShape(p1.shape,p1.rotate);
      for (var i=0; i<cshape.length; i++){
        p1.tileSelected.push([cshape[i][0]+cursor.X, cshape[i][1]+cursor.Y])
      }
      p1.valid = game.board.validPlacement(p1)
      //console.log(p1.tileSelected)
      update(game); 
    }

    var c_unitpathmove = function (cursor){
            var p1 = getCurrentPlayer(socket.id)
      if (p1.unitSelected == EMPTY){
        console.log('1266:moving path when no unit is selected')
        return
      }
      var game = games[socket.id]
      var m = game.monsters[p1.unitSelected]
      //p1.movePath = game.board.findPossiblePath({x:m.x, y:m.y},p1.pool.get(CREST_MOVEMENT));
      //console.log([m.x, m.y],[cursor.X,cursor.Y])
      //p1.movePath =  game.board.findPath([m.x, m.y],[cursor.X,cursor.Y]);
      //var plen = p1.movePath.length

      ////console.log("movePath legnth:" + p1.pool.get(CREST_MOVEMENT))
      //if (plen < 2 || plen-1 > p1.pool.get(CREST_MOVEMENT)) { 
      //  p1.movePath = []
      //}   
      update(game);
    }

    var c_tilesconfig = function(data){
      var game = games[socket.id]
      var p1 = getCurrentPlayer(socket.id)
      var cshape = rotateShape(p1.shape,p1.rotate)
      console.log(cshape)
      
      p1.tileSelected = cshape;

      update(game);
    }

    //keypress event to change shape
    socket.on('c_tilesconfig', function(data){
      c_tilesconfig(data)
    });

    var c_tilesplace = function (){
      var game = games[socket.id]
      var p1 = getCurrentPlayer(socket.id)
      if (game.makeSelection(p1)){
        var point = [p1.cursorX, p1.cursorY];
        console.log("make selection");
        //console.log()
        createUnit(p1,p1.dices[p1.summonchoice].type,point)
        p1.dices[p1.summonchoice] = null;
        p1.tileSelected = [];
        p1.shape = 0;
        p1.rotate = 0;
        p1.summoned = true;
        p1.state = GAME_STATE_UNIT;
        update(game);
      }
    }


    var c_selectunit = function (){
      var game = games[socket.id]
      var p1 = getCurrentPlayer(socket.id)
      var m = game.monsters[game.board.getUnitAtLoc(p1.cursorX, p1.cursorY)]

      //console.log(game.board.getUnitAtLoc(p[0], p[1]));
      if (m){
        if (m.player == p1 ){
          if (m.id == p1.unitSelected){
            p1.unitSelected = EMPTY;
            console.log("deselect");
            p1.movePath = []
            p1.state = GAME_STATE_UNIT;
          } else {
            p1.unitSelected = m.id;
            p1.movePath = game.board.findPossiblePath([p1.cursorX, p1.cursorY],p1.pool.get(CREST_MOVEMENT))
            console.log("selecetd unit m0");
            p1.state = GAME_STATE_SELECT;
          }
        } 
      } else { 
        console.log("no unit on tile")
      }
      update(game);  
    }

    var unitmove = function(game, board, player, loc){

        var m = game.monsters[player.unitSelected]
        var path = board.findPath([m.x,m.y],loc);
    
        var plen = path.length

        if (plen > 1 && plen-1 <= player.pool.get(CREST_MOVEMENT)) { 
          player.movePath = [];

          //game.board.moveUnit(p1.unitSelected, data.X,data.Y);

          board.setUnitAtLoc([m.x, m.y], EMPTY)
          m.x = loc[0];
          m.y = loc[1];
          board.setUnitAtLoc(loc, player.unitSelected)
          player.pool.update(CREST_MOVEMENT,-(plen-1))
          player.unitSelected = EMPTY;
          player.state = GAME_STATE_UNIT;
        } 
    }

    var attack = function(player, target){ 
      if (game.monsters[player.unitSelected].attack(target)){
        console.log("attack!")
        player.unitSelected = EMPTY;
        player.movePath = [];
        player.state = GAME_STATE_UNIT;
      }
    }

    var reselection = function (board, player, target){
        if (target.id == player.unitSelected){
          player.unitSelected = EMPTY;
          console.log("deselect");
          player.movePath = []
          player.state = GAME_STATE_UNIT;
        } else {
          player.unitSelected = target.id;
          var pathoptions = board.findPossiblePath([player.cursorX, player.cursorY],player.pool.get(CREST_MOVEMENT))
          player.movePath = pathoptions;
        }
    }

    var c_actionunit = function(){
      var game = games[socket.id]
      var player = getCurrentPlayer(socket.id)
      var m = game.monsters[player.unitSelected]
      var u = game.board.getUnitAtLoc(player.cursorX, player.cursorY)
      //console.log("click")
      var loc = [player.cursorX, player.cursorY];
      if (u != EMPTY){
        var target = game.monsters[u];
        if (target.player != player){
          attack(player, target);
        } else if (target.player == player){
          reselection(game.board, player, target);

        } 
      } else if (game.board.getTileState(loc[0], loc[1]) != EMPTY) {
        unitmove(game, game.board, player, loc);
        console.log("move")
      } 
    }

    socket.on('end turn', function(){

      var game = games[socket.id]
      var player = getCurrentPlayer(socket.id)
      if (!game.isPlaying(player)) return
      player.endTurn(game);
      game.turn++;
      //console.log('end turn')
      
      update(game)
    });

    socket.on('mouse move', function(data){
      //console.log(data)
      var game = games[socket.id]
      var player = getCurrentPlayer(socket.id)
      if (!game.isPlaying(player)) return

      player.cursorX = data.X;
      player.cursorY = data.Y;

      if (player.tileSelected.length > 0){
        c_tilemove(data)
      } else if (player.state == GAME_STATE_SELECT){
        c_unitpathmove(data);
      }
      update(game);
    });

    socket.on('mouse click', function (){
      var game = games[socket.id]
      var player = getCurrentPlayer(socket.id)
      if (!game.isPlaying(player)) return
      if (player.state == GAME_STATE_SUMMON){
        //console.log("tile place")
        c_tilesplace();
      } else if (player.state == GAME_STATE_SELECT){
          c_actionunit();    
      } else if (player.state == GAME_STATE_UNIT){
        c_selectunit();
      } 
      update(game)
    })

    socket.on('rotate shape', function(){
      var game = games[socket.id];
      var p1 = getCurrentPlayer(socket.id);
      if (!game.isPlaying(p1)) return
      if (p1.tileSelected.length == 0) return;
      p1.rotate++;
      if (p1.rotate == 4){
        p1.rotate = 0; 
      }
      p1.tileSelected = [];
      var cshape = rotateShape(p1.shape,p1.rotate);
      for (var i=0; i<cshape.length; i++){
        p1.tileSelected.push([cshape[i][0]+p1.cursorX, cshape[i][1]+p1.cursorY])
      }
      update(game)
    })

    socket.on('change shape', function(){
      var game = games[socket.id];
      var p1 = getCurrentPlayer(socket.id);
      if (!game.isPlaying(p1)) return
      if (p1.tileSelected.length == 0) return;
      p1.shape++;
      if (p1.shape == shapes.length){
        p1.shape = 0;    
      }
      p1.tileSelected = [];
      var cshape = rotateShape(p1.shape,p1.rotate);
      for (var i=0; i<cshape.length; i++){
        p1.tileSelected.push([cshape[i][0]+p1.cursorX, cshape[i][1]+p1.cursorY])
      }
      update(game)
    })


    socket.on('c_roll', function(data){
      var game = games[socket.id]
      var p1 = getCurrentPlayer(socket.id)
      if (!game.isPlaying(p1)) return
      //var gain = p1.pool.pool.slice();

      
      if (data.length != 3) return;

      p1.onRoll(data)
      p1.state = GAME_STATE_SUMMON;

      //var names = []
      //for (var i=0; i<p1.summon.length; i++){
      //  names.push(p1.summon[i].type)
      //} 
      
      //p1.rolled = true;
      update(game)

    });



    socket.on('c_summonoption', function (data){
      var game = games[socket.id]
      var p1 = getCurrentPlayer(socket.id)
      if (!game.isPlaying(p1)) return
      console.log("summon dice choice:" +data)

      p1.summonchoice = data;

      p1.tileSelected = []
      var cshape = rotateShape(p1.shape,p1.rotate);
      for (var i=0; i<cshape.length; i++){
        p1.tileSelected.push([cshape[i][0]+p1.cursorX, cshape[i][1]+p1.cursorY])
      }
  
      update(game)
      //socket.emit('updategame', {pnum: p1.num,game:game});

    });


    socket.on('disconnect', function(){
          console.log('user disconnected');
    });
});

http.listen(3000, function(){
  console.log('listening on http://localhost:3000');
});
//import "server.js"






var boardSizeX = 13;
var boardSizeY= 19;
//canvaswidth = 580;
//canvasheight =580;
//state codes

//board states


var rotateShape = function(shape,rotate){
  shape = shapes[shape];
  cshape = [[0,0],[0,0],[0,0],[0,0], [0,0],[0,0]]
  if (rotate == 0){
    for (var i=0; i<6; i++){
      cshape[i][0] = shape[i][0];
      cshape[i][1] = shape[i][1];
    }
  } else if (rotate == 1){
    for (var i=0; i<6; i++){
      cshape[i][0] = -shape[i][1];
      cshape[i][1] = -shape[i][0]
    }
  } else if (rotate == 2){
    for (var i=0; i<6; i++){
      cshape[i][0] = -shape[i][0];
      cshape[i][1] = -shape[i][1];
    }
  } else if (rotate == 3){
    for (var i=0; i<6; i++){
      cshape[i][0] = shape[i][1];
      cshape[i][1] = shape[i][0]
    }
  }
  return cshape;
}