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
var GAME_STATE_COMBAT = 3;
var GAME_STATE_SELECT = 4;
var GAME_STATE_END = 5;

var PLAYER_STATE_NEUTRAL = 0;
var PLAYER_STATE_MOVE = 1;
var PLAYER_STATE_ATTACK = 2;
var PLAYER_STATE_SPELL_TARGET = 3;
var PLAYER_STATE_SPELL_LOC = 4;



var Game = function (){
  this.players = []
  this.turn = 0;
  this.board;
  //this.currentPlayer;
  this.monsters =[];
  this.combat = null;
  this.props = [];
  //this.chain = [];

  //this.timeout = false;

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

var Dice_Teemo = new Dice(id0, [[CREST_SUMMON,2],
                [CREST_SUMMON,2],
                [CREST_SUMMON,2],
                [CREST_SUMMON,2],
                [CREST_MAGIC,3],
                [CREST_MOVEMENT,1]])

var Dice_Soraka = new Dice(id1, [[CREST_SUMMON,1],
                 [CREST_SUMMON,1],
                 [CREST_SUMMON,1],
                 [CREST_SUMMON,1],
                 [CREST_DEFENSE,3],
                 [CREST_MAGIC,3]]);


var Dice_Poppy = new Dice(id2, [[CREST_SUMMON,3],
                 [CREST_SUMMON,3],
                 [CREST_SUMMON,3],
                 [CREST_SUMMON,3],
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


var SpellID = 0;
var SpellList = []

function Spell(name, cost, target){
  this.name = name;
  this.cost = cost;
  this.id =  SpellID;
  this.cooldown = 1;
  this.target = target

  this.onAttack = null;
  SpellID++;
}


var UNIT_STATUS_STUNNED = 0;
var UNIT_STATUS_KNOCKED_UP = 1;
var UNIT_STATUS_SILENCED = 2

function Buff(name, duration){
  this.name = name;
  this.duration = duration;
  this.durationcounter = duration;
  this.owner = null;

  this.onApply = function(){console.log("onApply not implemented for " + this.name)};
  this.onEffect = function(){console.log("onEffect not implemented for " + this.name)};
  this.onFinish = function(){console.log("onFinish not implemented for " + this.name)};
  this.onAttack = function(){console.log("onAttack not implemented for " + this.name)};
  this.onDefend = function(){console.log("onDefend not implemented for " + this.name)};
  this.onMove = function(){console.log("onMove not implemented for " + this.name)};;
}

var BUFF_stun = new Buff("Stunned", 1);
var BUFF_silence = new Buff("Silenced", 1);
var BUFF_root = new Buff("Root", 1);
var BUFF_knock_up = new Buff("Knock Up", 1);

var SPELL_TEEMO1 = new Spell("Blinding Dart", [CREST_ATTACK, 2], "enemy")

var SPELL_TEEMO2 = new Spell("Noxious Trap", [CREST_MAGIC, 2], "location")


//SPELL_TEEMO1.target = [ENEMY];
//var BUFF_TEEMO1 = new Buff("Blinding Dart", 1);

function ApplyBuff(caster, target, buff){
  for (var i = 0; i<target.buff.length; i++){
    if (target.buff[i].name == buff.name){
      return;
    }
  }
  target.buff.push(buff);
  buff.owner = caster;
}

function DamageUnit(trigger, target, damage){
  //event
  if (damage <=0) return false
  target.hp = target.hp - damage;
  if (target.hp <= 0){
    target.remove()
  }
  return true;
}
function DamageLoc (trigger, targetlocation){}



SPELL_TEEMO1.onEffect = function(event){
  //console.log(event)
  var buff = new Buff("Blinding Dart", 1);
  buff.onAttack = function(event){
    event.dmg = 0;
    var game = games[event.attacker.player.id]
    alertGlobal(game, "Missed!")
  }
  ApplyBuff(event.trigger, event.target, buff)
  //DamageUnit(event.trigger, event.target, 10);


  return "";
}

SPELL_TEEMO2.onEffect = function(event){
  var mushroom = new Prop("Toxic Mushroom", event.trigger.player, event.location);
  mushroom.onCollision = function(event){
    var game = games[event.trigger.player.id]
    alertGlobal(game, "Toxic Mushroom!")
    
  }  
  //console.log(event)
  //var buff = new Buff("Blinding Dart", 1);
  //ApplyBuff(event.trigger, event.target, buff)
  //DamageUnit(event.trigger, event.target, 10);


  return "";
}


//idcounter = 0;

function Combat(unit, target){
  this.unit = unit;
  this.target = target;
  this.atkmodifier = unit.atk;
  this.defmodifier = 0;
}

function Prop(name, player, point) {
  this.x = point[0];
  this.y = point[1];
  this.player = player;
  this.name = name;
  this.onCollision = function(){console.log(name + ".onCollision not implemented")};
  games[player.id].props.push(this)
  return this;
}

function Unit(game, player, type, point, level) {
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
  if (level)this.level = level;
  this.hasAttacked = false;
  this.canAttacked = true;
  this.atkcost = 1;
  this.atkrange = 1;
  this.buff = []

  this.spells = [SPELL_TEEMO1, SPELL_TEEMO2];

  //this.game = game;
  game.monsters.push(this);
  this.id = game.monsters.length-1;
  game.board.setUnitAtLoc(point,this.id);
  
  this.guard = function(target){
    //socket = sockets[player.id];
    game = games[player.id]
    game.combat = new Combat(this, target);
    var opponent = game.players[((player.num == 0) ? 1 : 0)]
    opponent.state = GAME_STATE_COMBAT;
    this.player.state = GAME_STATE_COMBAT;
    console.log("changing state to combat: " + opponent.num)
    update(game);

    //socket.emit('guard trigger', );
  }

  this.postattack = function(target){
    console.log(target.hp)
    game = games[this.player.id]
    combat = game.combat;
    var dmg = combat.atkmodifier - combat.defmodifier;
    if (dmg < 0) {
      dmg = 0;
    }
    var event = {attacker: this, target: target, dmg: dmg }
    for (var i=0; i< this.buff.length; i++){
      
      this.buff[i].onAttack(event);
      //if (this.buff[i].name == "Blinding Dart"){
      //  dmg = 0;
      //  alertGlobal(game, "Missed!")
      //}
    }

    if (DamageUnit(event.attacker, event.target, event.dmg)){
      console.log(combat.atkmodifier + " mod " + combat.defmodifier)
      console.log("after attack " +target.hp)
    }
    //target.hp = target.hp - dmg;
    //console.log(combat.atkmodifier + " mod " + combat.defmodifier)
    //console.log("after attack " +target.hp)
    //setStatePanelText(target);
    //dead

    delete combat;
    game.combat = null;
    this.hasAttacked = true;
    this.player.unitSelected = EMPTY;
    this.player.movePath = [];
    this.player.state = GAME_STATE_UNIT;
    this.player.actionstate = PLAYER_STATE_NEUTRAL;
    //var opponent = game.players[((this.num == 0) ? 1 : 0)]
    target.player.state = GAME_STATE_UNIT;

    this.player.pool.set(CREST_ATTACK, this.player.pool.get(CREST_ATTACK) - this.atkcost);
    //updateCrest();
    update(game);

  }

  var reset = function(game){

  }

  this.attack = function(target){
    playerpool = this.player.pool;
    //console.log(target)
   var d = manhattanDistance(this, target);
    if (playerpool.get(CREST_ATTACK) < this.atkcost){
      console.log("Not enough attack crest")


      return false;
    }


    if (d > this.atkrange){
      console.log("Out of range")

      var socket = sockets[this.player.id]
      socket.emit('alert', "Out of range");
      return false
    }
    if (this.hasAttacked) {
      console.log("Already attack")
      game = games[this.player.id]
     
      var socket = sockets[this.player.id]
      socket.emit('alert', "Already attacked");
      return false
    }
  
 
    



    //this.postattack(target);
    
    if (target.player.pool.get(CREST_DEFENSE) > 0){
      this.guard(target);
    } else {
      this.postattack(target);
    }
   
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



//triggers
var TRIGGER_MOUSE_CLICK = 0;
var TRIGGER_MOUSE_MOVE = 1;
var TRIGGER_KEY_PRESSED = 2;
var TRIGGER_UNIT_DEATH = 3;
var TRIGGER_UNIT_ATTACK = 3;
var TRIGGER_UNIT_ATTACKED = 3;
var TRIGGER_TURN_END = 4;



var eventTriggerKey = 0;

var EVENT_LIST = [];

function Event(trigger, condition, action){
  this.trigger = trigger;
  this.condition = condition;
  this.action = action; 
  this.enabled = true;
  EVENT_LIST.push(this);
  this.triggerunit = null;
  this.targetunit = null;
  this.location = null;
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

  this.id = id;
  this.num;
  this.pool = new Pool();

  this.state = PLAYER_STATE_NEUTRAL;
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


  this.spell = EMPTY;

  this.endTurn = function (game){

    sockets[this.id].emit('alert', "End Phase");
    this.state = GAME_STATE_END;
    var opponent = game.players[((this.num == 0) ? 1 : 0)]
    opponent.beginTurn(game);

    this.tileSelected = []
    this.unitSelected = EMPTY;
    this.movePath = []


  }

  this.beginTurn = function (game){

    //setGameState(GAME_STATE_IDLE);
    console.log("begin")
    this.state = GAME_STATE_ROLL;
    sockets[this.id].emit('alert', "Dice Roll Phase");
    this.summoned = false;
    this.rolled = false;
    this.summon = [];
    this.summonlevel = 0;
    this.shape = 0;
    this.rotate = 0;
    this.valid = false;
    this.spell = EMPTY
    this.actionstate = PLAYER_STATE_NEUTRAL;

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
    var result = [];
    //var dicechoice= [];
      
    for (var i=0;i<data.length; i++){
      var dices = this.dices[data[i]]
      var r = dices.roll();
      result.push(r)
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
    return result;
    //console.log(this.summon)
    
  }

  this.onSummon= function(){
    console.log("on summon");  

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

function alertGlobal(game, alert){
    var p1 = game.players[0];
    var p2 = game.players[1];
    if (!p1 || !p2){
      return;
    }
    //console.log(p1.id)
    //console.log(p2.id)
    io.to(p1.id).emit('alert', alert );
    io.to(p2.id).emit('alert', alert );
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

      var temp = [4,16];
      new Unit(game, game.players[0], id1, temp);
      var temp = [5,16];
      new Unit(game, game.players[1], id1, temp);
      var temp = [6,16];
      new Prop("Toxic Mushroom", p1, temp);
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
        console.log('925:moving path when no unit is selected')
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
        socket.emit('alert', 'Action Phase')
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
    
        var plen = path.length;

        if (plen > 1 && plen-1 <= player.pool.get(CREST_MOVEMENT)) { 
          var event = {trigger: m, location: loc}
          for (var i=0; i<path.length; i++){
              for (var j=0; j<game.props.length; j++){
                if (game.props[j] && game.props[j].x == path[i][0] && game.props[j].y == path[i][1]){
                  game.props[j].onCollision(event);
                }
              }
             
          }
          //player.movePath = [];

          //game.board.moveUnit(p1.unitSelected, data.X,data.Y);

          board.setUnitAtLoc([m.x, m.y], EMPTY)
          m.x = loc[0];
          m.y = loc[1];
          board.setUnitAtLoc(loc, player.unitSelected)
          player.pool.update(CREST_MOVEMENT,-(plen-1))
          clear(player);

          //prop onCollision events

          return true;
        } 
        return false;
    }

    var attack = function(player, target){ 
      if (game.monsters[player.unitSelected].attack(target)){
        console.log("attack!")

      }
    }

    var reselection = function (board, player, target){
        if (target.id == player.unitSelected){

          console.log("deselect");
          clear(player)
        } else if (target.player.id == player.id) {
          console.log("reselect");
          player.unitSelected = target.id;
          var pathoptions = board.findPossiblePath([player.cursorX, player.cursorY],player.pool.get(CREST_MOVEMENT))
          player.movePath = pathoptions;
        }
    }

    var clear = function (player){
      player.unitSelected = EMPTY;
      player.state = GAME_STATE_UNIT;
      player.actionstate = PLAYER_STATE_NEUTRAL;
      player.movePath = []
      player.spell = EMPTY;
      //console.log()
    }


    var c_actionunit = function(game, player){
      //var game = games[socket.id]
      //var player = getCurrentPlayer(socket.id)
      var m = game.monsters[player.unitSelected]
      var u = game.board.getUnitAtLoc(player.cursorX, player.cursorY);
      //console.log("click")
      var loc = [player.cursorX, player.cursorY];
      if (player.actionstate == PLAYER_STATE_NEUTRAL){
       
        var m = game.monsters[u];
        if (u != EMPTY) {
          reselection(game.board, player, m)
        };
			} else if (player.actionstate == PLAYER_STATE_MOVE){
  			if (game.board.getTileState(loc[0], loc[1]) != EMPTY){
            if (!unitmove(game, game.board, player, loc)){
              socket.emit('alert', 'Invalid movement');
            }
            //console.log("move");
          
        }

			} else if (player.actionstate == PLAYER_STATE_ATTACK){
        console.log('preparing to attack')
        
        if (u != EMPTY){
          var target = game.monsters[u];
          if (target.player != player){
      
            attack(player, target);
            
          } else if (target.player == player){
            socket.emit('Cannot attack ally unit');
           
          }
        } 

      } else if (player.actionstate == PLAYER_STATE_SPELL_LOC){
        console.log('action state spell')
        var event = {trigger: game.monsters[player.unitSelected], location: loc};
          var alert = player.spell.onEffect(event);
          if (alert != ""){
            socket.emit('alert', alert);
          } else {
            alertGlobal(game, event.trigger.name +  " cast " + player.spell.name) 
            clear(player);
           
           }
			} else if (player.actionstate == PLAYER_STATE_SPELL_TARGET){
        var event = {effect:player.spell, trigger: game.monsters[player.unitSelected], target: game.monsters[u]};
        var alert = player.spell.onEffect(event);
        if (alert != ""){
            socket.emit('alert', alert);
        } else {
          alertGlobal(game, event.trigger.name +  " cast " + player.spell.name) 
          clear(player)
          
        }

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

    socket.on('guard response', function(data){
      var game = games[socket.id];
      if (data == 1){
        
        if (!game.combat) {
          console.log("Attempting to respond to null guard  event")
          return
        }
        game.combat.target.player.pool.update(CREST_DEFENSE,-1);
        game.combat.defmodifier = game.combat.target.def;
      }  
      //} else if (data == 0)
      game.combat.unit.postattack(game.combat.target);
    })

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

    socket.on('cast', function(data){
      var player = getCurrentPlayer(socket.id);
      if (player.state == GAME_STATE_SELECT){
        console.log("cast " + data);
        var spellcode;   
        switch (data){
          case 'q':
            spellcode = 0;
            break;
          case 'w':
            spellcode = 1;
            break;
          case 'e':
            spellcode = 2;
            break;
          default:
            spellcode = -1;
        }
        var spell = game.monsters[player.unitSelected].spells[spellcode]
        if (player.pool.get(spell.cost[0]) < spell.cost[1]){
          //console.log('not enough crest1');
          //+ CREST_TEXT(spell.cost[0])
          socket.emit('alert', "Not enough " + CREST_TEXT[spell.cost[0]] )

        } else {

           player.spell = spell;
           if (spell.target == 'location'){
            player.actionstate = PLAYER_STATE_SPELL_LOC;
          } else if (spell.target == 'enemy' || spell.target == 'ally') {
            player.actionstate = PLAYER_STATE_SPELL_TARGET;
          } else {
            console.log("No target property for " + spell.name)
          }
           
        }
       
      }
    })

    socket.on('action', function(data){
	  	var game = games[socket.id];
	  	var player = getCurrentPlayer(socket.id);
      if (player.state != GAME_STATE_SELECT){
				console.log('Error: Attempting to execute action when unit is not selected');
				return;	
			}
      switch (data){
        case 'move':
          player.actionstate = PLAYER_STATE_MOVE;
          break;
        case 'attack':
          player.actionstate = PLAYER_STATE_ATTACK;
          break;
        case 'ability':
          player.actionstate = PLAYER_STATE_SPELL_TARGET;
          break;
        case 'cancel':
          player.actionstate = PLAYER_STATE_NEUTRAL;
          player.state = GAME_STATE_SELECT;
          break
        default:
          player.actionstate = PLAYER_STATE_NEUTRAL;
      }
      console.log("player state changed to: " + player.actionstate)
	  update(game)
    })

    socket.on('mouse click', function (){
      var game = games[socket.id]
      var player = getCurrentPlayer(socket.id)
      if (!game.isPlaying(player)) return
      if (player.state == GAME_STATE_SUMMON){
        //console.log("tile place")
        c_tilesplace();
      } else if (player.state == GAME_STATE_SELECT){
          c_actionunit(game, player);    
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

      var result = p1.onRoll(data)
      if( p1.summon != 0 ) {
        sockets[this.id].emit('alert', "Dice Dimension Phase")
        p1.state = GAME_STATE_SUMMON;
      } else {
        p1.state = GAME_STATE_UNIT;
         sockets[this.id].emit('alert', "Action Phase")

      }

      //var names = []
      //for (var i=0; i<p1.summon.length; i++){
      //  names.push(p1.summon[i].type)
      //} 
      
      //p1.rolled = true;
      socket.emit('s_roll', result)
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
