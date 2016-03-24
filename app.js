var util = require("./public/js/constants.js")
var express = require('express');
var app = express();
var http = require('http')

var port = process.env.PORT || 3000
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res){
	res.sendfile('index.html');
});

var server = http.createServer(app)
server.listen(port)
var WebSocketServer = require("ws").Server
var wss = new WebSocketServer({server: server})

var playersockets = []
var sockets = []
var gamesinprogress = [];
var opengames = []
var games = []

var DEBUG = 0;

function send(id, data){
	if (DEBUG){
		sockets[id].send(JSON.stringify(data))
	}
}

function sendAll(game,data){
	send(game.players[0].id, data)
	send(game.players[1].id, data)
}

function Game(){
	this.players = []
	this.turn = 0;
	this.board;
	//this.currentPlayer;
	this.monsters =[];
	this.combat = null;
	this.props = [];
	//this.chain = [];

	//this.timeout = false;

	this.init = function (player){
		//main();
		this.board = new Board();
		//PLAYER_ID.beginTurn();
		this.players.push(player);

		player.num = this.players.indexOf(player);
		games[player.id] = this;

		if (this.players.length < 2) return;
		sendAll(this, {id:'new game', data:this})
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

	this.setUnitAtLoc = function(unit, point){
		this.board.units[point[1]][point[0]] = unit;
		if (unit != util.EMPTY){
			this.monsters[unit].x = point[0]
			this.monsters[unit].y = point[1]
		}
		console.log('setting', unit,'to',point)

		this.update('unit location', util.EMPTY, {unit:unit, loc:point})
	}

	this.createUnit = function (player, id, point){

			if (!id) return;
			//console.log('id :',id)
			//var game = games[player.id]
			//console.log('creating unit',id,point)
			var u = new Unit(player, id, point);
			this.monsters.push(u);
			u.id = this.monsters.length-1;
			//this.board.units[point[1]][point[0]] = u.id;

			this.update('create unit', player.num, u)
			this.setUnitAtLoc(u.id, point)
			return u
		//var unit2 = new unit(id1, 2, 2, util.PLAYER_2);
		}

	this.update = function(type, playernum, data){
		sendAll(this, {num: playernum, id:'update', type:type, data:data})
	}
	return this;
}

//var util.EMPTY = -1;
//var util.PLAYER_1 = 0;
//var util.PLAYER_2 = 1;

function Board(){
	this.tiles = [];
	this.units = [];
	this.boardSizeX = 13;
	this.boardSizeY = 19

	for (var i=0; i<this.boardSizeY;i++){
		this.tiles[i] = [];
		for (var j=0;j<this.boardSizeX; j++){
			this.tiles[i].push(util.EMPTY);
		}
	}

	for (var i=0; i<this.boardSizeY;i++){
		this.units[i] = [];
		for (var j=0;j<this.boardSizeX; j++){
			this.units[i].push(util.EMPTY);
		}
	}

	this.tiles[0][6] = util.PLAYER_2;
	this.tiles[18][6] = util.PLAYER_1;
	//this.tiles[0][6] = util.PLAYER_2;
	this.tiles[17][5] = util.PLAYER_1;
	this.tiles[17][4] = util.PLAYER_1;
	this.tiles[17][6] = util.PLAYER_1;

	this.getUnitAtLoc = function (x,y){
	//console.log("unit at " + x +" " + y);
		//console.log(this.units)
		if (!boundCursor(x,y)) return -1
		return this.units[y][x];
	}

	this.setTileState = function(point, state){
		this.tiles[point[1]][point[0]] = state;
	}

	this.validPlacement = function(player){
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
			//console.log('hello ',x,y,this.tiles[18][6],util.getTileState(this,x,y));
			if (!boundCursor(x,y) || util.getTileState(this,x,y) != util.EMPTY){
				return false;
			}
			//adjacent

			if (util.getTileState(this,x+1,y) == player.num ||
				util.getTileState(this,x-1,y) == player.num ||
				util.getTileState(this,x,y-1) == player.num ||
				util.getTileState(this,x,y+1) == player.num ){
				valid = true;
			}
		}

		return valid;
	}

		return this;
}

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


var UNIT_IDS = [];

UNIT_IDS[0] = {
	name: 'Teemo',
	hp: 30,
	atk: 10,
	def: 10,
}

