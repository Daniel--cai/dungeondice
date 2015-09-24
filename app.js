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


  this.makeSelection = function(player){
    //console.log(this.tileSelected.length)
    if (player.tileSelected.length > 0 && this.board.validPlacement(player)){
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
    console.log("setUnitAtLocid");
    console.log(id);
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

    valid = false;
    for (var i=0; i<6; i++){
      //boundaries
      //console.log(selection)
      x = selection[i][0];
      y = selection[i][1];
      
      if (!boundCursor(x,y) || this.getTileState(x,y) != EMPTY){
        return false;
      }
      //adjacent

      if (this.getTileState(x+1,y) != EMPTY || 
        this.getTileState(x-1,y) != EMPTY ||
        this.getTileState(x,y-1) != EMPTY ||
        this.getTileState(x,y+1) != EMPTY ){
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
  hp: 30,
  atk: 20,
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
                [CREST_SUMMON,1],
                [CREST_SUMMON,1]])

var Dice_Soraka = new Dice(id1, [[CREST_SUMMON,1],
                 [CREST_SUMMON,1],
                 [CREST_SUMMON,1],
                 [CREST_SUMMON,1],
                 [CREST_SUMMON,3],
                 [CREST_SUMMON,1]]);


var Dice_Poppy = new Dice(id2, [[CREST_SUMMON,3],
                 [CREST_SUMMON,3],
                 [CREST_DEFENSE,3],
                 [CREST_MOVEMENT,1],
                 [CREST_MAGIC,3],
                 [CREST_TRAP,2]])

var Dice_Poppy = new Dice(id2, [[CREST_SUMMON,3],
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
    playerpool = allplayers[this.player].pool
    if (this.hasAttacked) {
      console.log("Already attack")
      return false
    }
  

    var d = manhattanDistance(this, target);
    console.log(d)
    if (d > this.atkrange){
      console.log("Out of range")
      return false
    }

    if (playerpool.get(CREST_ATTACK) < this.atkcost){
      console.log("Not enough attack crest")
      return false;
    }



    target.hp = target.hp - this.atk;
    setStatePanelText(target);
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
    monsters[this.id] = -1;   
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
/*
addEventListener("keypress", function(e){
    //keysDown[e.keyCode] = true;
    //console.log(e.charCode);
    if (e.charCode == 122){
      //console.log("rotate");
      rotate++;
      if (rotate == 4){
        rotate = 0; 
      }
      validpos = validPlacement();
    } else if (e.charCode == 99){
      shape++;
      
      if (shape == shapes.length){
        shape = 0;    
      }
      //validpos = validPlacement();
    }
    //render();
}, false);
*/



//cursorX = 0;
//cursorY = 0;
//pageX = 0;
//pageY = 0;
//PLAYER_ID.pool.set(CREST_MOVEMENT, 5);



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


var moveUnit = function (id, x, y ){
  m = id;
  if (!id){
    console.log("Warning. Moving null unit.")
    return
  }
  l = findPath([m.x, m.y], [x,y]).length;
  if (l>1 && player1.pool.get(CREST_MOVEMENT) >= l-1){
    //setUnitAtLocation(EMPTY, [m.x, m.y]);
    //units[m.x][m.y]=EMPTY;
    m.x = x;
    m.y = y;
    //setUnitAtLocation(m.id, [x,y])
    //units[x][y]=id;
    PLAYER_ID.pool.set(CREST_MOVEMENT, PLAYER_ID.pool.get(CREST_MOVEMENT) - l+1);
    //updateCrest()
  }

}


var drawSquare = function(x,y){
  ctx.fillRect(x,y,squareSize,squareSize);
  ctx.strokeRect(x,y,squareSize,squareSize);
}

var heartImg = "<img src='assets/img/heart.png' width = 15 height = 15;/>"


function setDicePanelText(text){
  dicePanel.innerHTML = text;
}

function setStatePanelText(m){
  var text = "";
  if (m){
    hpheart = "";
    for (var i=0;i<m.hp;i=i+10){
      hpheart = hpheart+heartImg;
    }
    text =  "<b>"+ m.name + "</b><br>" +  
        "<b>HP</b> : "  + hpheart +"<br>" +
        "<b>ATK</b> : " + m.atk +"<br>" +
        "<b>DEF</b> : " + m.def +"<br>"
  }     
  statPanel.innerHTML = text;
}




/*
var drawBoard = function(board){
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  //ctx.shadowBlur = 5;
  //ctx.shadowColor = "grey";
  //board[6][7] =  1;
  for (var i=0; i< boardSizeX; i++){
    for (var j=0;j<boardSizeY; j++){
      if (game.board.getTileState(i,j)== PLAYER_1){
        ctx.fillStyle = green;
      } else if (game.getTileState(i,j) == PLAYER_2){
        ctx.fillStyle = blue; 
      } else if (game.getTileState(i,j) == EMPTY ){
        ctx.fillStyle = "#303030";
      }
      drawSquare(i*squareSize,j*squareSize);
    }
  }

}
/*
var drawCircle = function(x,y,w,player) {
  ctx.beginPath();
  ctx.arc(x*squareSize+ squareSize/2, y*squareSize+ squareSize/2, squareSize/2, 0, 2 * Math.PI, false);
  if (player == PLAYER_1){
    ctx.fillStyle = "#008080";
  } else if (player == PLAYER_2){
    ctx.fillStyle = "#808000";
  }
  ctx.fill();

  ctx.lineWidth = w;
  ctx.strokeStyle = '#000000';
  ctx.stroke();
}

var drawUnits = function() {
  for(var i=0; i<monsters.length; i++) {
    //console.log(monsters[i]);
    m = monsters[i];
    w = 1;
    p = getCurrentPlayer()
    if (p.unitSelected && p.unitSelected.id == m.id){
      w = 3;
    }
    drawCircle(m.x, m.y,w, m.player);

  }

}


var render = function() {

  //cshape = shapes[ishape][rotate];
  //ctx.clearRect(0,0,canvas.width,canvas.height);
  //drawBoard();
  //drawUnits();
}
*/

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
//function(){getGameState() == TILE_PLACEMENT}


/*
registerClickEvent( 
  function(){return getGameState() == TILE_PLACEMENT} ,
  function(){
    
    //this.enabled = false;f
  });

registerClickEvent(function(){return getCurrentPlayer().unitSelected},
  function(){

    var p = getCurrentPlayer()
    var u = p.unitSelected;
    var m = getUnitOnCursor(cursorX,cursorY);
    //console.log("heselectionat " +cursorX, cursorY)
    if (m){
      //deselect
    
      p.movePath = []
      if (m.id == u.id){
        p.unitSelected = null;
        setGameState(IDLE);
        SelectEvent.enabled = false;
      //new selection
      } else if (m.player == PLAYER_1){
        p.unitSelected = m;
      //attacking
      } else if (m.player == PLAYER_2){
        if (u.attack(m)){
          p.unitSelected = null;
        }
      }
        
    } else if (boundCursor(cursorX, cursorY)){
      if (game.getTileState(cursorX, cursorY) != EMPTY){
        moveUnit(u, cursorX,cursorY);
        
        p.movePath = []
        SelectEvent.enabled = false;
      }
      setGameState(IDLE);
      p.unitSelected = null;

    }

    //render();
  })

SelectEvent = registerClickEvent(
  function(){return !getCurrentPlayer().unitSelected},
  function(){ 
    
    var m = getUnitOnCursor(cursorX,cursorY);
    if (m && m.player == PLAYER_1){
      
      //setGameState(UNIT_SELECT);
      //selectedUnit = m.id;
      getCurrentPlayer().unitSelected = m
      //render();
      //console.log("selected unit id: " + m);    
    }
  });

registerClickEvent(
  function(){return getCurrentPlayer().tileSelected.length > 0},
  function(){
    var p = getCurrentPlayer()
    if (p.makeSelection()){
      createUnit(id0,cursorX, cursorY, p);
      setGameState(IDLE);
      hideSummonButton(true);
      endturnButton.disabled = false;
      //render unit
      game.board.render()
    }


  });

registerMoveEvent(
  function(){retumakeSelectionrn getCurrentPlayer().unitSelected}, 
  function(){
    
    var m = getCurrentPlayer().unitSelected;
    getCurrentPlayer().movePath = findPath([m.x, m.y],[cursorX,cursorY]);

    //console.log("move length is " + movePathSelection.length)
    game.board.render()
    /*
    if (movePathSelection.length <= getCurrentPlayer().pool.get(CREST_MOVEMENT)) {      
      ctx.globalAlpha = 0.5;
      console.log("drawing")
      for (var i=1; i<movePathSelection.length; i++){ 
        ctx.fillStyle= "#000000";
        ctx.strokeStyle = "#303030";
        ctx.lineWidth = 1;
        drawSquare(movePathSelection[i][0]*squareSize, movePathSelection[i][1]*squareSize )
      }
      ctx.globalAlpha = 1.0;  
    };
    });
  
  


registerMoveEvent(
  function(){return true},
  function(){
    m = getUnitOnCursor(cursorX,cursorY);
    u = getCurrentPlayer().unitSelected
    if (m){
      setStatePanelText(m)
    } else if (u){
      setStatePanelText(u)
    } else {
      setStatePanelText()
    }
  });

registerMoveEvent(
  function(){return getGameState() == TILE_PLACEMENT},
  function(){
    //console.log('bug');
    //validpos = ;
    //draw square;
  });

registerMoveEvent(
  function(){return getGameState() == TILE_PLACEMENT}, 
  function(){
    var cursorX = 0;
    var cursorY = 0;
    var shape = 0;
    var rotate = 0;
    var x = (cursorX*squareSize)-squareSize ;
    var y = (cursorY*squareSize)-squareSize;
    //render();
    
    //var pattern = [for (i of rotateShape(shape,rotate)) [i[0]+cursorX, i[1]+cursorY]]
    //console.log(pattern)
    var pattern = [];
    var cshape = rotateShape(shape,rotate)
    for (var i=0; i< cshape.length;i++){
      pattern.push([cshape[i][0]+cursorX, cshape[i][1]+cursorY])
    }
    getCurrentPlayer().tileSelected = pattern;
    
    ctx.globalAlpha = 0.5;
    
    validpos = validPlacement();
    for (var i = 0; i<6; i++){
      if (!validpos) {
        ctx.fillStyle = red;
      } else if (i == 0){
        ctx.fillStyle = blue;
      } else if (validpos) {
        ctx.fillStyle = green;
      } 
      ctx.strokeStyle = "#303030";
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.shadowColor = "grey";
      drawSquare((cshape[i][0])*squareSize+squareSize+x, (cshape[i][1])*squareSize+squareSize+y);
    }
    ctx.globalAlpha = 1;  
    
    //game.board.render()
  })
*/
//movePathSelection
/*
registerMoveEvent(
  function(){return getGameState() == UNIT_SELECT && movePathSelection.length > 1},
  function(){
    
    ctx.globalAlpha = 0.5;
    for (var i=1; i<movePathSelection.length; i++){
      
      ctx.fillStyle= "#000000";
      ctx.strokeStyle = "#303030";
      ctx.lineWidth = 1;
      drawSquare(movePathSelection[i][0]*squareSize, movePathSelection[i][1]*squareSize )
    }
    ctx.globalAlpha = 1.0;  
  });
*/


function manhattanDistance(point, goal){
  return Math.abs(point.x - goal.x) + Math.abs(point.y- goal.y);
}





var middle = false;


var then = Date.now();
var init = function (){
 // updateCrest()
  //if (bgReady){
  main();
  PLAYER_ID.beginTurn();
  console.log("ready")
  //}
}

var drawGame = function(){
  var now = Date.now();
  var delta = now - then;
  
  render();
  then = now;
  
}

//if (PLAYER_ID.isPlaying()) {
//  //PLAYER_ID.nextState();
//}

var main = function(){
  drawGame();
  //requestAnimationFrame(main);
  //printCursor();

}



//
//
//
//
//  FIXED
//
//
//
function Player(id){
  var PLAYER_STATE_IDLE = 0;
  var PLAYER_STATE_ROLL = 1;
  var PLAYER_STATE_SUMMON = 2
  var PLAYER_STATE_PLACEMENT = 3 
  var PLAYER_STATE_ACTION = 4;

  this.id = id;
  this.num;
  this.pool = new Pool();

  //this.state = PLAYER_STATE_IDLE;
  this.summon = [];
  this.summonlevel = 0;
  this.summonchoice = EMPTY;

  this.shape = 0;
  this.rotate = 0;

  this.cursorX;
  this.cursorY;

  //public variables
  this.tileSelected = []
  this.unitSelected = EMPTY;
  this.movePath = []

/*
  this.isPlaying = function(){

    return PLAYER_ID.id == getCurrentPlayer().id
  }

  this.disabled = function(a,b,c){
    rollButton.disabled = a;
    summonButton.disabled = b;
    endturnButton.disabled = c;
  }


  this.onIdle = function(){

  }
*/
  this.beginTurn = function (){
    //this.state = PLAYER_STATE_IDLE;
    //setGameState(GAME_STATE_IDLE);
    rollButton.disabled = false;
    summonButton.disabled = true;
    endturnButton.disabled = true;
    hideSummonButton(true);

    //reset data
    for (i=0;i<monsters.length;i++){
      monsters[i].hasAttacked = false;
    }
  }

  this.onRoll = function(){

    var dices = [Dice_Teemo, Dice_Soraka, Dice_Teemo];
      

    var summonlevel = 0;
    var summon = [[],[],[],[],[]];
    //update crestpool
    for (var i=0;i<dices.length; i++){
    
      var r = dices[i].roll();
    
      if (r[0] != CREST_SUMMON){
        //console.log(this.pool);
        this.pool.update(r[0],r[1])
        //console.log(this.pool);
        console.log(CREST_TEXT[r[0]] + " " + r[1]);
  
      } else {
        summon[r[1]].push(dices[i]);
        console.log("SUMMON " + r[1]);
        if (summon[r[1]].length > 1){
          summonlevel = r[1]
        }
      }
    }
    if (summonlevel){
      //string += "Summoning level: " + summonlevel + "<br\>";
      this.summon = summon[summonlevel];
      this.summonlevel = summonlevel
    }

    
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

  this.endTurn = function(){
    this.state = PLAYER_STATE_IDLE;
    
    nextPlayer();
    //console.log("ending turn")
    summonButton.disabled = true;
    endturnButton.disabled = true;
    rollButton.disabled = true;
    setGameState(GAME_STATE_STOP);


    //render unselected unit
    //render();


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


    socket.on('c_roll', function(data){
      var game = games[socket.id]
      var p1 = getCurrentPlayer(socket.id)
      //var player = games.allplayers;
      console.log('rolling ' + data.dices);
      var gain = p1.pool.pool.slice();
      //console.log(gain)
      p1.onRoll()
      
      for (var i=0; i<gain.length; i++){
        gain[i] = p1.pool.get(i) - gain[i];
      }
      console.log(p1.pool.pool)
      console.log(gain)
      var names = []
      for (var i=0; i<p1.summon.length; i++){
        names.push(p1.summon[i].type)
      } 

      var datato = {
        summon: names, 
        pool: p1.pool.pool, 
        level: p1.summonlevel, 
        gain: gain,
      }
      socket.emit('s_roll',datato)
    });



    socket.on('c_summonoption', function (data){
      var game = games[socket.id]
      var p1 = getCurrentPlayer(socket.id)
      
      //console.log(p1)

      p1.summonchoice = data;
      p1.tileSelected = rotateShape(p1.shape,p1.rotate)
      //console.log('summoinggd')
      //console.log(p1.tileSelected)
      update(game)
      //socket.emit('updategame', {pnum: p1.num,game:game});

    });

    var c_tilemove = function (cursor){
      var game = games[socket.id]
      var p1 = getCurrentPlayer(socket.id)
      console.log(socket.id)
      p1.cursorX = cursor.X;
      p1.cursorY = cursor.Y;
      //console.log(cursor.X,cursor.Y)
      p1.tileSelected = [];
      var cshape = rotateShape(p1.shape,p1.rotate);
      for (var i=0; i<cshape.length; i++){
        p1.tileSelected.push([cshape[i][0]+cursor.X, cshape[i][1]+cursor.Y])
      }
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
      //console.log([m.x, m.y],[cursor.X,cursor.Y])
      p1.movePath =  game.board.findPath([m.x, m.y],[cursor.X,cursor.Y]);
      var plen = p1.movePath.length

      //console.log("movePath legnth:" + p1.pool.get(CREST_MOVEMENT))
      if (plen < 2 || plen-1 > p1.pool.get(CREST_MOVEMENT)) { 
        p1.movePath = []
      }   
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

    var c_tilesplace = function (data){
      var game = games[socket.id]
      var p1 = getCurrentPlayer(socket.id)
      if (game.makeSelection(p1)){
        var point = [p1.cursorX, p1.cursorY];
        console.log("make selection");
       
        createUnit(p1,id0,point)
        p1.tileSelected = [];
        p1.shape = 0;
        p1.rotate = 0;
        update(game);
      }
    }

    var c_selectunit = function (p){
      var game = games[socket.id]
      var p1 = getCurrentPlayer(socket.id)
      console.log("c_select unit")
      //console.log(game.board.units)
      console.log(game.board.getUnitAtLoc(p.X, p.Y))
      console.log("c_select unit2")
      var m = game.monsters[game.board.getUnitAtLoc(p.X, p.Y)]

      //console.log(game.board.getUnitAtLoc(p[0], p[1]));
      if (m){
        if (m.player == p1 ){
          if (m.id == p1.unitSelected){
            p1.unitSelected = EMPTY;
            console.log("deselect");
          } else {
            p1.unitSelected = m.id;
            console.log("selecetd unit m0");
          }
        } else {
          console.log("attack!")
        }
      } else { 
        console.log("no unit on tile")
      }
      update(game);  
    }

    socket.on('mouse move', function(data){
      //console.log(data)
      var game = games[socket.id]
      var player = getCurrentPlayer(socket.id)
      if (player.tileSelected.length > 0){
        c_tilemove(data)
      } else if (player.unitSelected != EMPTY){
        c_unitpathmove(data);

      }

    });

    socket.on('mouse click', function (data){
      var game = games[socket.id]
      var player = getCurrentPlayer(socket.id)
      if (player.tileSelected.length > 0){
        //console.log("tile place")
        c_tilesplace(data);
      } else if (boundCursor(data.X,data.Y)){
        c_selectunit(data);
      }
    })



    socket.on('disconnect', function(){
          console.log('user disconnected');
          /*
          for (i=0; i<playersockets.length; i++){
              if (players[i].id == socket.id){
                  players[i].id = ""
              }
          }

          io.emit('new player id', players)
          */
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