UNIT_IDS[1] = {
	name: 'Soraka',
	hp: 20,
	atk: 10,
	def: 20,
}

UNIT_IDS[2] = {
	name: 'Poppy',
	hp: 40,
	atk: 10,
	def: 10,
}

UNIT_IDS[3]= {
	name: 'Garen',
	hp: 30,
	atk: 20,
	def: 40,
}


var Dice_Teemo = new Dice(UNIT_IDS[0],
				 [[CREST_SUMMON,1],
					[CREST_SUMMON,1],
					[CREST_SUMMON,1],
					[CREST_SUMMON,1],
					[CREST_SUMMON,1],
					[CREST_MOVEMENT,1]])

var Dice_Soraka = new Dice(UNIT_IDS[1],
					[[CREST_SUMMON,2],
					 [CREST_SUMMON,2],
					 [CREST_SUMMON,2],
					 [CREST_SUMMON,2],
					 [CREST_ATTACK,2],
					 [CREST_MAGIC,3]]);


var Dice_Poppy = new Dice(UNIT_IDS[2],
					[[CREST_SUMMON,3],
					 [CREST_SUMMON,3],
					 [CREST_SUMMON,3],
					 [CREST_MOVEMENT,2],
					 [CREST_TRAP,3],
					 [CREST_ATTACK,1]]);

var Dice_Garen = new Dice(UNIT_IDS[3],
					[[CREST_SUMMON,4],
					 [CREST_SUMMON,4],
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

function Spell(name, cost,target){
	this.name = name;
	this.cost = cost;
	this.id =  SpellID;
	this.cooldown = 1;
	this.target = target;
	this.onEffect = () => console.log(this.name+'onEffect not implemented')
	SpellID++;

	return this;
}


var UNIT_STATUS_STUNNED = 0;
var UNIT_STATUS_KNOCKED_UP = 1;
var UNIT_STATUS_SILENCED = 2

/*
EVENTS
onapply
oneffect
onfinish
onattack
ondefend
onmove
onturn

*/

function Buff(name, duration){
	this.name = name;
	this.duration = duration;
	this.durationcounter = duration;
	this.owner = null;
	this.callbacks = {}

	this.on = function(event, callback){
		this.callbacks[event] = callback;
	}

	this.fire = function(event){
		if (!this.callbacks.hasOwnProperty(event)){
			console.log(event, 'not implemented for', this.name)
			return;

		}
		var args = Array.prototype.slice.call( arguments );
		var topic = args.shift();
		this.callbacks[event].apply(undefined, args)
	}
	return this;
}

var BUFF_stun = new Buff("Stunned", 1);
var BUFF_silence = new Buff("Silenced", 1);
var BUFF_root = new Buff("Root", 1);
var BUFF_knock_up = new Buff("Knock Up", 1);

var SPELL_TEEMO1 = new Spell("Blinding Dart", [CREST_ATTACK, 2],true)
var SPELL_TEEMO2 = new Spell("Noxious Trap", [CREST_MAGIC, 2],true)


function ApplyBuff(caster, target, buff){
	for (var i = 0; i<target.buff.length; i++){
		if (target.buff[i].name == buff.name){
			target.buff.splice(i,1);
			break;
		}
	}
	target.buff.push(buff);
	buff.owner = caster.id;
	console.log(buff.name)
	games[target.player.id].update('buff unit',target.player.num, {target:target, buff:buff.name})
}

function DamageUnit(trigger, target, damage){
	//event

	if (!target.exist){
		console.log('Damaging a dead unit')
		return;
	}
	target.hp = target.hp - damage;
	var remove = false
	if (target.hp <= 0){
		console.log('deaded')
		target.destroy()
	}
	games[trigger.player.id].update('damage', util.EMPTY, {trigger:trigger.id, target:target.id, damage:damage})
	console.log(trigger.type.name,'hit', target.type.name, 'for',damage)
}


var BUFF_TEEMO1 = function(){
	var buff = new Buff("Blinding Dart", 1);
	buff.on('attack', function(event){
		//console.log(event)
		event.dmg = 0;
		event.status.push('miss')
		console.log('missed!')
	})
	return buff;
}()

function PROP_TEEMO2 (prop){
	prop.on('collision', function(event){
		DamageUnit(prop.unit,event.trigger, 40)
		BUFF_SLOW(event.trigger, 1)
		prop.destroy();
	})
}

function BUFF_SLOW(unit, movement){
	unit.impairment += movement;
	games[unit.player.id].update('impairment', util.EMPTY, {unit: unit.id, point:movement})
}

SPELL_TEEMO1.onEffect = function(event){

	var game = games[event.trigger.player.id]
	var id = game.board.getUnitAtLoc(event.location[0],event.location[1]);
	if (id == util.EMPTY) return "Must target unit";

	var target = game.monsters[game.board.getUnitAtLoc(event.location[0],event.location[1])]
	var buff = BUFF_TEEMO1
	ApplyBuff(event.trigger, target, buff)

	DamageUnit(event.trigger, target, 10);

	return "";
}

SPELL_TEEMO2.onEffect = function(event){
	var mushroom = new Prop("Toxic Mushroom", event.trigger.player, event.location, event.trigger);
	PROP_TEEMO2(mushroom);
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
	this.guarded = false;

	this.guard = function(){
			//socket = sockets[player.id];
			//game = games[player.id]
			//game.combat = new Combat(this, target);
			//var opponent = game.players[((player.num == 0) ? 1 : 0)]

			this.target.player.changeState(util.GAME_STATE_COMBAT)
			this.unit.player.changeState(util.GAME_STATE_COMBAT)
			send(target.player.id, {id:'guard'})
			//console.log("changing state to combat: " + opponent.num)
			//update(games[this.unit.player.id]);

			//socket.emit('guard trigger', );
	}

	this.postattack = function(){

		//game = games[this.player.id]
		//combat = game.combat;
		var dmg = this.atkmodifier - this.defmodifier;
		if (dmg < 0) {
			dmg = 0;
		}
		var event = {attacker: this.unit, target: this.target, dmg: dmg, status: [] }
		var status = []
		for (var i=0; i< this.unit.buff.length; i++){
			this.unit.buff[i].fire('attack',event);
		}
		console.log('status',event.status)

		var game = games[this.unit.player.id]
		game.combat = null
		if (event.status.indexOf('miss') != -1){
			console.log('mised!')
			game.update('miss', util.EMPTY, {trigger:this.unit.id, target:this.target.id})
		} else {
			console.log('damage!', event.status)
			//DamageUnit(this.unit, this.target, dmg)
			console.log(this.unit.name+'('+this.unit.hp+')'+'attacking', this.target.name+'('+this.target.hp+')', 'for',this.atkmodifier+"(-"+this.defmodifier+")")
			this.target.hp = this.target.hp - dmg;
			if (this.target.hp <= 0){
				this.target.destroy()
			}

			console.log("after attack " +this.target.hp)
			game.update('attack', util.EMPTY, {trigger:this.unit.id, target:this.target.id, damage:dmg, guard: this.guarded, status:event.status})
			//sendAll(games[trigger.player.id], {id:'damage', trigger:trigger.id, target:target.id, remove: remove})

			//updateCrest();
		}
		this.unit.player.updatePool(CREST_ATTACK, -this.unit.atkcost);
		this.unit.player.changeState(util.GAME_STATE_UNIT)
		this.target.player.changeState(util.GAME_STATE_NEUTRAL);
		//update(game);
	}
	return this;
}

function Prop(name, player, point,unit) {
	this.id = 0
	this.x = point[0];
	this.y = point[1];
	this.player = player;
	this.name = name;
	this.unit = unit ? unit : util.EMPTY;
	this.clear = false;

	this.callbacks = {}

	this.on = function(event, callback){
		this.callbacks[event] = callback;
	}

	this.fire = function(event){
		if (!this.callbacks.hasOwnProperty(event)){
			console.log(event, 'not implemented', this.name)
			return;
		}
		var args = Array.prototype.slice.call( arguments );
		var topic = args.shift();
		this.callbacks[event].apply(undefined, args)
	}

	this.id = games[this.player.id].props.length;
	games[player.id].props.push(this)


	games[player.id].update('prop', util.EMPTY, this)

	this.destroy = function(){
		games[this.player.id].props.splice(games[this.player.id].props.indexOf(this),1)
		games[this.player.id].update('destroy prop', util.EMPTY, this)
		//this.exist = false;
	}

	return this;
}

function Unit(player, type, point, level) {
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
	this.exist = true;
	this.impairment = 0;
	this.spells = [SPELL_TEEMO1, SPELL_TEEMO2];

	//this.game = game;


	this.attack = function(target){

		var d = util.manhattanDistance(this, target);

		if (!target.exist){
			console.log("Target is dead")
			return false;
		}

		if (util.getCrestPool(this.player, CREST_ATTACK) < this.atkcost){
			console.log("Not enough attack crest")
			return false;
		}

		if (d > this.atkrange){
			this.player.alert('Out of range')
			console.log("Out of range")

			//var socket = sockets[this.player.id]
			//socket.emit('alert', "Out of range");
			return false
		}
		if (this.hasAttacked) {
			console.log("Already attack")
			this.player.alert('Already attacked')

			//var socket = sockets[this.player.id]
			//socket.emit('alert', "Already attacked");
			return false
		}
		game = games[this.player.id]


		if (this.player.id == target.player.id) {
			console.log("Cannot attack allies")
			this.player.alert("Cannot attack allies")

			//var socket = sockets[this.player.id]
			//socket.emit('alert', "Already attacked");
			return false
		}
		game.combat = new Combat(this, target);
		sendAll(game, {id:'combat', data:game.combat})
		console.log('attack')
		if (util.getCrestPool(target.player,CREST_DEFENSE) > 0){
			console.log('guard')
			game.combat.guard();
		} else {
			console.log('post attack')
			game.combat.postattack();
		}

		return true;
	}

	this.destroy = function(){
		console.log('Removing', this.name, this.id)
		var game = games[this.player.id]

		game.setUnitAtLoc(util.EMPTY, [this.x,this.y])

		console.log('destroy',[this.x,this.y],util.getTileState(game.board,this.x,this.y))
		this.exist = false;
		//game.monsters[this.id] = null
		game.update('destroy unit', util.EMPTY, {unit:this, loc:[this.x,this.y]})
	}



	this.moveUnit = function(loc){
			console.log('exist is ', this.exist)
			if (!this.exist){
				console.log('Moving a dead unit')
				return;
			}
			//var game = games[this.player.id]
			var board = game.board
			var path = util.findPath(board,[this.x,this.y],loc);
			var plen = path.length;
			//console.log(plen-1,'<=',this.impairment + util.getCrestPool(this.player,util.CREST_MOVEMENT))
			if (plen > 1 && plen-1 <= util.getCrestPool(this.player,util.CREST_MOVEMENT) - this.impairment) {
				game.setUnitAtLoc(util.EMPTY,[this.x, this.y])
				this.x = loc[0];
				this.y = loc[1];
				game.setUnitAtLoc(this.id,loc)

				this.player.updatePool(CREST_MOVEMENT,-(plen-1))
				this.player.changeState(util.GAME_STATE_UNIT)

				var event = {trigger: this, location: loc}
				for (var i=0; i<path.length; i++){
						for (var j=0; j<game.props.length; j++){
							if (game.props[j] && game.props[j].x == path[i][0] && game.props[j].y == path[i][1]){
								game.props[j].fire('collision',event);
							}
						}

				}
				return true;
			} else {

				console.log('Illegal move',plen)
			}
			return false;
	}



}

var allplayers = [];



// player state


var playerid = 0;
var PLAYER_ID


//player1 = new Player();
//player2 = new Player();
//currentPlayer = player1;

//PLAYER_ID = player1;

var rotateShape = function(shape,rotate){
	shape = util.shapes[shape];
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
	if (x>= util.boardSizeX || y >= util.boardSizeY ||x < 0 || y < 0){
			return false
		}
		return true;
}



var isUnitOnCursor = function(x, y){
	return boundCursor(x,y) && getUnitAtLocation([x,y]) != util.EMPTY
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

/*
function manhattanDistance(point, goal){
	return Math.abs(point.x - goal.x) + Math.abs(point.y- goal.y);
}
*/

function Player(id){

	this.id = id;
	this.num;
	this.pool = [5,5,5,5,5]

	this.state = util.GAME_STATE_END;
	this.actionstate = util.PLAYER_STATE_NEUTRAL;
	this.summon = [];
	this.summonlevel = 0;
	this.summonchoice = util.EMPTY;

	this.shape = 0;
	this.rotate = 0;

	this.cursorX;
	this.cursorY;

	this.tileSelected = []
	this.unitSelected = util.EMPTY;
	this.movePath = []
	this.rolled = false;

	this.valid = false;
	this.dices = [Dice_Teemo, Dice_Teemo, Dice_Teemo, Dice_Teemo, Dice_Teemo,
								Dice_Soraka, Dice_Soraka,Dice_Soraka, Dice_Soraka, Dice_Soraka,
								Dice_Poppy,Dice_Garen,Dice_Poppy,Dice_Garen,Dice_Garen,];


	this.spell = util.EMPTY;

	this.updatePool = function(crest, point){
		this.pool[crest] += point;
		//console.log('update pool')
		games[this.id].update('pool', this.num, {crest:crest, point:point})
	}

	this.changeState = function(state){
		var game = games[this.id]
		//console.log('change state')
		//console.log(game.combat)
		this.state = state;
		this.unitSelected = util.EMPTY;
		this.movePath = []
		this.tileSelected = []
		if (state == util.GAME_STATE_END){

			this.rolled = false;
			this.summon = [];
			this.summonlevel = 0;
			this.shape = 0;
			this.rotate = 0;
			this.valid = false;
			this.spell = util.EMPTY
			this.actionstate = util.PLAYER_STATE_NEUTRAL;

			for (var i=0; i<game.monsters.length;i++){
				if (!game.monsters[i].exist) continue;
				if (game.monsters[i].player.num == this.num){
					game.monsters[i].hasAttacked = false;
					game.monsters[i].canAttacked = true;
				}
			}

			var p = games[this.id].props
			for (var i=0; i< p.length; i++){
				if (p[i].clear){
				p.splice(i,1)
				}
			}

			//game.players[((this.num == 0) ? 1 : 0)].changeState(util.GAME_STATE_ROLL);
			game.players[((this.num == 0) ? 1 : 0)].changeState(util.GAME_STATE_UNIT);
		}
		game.update('change state', this.num, state)

	}

	this.changeActionState = function(state){
		this.actionstate = state;
	}

	this.endTurn = function (game){
		sockets[this.id].send(JSON.stringify({data:'alert', data:"End Phase"}));
		game.turn++;
		this.changeState(util.GAME_STATE_END);
	}

	this.onRoll = function(data){

		var summonlevel = 0;
		var summon = [[],[],[],[],[]];
		var result = [];
		//var dicechoice= [];

		for (var i=0;i<data.length; i++){
			var dices = this.dices[data[i]]
			var r = dices.roll();
			//result.push(r)


			if (r[0] != CREST_SUMMON){
				//console.log(this.pool);
				this.updatePool(r[0],r[1])
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
			result = summon[summonlevel]
			//console.log('hello',this.summon)
			//this.summonlevel = summonlevel
		}
		return result;
	}

	this.alert = function(data){
		send(this.id, {id:'alert', data:data})
	}

	this.selectUnit = function(x,y){
		var game = games[this.id]
		var m = util.getUnitAtLocation(game.board,x,y)
		if (this.unitSelected == m) {
			this.changeState(util.GAME_STATE_UNIT);

		} else if (game.monsters[m].player.id==this.id){
			this.changeState(util.GAME_STATE_SELECT);
			this.unitSelected = m;
			conn.send({id:'select unit', unit:m})
			//game.update('select unit', this.num, m)
			//send(this.id, {num: this.num, id:'update', type:'select unit', data:m})
			//send(this.id, {num: this.num, id:'update', type:'select unit', data:m})
			return true
		}
		return false;
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
		//console.log('TODO: broadcast');
		if ((!sockets[p1.id] || !sockets[p2.id])) return;
		if ((!sockets[p1.id].readyState || !sockets[p2.id].readyState)) {
			console.log('Ooops something went wrong with the socket.')
			return;
		}


		//==
		console.log('update')
		sockets[p1.id].send(JSON.stringify({id:'updategame', data:game}))
		sockets[p2.id].send(JSON.stringify({id:'updategame', data:game}))

}

function alertGlobal(game, alert){
		var p1 = game.players[0];
		var p2 = game.players[1];
		if (!p1 || !p2){
			return;
		}
		//console.log(p1.id)
		//console.log(p2.id)
		send(p1.id,{id:'alert', data:alert})
		send(p2.id,{id:'alert', data:alert})
}

function alertPlayer(alert){
		var p1 = game.players[0];
		var p2 = game.players[1];
		send(p1.id,{id:'alert', data:alert})
}

function test(){
	console.log('Running tests')
	var game = new Game()
	var p1 = new Player('one')
	var p2 = new Player('two')

	game.init(p1)
	game.init(p2)

	p1.updatePool(CREST_MOVEMENT, 2)
	console.assert(util.getCrestPool(p1, util.CREST_MOVEMENT) == 5+2, "update pool")
	//console.log(p1.pool[CREST_MOVEMENT])

	//units

	var u1 = game.createUnit(p1, UNIT_IDS[0], [4,16]) //teemo
	var u2 = game.createUnit(p2, UNIT_IDS[1], [5,16]) // soraka
	console.assert(game.monsters.length ==2,"units added to monsters")
	console.assert(u1.x == 4,"x position unit")
	console.assert(u2.y == 16,"y position unit")
	u1.attack(u2)
	console.assert(p1.state == util.GAME_STATE_COMBAT,"p1 combat state")
	console.assert(p2.state == util.GAME_STATE_COMBAT,"p2 response state")

	game.combat.postattack()
	console.assert(u2.hp==10,"attack modifier")
	console.assert(game.combat == null,"combat class cleared")
	console.assert(u1.attack(u1) == false,"attack allies")
	game.board.setTileState([4,15],1)
	console.assert(util.getTileState(game.board,4,15) == 1, "board state tile")

	var m = u1.moveUnit([4,15])
	console.assert(m == true, "move unit valid move")
	console.assert(p1.state == util.GAME_STATE_UNIT, "move unit state")

	console.assert(util.getCrestPool(p1, util.CREST_MOVEMENT) == 6, "move unit crest is " + util.getCrestPool(p1, util.CREST_MOVEMENT) +"!=6")
	console.assert(u1.x == 4 & u1.y == 15, "move unit location is "+ u1.x, u1.y + "!= [5,16]")
	console.assert(p1.unitSelected == -1, "empty")
	p1.selectUnit(4,15)

	console.assert(p1.unitSelected == u1.id, "select unit ",u1.id, p1.unitSelected)
	console.assert(p1.selectUnit(4,15)== false, "deselect unit")
	game.board.setTileState([6,16],1)
	var p = new Prop("Toxicc Mushroom", p1, [6,16],u1);
	PROP_TEEMO2(p)
	console.assert(game.props.length == 1)
	console.assert(game.props[0].name == "Toxicc Mushroom")
	var m = u2.moveUnit([6,16])
	console.assert(game.props.length == 0)
	console.assert(m == true)
	console.assert(u2.exist == false)
	console.log(u2.id,u2.x, u2.y, u2.exist)

	console.assert(game.board.getUnitAtLoc(6,16) == util.EMPTY)

	//u1.destroy()
	//console.assert(game.monsters.length == 1)

	DEBUG = 1;
	console.log('Tests passed!')
}


test()

wss.on('connection', function(socket){
		console.log('a user connected');

		//socket.emit('new player id', socket.id)

		var id = socket.upgradeReq.headers['sec-websocket-key'];
		socket.send(JSON.stringify({id: 'id', data: id}))
		sockets[id]=socket;

		var p1 = new Player(id);
		playersockets.push(p1);
		//console.log(playersockets);

		//sockets[socket.id] = socket;

		var game = opengames.pop();
		console.log(opengames.length)
		if (!game){
			game = new Game();
			opengames.push(game);
			game.init(p1);
			console.log("created new game")
		} else {
			console.log("joined new game")

			game.init(p1);

			var t = game.createUnit(game.players[0], UNIT_IDS[2], [4,16])
			var r = game.createUnit(game.players[1], UNIT_IDS[3], [5,16])
			//var p = new Prop('test prop', p1, [4,16])
			//new Prop("Toxic Mushroom", p1, temp);

			var buff = BUFF_TEEMO1
			//ApplyBuff(t, t, buff)
			//ApplyBuff(r, r, buff)

			game.players[0].changeState(util.GAME_STATE_UNIT)
			console.log(game.players[0].id)
			console.log("connecting with...");
			console.log(p1.id)


		}

		var reselection = function (target){
			var board = game.board
				if (target.id == p1.unitSelected){
					console.log("deselect");
					p1.changeState(util.GAME_STATE_UNIT)
				} else if (target.player.id == p1.id) {
					console.log("reselect");
					p1.unitSelected = target.id;
					p1.movePath = util.findPossiblePath(game.board,[p1.cursorX, p1.cursorY],p1.pool.get(CREST_MOVEMENT))
					//console.log(p1.movePath)
				}
		}



		var c_castunit = function(x,y){
			if (p1.actionstate == util.PLAYER_STATE_SPELL_TARGET){
				console.log('target')
				//if (u == util.EMPTY) return;
				var event = {trigger: game.monsters[p1.unitSelected], location: loc};
				//console.log(p1.spell)
				var alert = spell.onEffect(event);
				if (alert != ""){
						socket.send(JSON.stringify({id:'alert', data:alert}));
				} else {
					alertGlobal(game, event.trigger.name +  " cast " + p1.spell.name)
					p1.changeState(util.GAME_STATE_UNIT)

				}

			}
		}

		socket.onmessage = function(msg){

			try {
				var parsemsg = JSON.parse(msg.data)
			} catch (e){
				console.log("invalid json")
			}
			//var g = Games[id]
			//var id = data.id;
			var data = parsemsg.data;
			var eventid  = parsemsg.id
			//console.log('event is ',eventid )
			if (!game.isPlaying(p1) && eventid != 'guard response') return

			if (eventid == 'c_roll'){
				//var game = games[socket.id]
			//var p1 = getCurrentPlayer(socket.id)
				//console.log('current player turn ' + p1.num + ' game turn:' + game.turn%2 + " "+ id)


				//var gain = p1.pool.pool.slice();
				//console.log('not playing')

				if (data.length != 3) return;
						//console.log('<3 dices sent')

				var result = p1.onRoll(data)
				//console.log('results are')
				//console.log(result)
				//console.log(p1.summon)
				game.update('roll',p1.num, {data:result})


				if( p1.summon != 0 ) {
					p1.changeState(util.GAME_STATE_SUMMON);
				} else {
					p1.changeState(util.GAME_STATE_UNIT)
				}

				//update(game)

			}


			if (eventid == 'c_summonoption'){
				//var game = games[socket.id]
				//var p1 = getCurrentPlayer(socket.id)
				console.log("summon dice choice:" +data)

				p1.summonchoice = data;

				p1.tileSelected = []
				var cshape = rotateShape(p1.shape,p1.rotate);
				for (var i=0; i<cshape.length; i++){
					p1.tileSelected.push([cshape[i][0]+p1.cursorX, cshape[i][1]+p1.cursorY])
				}
				//update(game)

			}

			var c_attackunit = function(x,y){

				if (p1.unitSelected == util.EMPTY) return false
				var m = game.monsters[p1.unitSelected]
				var u = game.board.getUnitAtLoc(x, y);
				if(u == util.EMPTY) return false
				var target = game.monsters[u];
				m.attack(target);

				return true
			}

			var c_tilemove = function (){
				p1.tileSelected = [];
				var cshape = rotateShape(p1.shape,p1.rotate);
				for (var i=0; i<cshape.length; i++){
					p1.tileSelected.push([cshape[i][0]+p1.cursorX, cshape[i][1]+p1.cursorY])
				}
				p1.valid = game.board.validPlacement(p1)

				game.update('tile', p1.num , {shape: p1.tileSelected, valid:p1.valid})
				//sockets[].send(JSON.stringify({id:'update', type:'tile', p1.tileSelected}))
				//console.log(p1.tileSelected)
			}


			if (eventid == 'mouse move') {
				p1.cursorX = data.X*1;
				p1.cursorY = data.Y*1;
				//console.log('playrerx',p1.cursorX)

				if (p1.tileSelected.length > 0){
					c_tilemove()
				} else if (p1.state == util.GAME_STATE_SELECT){

				}

			}


			var c_tilesplace = function (x,y){

				if (game.makeSelection(p1)){
					game.createUnit(p1,p1.dices[p1.summonchoice].type,[x,y])
					p1.dices[p1.summonchoice] = null;
					game.update('make selection', p1.num, {dice:p1.summonchoice, shape:p1.tileSelected})
					p1.changeState(util.GAME_STATE_UNIT);
					//socket.send(JSON.stringify({data:'alert', data:"Action Phase"}));
					//update(game);
				}
			}


			if (eventid == 'tile place'){
				c_tilesplace(data.loc[0],data.loc[1])
			}

			if(eventid == 'mouse click'){
				//var game = games[socket.id]
				//var player = getCurrentPlayer(socket.id)
				//if (!game.isPlaying(player)) return
				//if (p1.state == util.GAME_STATE_SUMMON){
					//console.log("tile place")
				//  ;
				//} else if (p1.state == util.GAME_STATE_SELECT){
				if (data.state == 'move'){
						console.log('moving')
					if (util.getTileState(game.board, data.loc[0], data.loc[1]) != util.EMPTY){
						if (!game.monsters[p1.unitSelected].moveUnit(data.loc)){
							console.log("invalid move");
						}
					}
				} else if (data.state == 'select'){
					p1.selectUnit(data.loc[0], data.loc[1])
				} else if (data.state == 'attack'){
					if (!c_attackunit(data.loc[0], data.loc[1])){
						console.log('attack failed')
					}
				} else if (data.state == 'cast'){
					console.log('casting spell!')
					var spell = game.monsters[p1.unitSelected].spells[data.button]
					console.log(spell.cost[0])
					if (p1.pool[spell.cost[0]] < spell.cost[1]){
						socket.send(JSON.stringify({data:'alert', data:"Not enough"+CREST_TEXT[spell.cost[0]]+' to cast'+ spell.name}));
					} else {

						//console.log('self')
						var event = {trigger: game.monsters[p1.unitSelected], location: data.loc};
						//console.log(spell)
						var alert = spell.onEffect(event);

						if (alert != ""){
							//socket.send(JSON.stringify({id:'alert', data:alert}));
							console.log('spell cast error!')
						} else {
							console.log('spell cast went through')
							p1.changeState(util.GAME_STATE_UNIT)
						}

					}


				}
					//console.log("select")
						//c_actionunit();
				//} else if (p1.state == util.GAME_STATE_UNIT){





			}

			if (eventid == 'change shape'){
				if (p1.state != util.GAME_STATE_SUMMON) return;
				p1.shape++;
				if (p1.shape == util.shapes.length){
					p1.shape = 0;
				}
				c_tilemove()

			}
			if (eventid == 'rotate shape'){
				if (p1.state != util.GAME_STATE_SUMMON) return;
				p1.rotate = (p1.rotate +1)%4;
				c_tilemove()
			}


			if(eventid == 'end turn'){
				p1.endTurn(game);
			};

			if (eventid == 'cast'){
				if (p1.state == util.GAME_STATE_SELECT){
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
					var spell = game.monsters[p1.unitSelected].spells[spellcode]
					if (p1.pool[spell.cost[0]] < spell.cost[1]){
						socket.send(JSON.stringify({data:'alert', data:"Not enough " + CREST_TEXT[spell.cost[0]]}));
					} else {
						p1.spell = spell;
						if (spell.target){
							p1.actionstate = util.PLAYER_STATE_SPELL_TARGET
						} else {
							console.log('self')
							var event = {trigger: game.monsters[p1.unitSelected], location: loc};
							var alert = p1.spell.onEffect(event);
							if (alert != ""){
								socket.send(JSON.stringify({id:'alert', data:alert}));
							} else {
								alertGlobal(game, event.trigger.name +  " cast " + p1.spell.name)
								p1.changeState(util.GAME_STATE_UNIT)
							}

						}
					}


				}
			}

			if(eventid == 'guard response'){
				//var game = games[socket.id];
				console.log('response to guard')
				if (!game.combat){
					console.log("Attempting to respond to null guard  event")
					return
				}
				if (game.combat.target.player.num != p1.num) return;
				if (data == 1){

					game.combat.target.player.updatePool(CREST_DEFENSE,-1);
					game.combat.defmodifier = game.combat.target.def;
					game.combat.guarded = true;
				}
				//} else if (data == 0)
				game.combat.postattack();
			}


		}

		socket.on('close', function(){
			console.log('Player',p1.num,'has disconnected');
			//games[id].players.splice(p1.num,1)
			//console.log(games[id].players.length)
			//opengames.push(games[id]);
			//games[id] = null
		});
});

console.log('listening on http://localhost:3000');

var rotateShape = function(shape,rotate){
	shape = util.shapes[shape];
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
