1//var socket = io();
var peerjskey = '07h03d92my96yldi'
//peer = new Peer('one',{key: peerjskey});
var peer;
peer = new Peer ('one', {host:'localhost',port:9000, path: '/'})
var conn;

//var player1;
//var player2;
var player, opponent;
var playernum = 0;
var canvas = document.getElementById("games");
//var switchButton = document.getElementById("switch");
//var summonButton = document.getElementById("summon");

var rollButton = document.getElementById("roll");
var endturnButton = document.getElementById("endturn");
var yesButton = document.getElementById('yesguard');
var noButton = document.getElementById('noguard');

//var moveButton = document.getElementById('move');
//var attackButton = document.getElementById('attack');
//var abilityButton = document.getElementById('ability');
var cancelButton = document.getElementById('cancel');

var passiveButton = document.getElementById('passive');
var qButton = document.getElementById('q');
var wButton = document.getElementById('w');
var eButton = document.getElementById('e');
var rButton = document.getElementById('r');


var statPanel = document.getElementById("stat");
var crestPanel = document.getElementById("crest");
var dicePanel = document.getElementById("diceroll");
var playerPanel = document.getElementById("players")
var content = document.getElementById("content")

var actionState = util.PLAYER_STATE_NEUTRAL

//var movePath = []
//var movementButton = document.getElementById("movement")

var ctx = canvas.getContext("2d");
content.hidden = true;


var squareSize = 30;

var initUnit = 0;

//var util.boardSizeX = 13;
canvas.width = 580;
canvas.height =580;

var CREST_MOVEMENT = 0;
var CREST_ATTACK = 1;
var CREST_DEFENSE = 2;
var CREST_MAGIC = 3;
var CREST_TRAP = 4;
var CREST_SUMMON = 5;

var CREST_TEXT = ["MOVEMENT", "ATTACK","DEFENSE", "MAGIC", "TRAP", "SUMMON" ]




var UNITS = {};
var SPELLS = {};
var BUFFS = {}
var PROPS = {}

BUFFS['Relentless Pursuit'] = function(){
	var buff = new Buff("Relentless Pursuit", 0);
	buff.counter = 0;
	buff.on('attack', function(event){
		buff.counter++;
	})
	return buff
}


BUFFS['Ardent Blazer'] =  function(){
	var buff = new Buff("Ardent Blazer", 1);
	buff.on('attacked', function(event){
		//console.log(event)
		var m = game.monsters[buff.owner]
		if (m.player.num == event.attacker.player.num){
			m.player.updatePool(CREST_MOVEMENT, 1)
		}
	})
	return buff;
}


SPELLS['Lucian'] = []
SPELLS['Lucian'][0] = new Spell("Piercing Light", [CREST_ATTACK, 2],true)
SPELLS['Lucian'][0].on('effect', function(event){
	if (game.board.getUnitAtLoc(event.location[0],event.location[1]) == util.EMPTY) return "No unit targeted"

	if (event.location[0] == event.trigger.x || event.location[1] == event.trigger.y){
		//var path = util.findPath(game.board,[event.trigger.x,event.trigger.y],event.location);
		var dx = (event.location[0] - event.trigger.x)
		var dy = (event.location[1] - event.trigger.y)
		if (dx < 0) dx = -1;
		if (dx > 0) dx = 1;
		if (dy < 0) dy = -1;
		if (dy > 0) dy = 1;

		console.log(dx,dy)
		var path = [];
		for (var i = 1; i<4; i++){
			path.push([event.trigger.x+dx*i,event.trigger.y+dy*i])
		}
		console.log(path)
		for (var i=0; i<path.length; i++){
			console.log(path[i])
			var m = game.board.getUnitAtLoc(path[i][0],path[i][1])
			if (m != util.EMPTY){
				DamageUnit(event.trigger.id, m, 20)
				ApplyBuff(event.trigger, game.monsters[m],BUFFS['Ardent Blazer']() )
			}
		}

		SPELLS['Lucian'][0].fire('finish', {})

	}

})

SPELLS['Lucian'][1] = new Spell("Ardent Cenzer", [CREST_MAGIC, 2],true)
SPELLS['Lucian'][1].on('effect',function(event){
	if (game.board.getUnitAtLoc(event.location[0],event.location[1]) == util.EMPTY) return "No unit targeted"
	if (event.location[0] == event.trigger.x || event.location[1] == event.trigger.y){
		//var path = util.findPath(game.board,[event.trigger.x,event.trigger.y],event.location);
		var dx = (event.location[0] - event.trigger.x)
		var dy = (event.location[1] - event.trigger.y)
		if (dx < 0) dx = -1;
		if (dx > 0) dx = 1;
		if (dy < 0) dy = -1;
		if (dy > 0) dy = 1;

		//console.log(dx,dy)
		var path = [];
		for (var i = 1; i<3; i++){
			path.push([event.trigger.x+dx*i,event.trigger.y+dy*i])
		}
		//console.log(path)
		for (var i=0; i<path.length; i++){
			console.log(path[i])
			var m = game.board.getUnitAtLoc(path[i][0],path[i][1])
			if (m != util.EMPTY){
				DamageUnit(event.trigger.id, m, 10)
				ApplyBuff(event.trigger, game.monsters[m],BUFFS['Ardent Blazer']() )
				break;
			}
		}
	SPELLS['Lucian'][1].fire('finish', {})
	}
})
SPELLS['Lucian'][2] = new Spell("Relentless Pursuit", [CREST_MOVEMENT, 2],true)
SPELLS['Lucian'][2].on('learn', function(event){
	console.log('learnt relentless')
	//console.log(event)
	ApplyBuff(event.trigger, 	event.trigger, BUFFS['Relentless Pursuit']())

})

SPELLS['Lucian'][2].on('cast', function(event){
	console.log('casting relentless puruist')
	if (player.pool[SPELLS['Lucian'][2].cost[0]] < SPELLS['Lucian'][2].cost[1]){
		console.log('Not enough', CREST_TEXT[SPELLS['Lucian'][2].cost[0]], 'to cast', SPELLS['Lucian'][2].name)
		player.spell = -1;
		return;
	}
	var buff = util.EMPTY;
	for (var i=0; i< event.trigger.buff.length; i++){
		if (event.trigger.buff[i].name == 'Relentless Pursuit'){
			buff = event.trigger.buff[i];
			break;
		}
	}
	player.movePath = []
	var x = event.trigger.x;
	var y = event.trigger.y
	//console.log(x,y)
	player.movePath = player.movePath.concat(findStraightPath([x,y],[x+buff.counter+1,y]))
	player.movePath = player.movePath.concat(findStraightPath([x,y],[x-(buff.counter+1),y]))
	player.movePath = player.movePath.concat(findStraightPath([x,y],[x,y-(buff.counter+1)]))
	player.movePath = player.movePath.concat(findStraightPath([x,y],[x,y+buff.counter+1]))
	console.log(player.movePath)
	//player.movePath.concat()

	//findStraightPath([x,y],[x,y+3]),  findStraightPath([x,y],[x,y-3])

})



SPELLS['Lucian'][2].on('effect', function(event){
	if (game.board.getUnitAtLoc(event.location[0],event.location[1]) != util.EMPTY) {console.log('Location not empty'); return}
	var buff = util.EMPTY;
	for (var i=0; i< event.trigger.buff.length; i++){
		if (event.trigger.buff[i].name == 'Relentless Pursuit'){
			buff = event.trigger.buff[i];
			break;
		}
	}
	if (buff == util.EMPTY){console.log('Unit has not learnt Relentless Pursuit'); return}
	var path = findStraightPath([event.trigger.x,event.trigger.y],event.location)
	if (path.length> Math.min(buff.counter+1, 4)) return

	player.updatePool(CREST_MOVEMENT, -2)
	buff.counter = 0;
	console.log('casting relentless pursuit', event.location[0],event.trigger.x ,event.location[1] , event.trigger.y)
	if (!(event.location[0] == event.trigger.x || event.location[1] == event.trigger.y))  {console.log('Must target in a line'); return}

	var path = util.findPath(game.board,[event.trigger.x,event.trigger.y],event.location);
	console.log(path)
	event.trigger.movement(path)
	SPELLS['Lucian'][2].fire('finish', {})
})
SPELLS['Teemo'] = []

SPELLS['Teemo'][0] = new Spell("Blinding Dart", [CREST_ATTACK, 2],true)
SPELLS['Teemo'][1] = new Spell("Noxious Trap", [CREST_MAGIC, 2],true)

SPELLS['Teemo'][0].on('effect',function(event){

	//var game = games[event.trigger.player.id]
	var id = game.board.getUnitAtLoc(event.location[0],event.location[1]);
	if (id == util.EMPTY) return "Must target unit";

	var target = game.monsters[game.board.getUnitAtLoc(event.location[0],event.location[1])]
	var buff = BUFFS['Blinding Dart']()
	ApplyBuff(event.trigger, target, buff)

	DamageUnit(event.trigger.id, target.id, 10);
	SPELLS['Teemo'][0].fire('finish')
})

SPELLS['Teemo'][1].on('effect', function(event){
	//var mushroom = new Prop("Toxic Mushroom", event.trigger.player, event.location, event.trigger);
	//PROP_TEEMO2(mushroom);
	PROPS['Toxic Mushroom'](event.location, event.trigger)
	console.log('toxic mushroom!')
	//console.log(event)
	//var buff = new Buff("Blinding Dart", 1);
	//ApplyBuff(event.trigger, event.target, buff)
	//DamageUnit(event.trigger, event.target, 10);
	SPELLS['Teemo'][1].fire('finish')

})


UNITS['Teemo'] = {
	name: 'Teemo',
	hp: 30,
	atk: 10,
	def: 10,
	spells: SPELLS['Teemo']
}

UNITS['Soraka'] = {
	name: 'Soraka',
	hp: 20,
	atk: 10,
	def: 20,
	spells: [],
}

UNITS['Poppy'] = {
	name: 'Poppy',
	hp: 40,
	atk: 10,
	def: 10,
	spells: [],
}

UNITS['Garen'] = {
	name: 'Garen',
	hp: 30,
	atk: 20,
	def: 40,
		spells: []
}

UNITS['Lucian'] = {
	name: 'Lucian',
	hp: 20,
	atk: 30,
	def: 10,
	spells: SPELLS['Lucian'],
}

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



function Prop(name,point,unit) {
	this.id = 0
	console.log(point)
	this.x = point[0];
	this.y = point[1];
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

	this.destroy = function(){
		//games[this.player.id].props.splice(games[this.player.id].props.indexOf(this),1)
		//games[this.player.id].update('destroy prop', util.EMPTY, this)
		//this.exist = false;
		console.log('destroy')
	}

	this.id = game.props.length;
	game.props.push(this)
	if (player.num == game.turn%2){
		conn.send({id:'new prop', name:name, point:point,unit:unit.id})
	}

	return this;
}


var BUFF_stun = new Buff("Stunned", 1);
var BUFF_silence = new Buff("Silenced", 1);
var BUFF_root = new Buff("Root", 1);
var BUFF_knock_up = new Buff("Knock Up", 1);

BUFFS['Blinding Dart'] = function(){
	var buff = new Buff("Blinding Dart", 1);
	buff.on('attack', function(event){
		//console.log(event)
		event.dmg = 0;
		event.status.push('miss')
		console.log('missed!')
	})
	return buff;
}

PROPS['Toxic Mushroom'] = function (point, unit){
	var prop = new Prop("Toxic Mushroom", point,unit);
	prop.on('collision', function(event){
		DamageUnit(prop.unit.id,event.trigger.id, 40)
		BUFF_SLOW(event.trigger, 1)
		prop.destroy();
	})
	return prop;
}

function BUFF_SLOW(unit, movement){
	unit.impairment += movement;
	//games[unit.player.id].update('impairment', util.EMPTY, {unit: unit.id, point:movement})
}

function ApplyBuff (caster, target, buff){
	if (!caster) {console.log('caster null'); return}
	if (!target) {console.log('target null'); return}
	if (!buff) {console.log('buff null'); return}
	for (var i = 0; i<target.buff.length; i++){
		if (target.buff[i].name == buff.name){
			target.buff.splice(i,1);
			break;
		}
	}
	target.buff.push(buff);
	buff.owner = caster.id;
	if (game.turn%2 == player.num){
		conn.send({id:'apply buff', caster:caster.id, target:target.id, buff: buff.name})
	}
	//console.log(buff.name)
	//games[target.player.id].update('buff unit',target.player.num, {target:target, buff:buff.name})
}



function Spell(name, cost,target){
	this.name = name;
	this.cost = cost;

	this.cooldown = 1;
	this.target = target;
	this.onEffect = () => console.log(this.name+'onEffect not implemented')

	this.callbacks = {}

	this.on = function(event, callback){
		this.callbacks[event] = callback;
	}

	this.on('finish', function(event){
		player.changeState(util.GAME_STATE_UNIT)
	})

	this.fire = function(event){
		if (!this.callbacks.hasOwnProperty(event)){
			if (event != 'learn')
				console.log(event, 'not implemented for', this.name)
			return;

		}
		var args = Array.prototype.slice.call( arguments );
		var topic = args.shift();
		this.callbacks[event].apply(undefined, args)
	}

	this.buff;
	//SpellID++;

	return this;
}

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

function openConnection(c,num){
	conn = c;
	conn.on('open', function() {
		console.log('connected to', c.peer)

		game = new Game()

 		player = new Player(num==0 ? 'one' : 'two')
		player.num = num;
		opponent = new Player(num==0 ? 'one' : 'two')
		opponent.num = num == 0 ? 1 : 0
		game.players = [player,opponent]
		game.init()
		player.changeState(util.GAME_STATE_UNIT)
		if(player.num == 0){
					game.createUnit(player,UNITS['Lucian'],[5,17])
		}
		if(player.num == 1){
					game.createUnit(player,UNITS['Teemo'],[4,17])
		}
		//console.log(window.player)
	});

	conn.on('data', function(data) {
		if (data.id == 'move unit'){
			game.monsters[data.unit].moveUnit([data.x, data.y])
		} else if (data.id == 'select unit'){
			opponent.unitSelected = data.unit
		} else if (data.id == 'change state'){
			opponent.changeState(data.state)
		} else if (data.id == 'update pool'){
			opponent.updatePool(data.crest, data.point)
		} else if (data.id == 'update tile'){
			opponent.updateTile(data.shape)
		} else if (data.id == 'make selection'){
			game.makeSelection(opponent);
		} else if(data.id == 'create unit'){
			game.createUnit(opponent,UNITS[data.unitid],data.point)
			//conn.send({id:, player:player,id:id,point:point})
		} else if (data.id == 'guard'){
			game.combat = data.combat;
			console.log('block damage?')
			yesButton.hidden = false;
			noButton.hidden = false;
		} else if (data.id == 'guard response'){
			if (data.data == 1){
				game.combat.defmodifier = game.combat.target.def;
				game.combat.guarded = true;
			}
			game.combat.postattack()
		} else if (data.id == 'damage unit'){
			DamageUnit(data.trigger,data.target,data.damage)
		} else if (data.id == 'apply buff'){
			ApplyBuff(game.monsters[data.caster],game.monsters[data.target], BUFFS[data.buff]())
		} else if (data.id == 'new prop'){
			//console.log(PROPS[data.name])
			PROPS[data.name](data.point,game.monsters[data.unit]);
		}


	    console.log('Received', data);
	 });
	//setTimeout(function(){ conn.send('Hello!'); }, 3000);
  // Send messagess

}

peer.on('error',function(err){
	if (err.type == 'unavailable-id'){
		console.log('key already taken')
		peer = new Peer ('two', {host:'localhost',port:9000, path: '/'})
		peer.on('open', function(id) {
			console.log('Player 2 id is: ' + id);
			openConnection(peer.connect('one'),0)
		});


	}
})

peer.on('open', function(id){
	console.log('received id', id)
});

peer.on('connection', function(conn) {
	console.log('received connection')
	openConnection(conn,1)

 });


//var socket = new WebSocket(location.origin.replace(/^http/, 'ws'));
var socketid;

PLAYER_STATE_NEUTRAL = 0;
PLAYER_STATE_MOVE = 1;
PLAYER_STATE_ATTACK = 2;
PLAYER_STATE_SPELL_TARGET = 3;

GAME_STATE_TEXT = ['Roll', 'Summon', 'Unit', 'Combat', 'Select', 'End','Neutral']


function rotateShape(shape,rotate){
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

function DamageUnit(trig, targ, damage){
	if (targ == -1 || targ == null) {
		console.log('DamageUnit null target')
		return;
	}

	if (trig == -1 || trig == null) {
		console.log('DamageUnit null trigger')
		return;
	}

	var target = game.monsters[targ]
	var trigger = game.monsters[trig]
	if (!target.exist){
		console.log('Damaging a dead unit')
		return;
	}
	target.hp = target.hp - damage;
	//var remove = false

	//games[trigger.player.id].update('damage', util.EMPTY, {trigger:trigger.id, target:target.id, damage:damage})
	if (player.num == game.turn%2){
		conn.send({id:'damage unit', trigger:trig, target:targ, damage:damage,})
	}

	if (target.hp <= 0){
		//console.log('deaded')
		target.destroy()
	}

	console.log(trigger.type.name,'hit', target.type.name, 'for',damage)
}

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
			//console.log(unit.id, target.id)
			//this.target.player.changeState(util.GAME_STATE_COMBAT)
			//this.unit.player.changeState(util.GAME_STATE_COMBAT)
			conn.send({id:'guard', unit:unit.id, target:target.id})
			//send(target.player.id, {id:'guard'})
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

		for (var i=0; i< this.target.buff.length; i++){
			this.target.buff[i].fire('attacked', event)
		}

		console.log('status',event.status)
		conn.send({id:'combat resolution', status:status})
		//var game = games[this.unit.player.id]
		game.combat = null
		if (event.status.indexOf('miss') != -1){
			console.log('mised!')
			//game.update('miss', util.EMPTY, {trigger:this.unit.id, target:this.target.id})
		} else {
			console.log('damage!', event.status)
			//DamageUnit(this.unit, this.target, dmg)
			console.log(this.unit.name+'('+this.unit.hp+')'+'attacking', this.target.name+'('+this.target.hp+')', 'for',this.atkmodifier+"(-"+this.defmodifier+")")
			//this.target.hp = this.target.hp - dmg;
			//if (this.target.hp <= 0){
				//this.target.destroy()
			//}
			DamageUnit(this.unit.id,this.target.id,dmg)

			console.log("after attack " +this.target.hp)
			//game.update('attack', util.EMPTY, {trigger:this.unit.id, target:this.target.id, damage:dmg, guard: this.guarded, status:event.status})
			//sendAll(games[trigger.player.id], {id:'damage', trigger:trigger.id, target:target.id, remove: remove})

			//updateCrest();
		}

		this.unit.player.updatePool(CREST_ATTACK, -this.unit.atkcost);
		this.unit.player.changeState(util.GAME_STATE_UNIT)
		//this.target.player.changeState(util.GAME_STATE_NEUTRAL);
		//update(game);
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
	if (level) this.level = level;
	this.hasAttacked = false;
	this.canAttacked = true;
	this.atkcost = 1;
	this.atkrange = 1;
	this.buff = []
	this.exist = true;
	this.impairment = 0;
	this.spells = type.spells


	//console.log(type.spells)

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
		//game = games[this.player.id]


		if (this.player.num == target.player.num) {
			console.log("Cannot attack allies")
			this.player.alert("Cannot attack allies")

			//var socket = sockets[this.player.id]
			//socket.emit('alert', "Already attacked");
			return false
		}
		game.combat = new Combat(this, target);
		//sendAll(game, {id:'combat', data:game.combat})
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
		//var game = games[this.player.id]
		game.setUnitAtLoc(util.EMPTY, [this.x,this.y])
		//console.log('destroy',[this.x,this.y],util.getTileState(game.board,this.x,this.y))
		this.exist = false;
		//game.monsters[this.id] = null
		//game.update('destroy unit', util.EMPTY, {unit:this, loc:[this.x,this.y]})
	}

	this.moveUnit = function (loc){
		//var m = game.monsters[unit]
		game.setUnitAtLoc(util.EMPTY,[this.x, this.y])
		this.x = loc[0];
		this.y = loc[1];
		game.setUnitAtLoc(this.id,loc)

		var event = {trigger: this, location: loc}
		for (var j=0; j<game.props.length; j++){
			if (game.props[j] && game.props[j].x == loc[0] && game.props[j].y == loc[1]){
				game.props[j].fire('collision',event);
			}
		}

		if (window.player.num == game.turn%2){
				//console.log(player.num, game.turn%2)
				conn.send({id:'move unit', unit:this.id, x:this.x, y:this.y})
		}
	}

	this.movement = function(path){
			//console.log('exist is ', this.exist)
			//var m = game.monsters[this.id]
			if (!this.exist){
				console.log('Moving a dead unit')
				return;
			}
			//var game = games[this.player.id]
			//console.log(this.x, this.y, loc)
			var board = game.board
			//var path = util.findPath(board,[m.x,m.y],loc);
			var plen = path.length;

			//console.log(plen-1,'<=',this.impairment + util.getCrestPool(this.player,util.CREST_MOVEMENT))
			//console.log(util.getCrestPool(this.player,util.CREST_MOVEMENT))
			//if (plen > 1 && plen-1 <= this.getCrestPool(util.CREST_MOVEMENT) - m.impairment) {
			for (var i=0; i<path.length; i++){
				//console.log(path[i])
				this.moveUnit(path[i])
					//console.log('moved!')
			}
			//this.player.changeState(util.GAME_STATE_UNIT)

				//return plen
			//} else {
			//	console.log('Illegal move',plen)
			//	return 0;
			//}

	}


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

	this.init = function (){
		game.board = new Board();
		content.hidden =  false;
		render()
		canvas.addEventListener("mousemove", function(e){
			var prevX = cursorX;
			var prevY = cursorY;


			cursorX = Math.floor(e.pageX/squareSize);
		    cursorY = Math.floor(e.pageY/squareSize);

		    Event_Button_Focus(e.pageX, e.pageY);

			if (prevX == cursorX && prevY == cursorY){
				return;
			}

			for (var i=0; i< EVENT_LIST.length; i++){
				//console.log(EVENT_LIST[i].action);
				if (EVENT_LIST[i].enabled && EVENT_LIST[i].trigger == TRIGGER_MOUSE_MOVE) {
					//render();
					EVENT_LIST[i].action();

					//render();
				}
			}
		});
		canvas.addEventListener("click", function(e){
			//if (PLAYER_ID.id != currentPlayer.id)
			//	return;
			Event_Button_Click(e.pageX, e.pageY);

			for (var i=0; i<EVENT_LIST.length; i++){
				//console.log(EVENT_LIST[i].action);
				if (EVENT_LIST[i].enabled && EVENT_LIST[i].trigger == TRIGGER_MOUSE_CLICK) {
					//render();
					EVENT_LIST[i].action();
					//render()
					//render();
				}
			}
		});

		//var u1 = game.createUnit(player, UNIT_IDS[0], [4,16]) //teemo
		//var u2 = game.createUnit(p2, UNIT_IDS[1], [5,16]) // soraka
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
			if (window.player.num == player.num){
				conn.send({id:'make selection'})
			}
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
		//console.log('setting', unit,'to',point)

		this.update('unit location', util.EMPTY, {unit:unit, loc:point})
	}

	this.createUnit = function (player, id, point){
			if (!id) return;
			//console.log(id.name)
			var u = new Unit(player, id, point);
			this.monsters.push(u);
			u.id = this.monsters.length-1;
			//this.board.units[point[1]][point[0]] = u.id;
			//this.update('create unit', player.num, u)

			for (var i = 0; i< u.spells.length; i++){
				u.spells[i].fire('learn', {trigger:u})
			}

			if (window.player.num == 1 && player.num == 0 && initUnit ==0){
				initUnit = 1;
				u.id = 0;
				var temp = this.monsters[0]
				this.monsters[0] = u;
				this.monsters[1] = temp;
				temp.id = 1;
				this.setUnitAtLoc(temp.id, [this.monsters[1].x,this.monsters[1].y])
			}
			this.setUnitAtLoc(u.id, point)
			if (window.player.num == player.num){
				//console.log(id, point)
				conn.send({id:'create unit', unitid:id.name, point:point})
			}
			return u
		//var unit2 = new unit(id1, 2, 2, util.PLAYER_2);
		}

	this.update = function(type, playernum, data){
		//sendAll(this, {num: playernum, id:'update', type:type, data:data})
	}
	return this;
}



function Dice(type, pattern){
	//this.id = diceid;
	//diceid++;
	this.type = type;
	//this.move=move;
	//this.attack=attack;
	//this.defense=defense;
	//this.magic=magic;
	//this.trap=trap;

	this.pattern = pattern;
	//console.log(CREST_SUMMON)
	this.roll = function(){
		//var i = ;
		//console.log(i);
		return this.pattern[getRandomInt(0,6)];
	}
}


var DICES = {}
DICES['Teemo'] = new Dice(UNITS['Teemo'],
				 [[CREST_SUMMON,1],
					[CREST_SUMMON,1],
					[CREST_SUMMON,1],
					[CREST_SUMMON,1],
					[CREST_SUMMON,1],
					[CREST_MOVEMENT,1]])

DICES['Soraka'] = new Dice(UNITS['Soraka'],
					[[CREST_SUMMON,2],
					 [CREST_SUMMON,2],
					 [CREST_SUMMON,2],
					 [CREST_SUMMON,2],
					 [CREST_ATTACK,2],
					 [CREST_MAGIC,3]]);


DICES['Poppy'] = new Dice(UNITS['Poppy'],
					[[CREST_SUMMON,3],
					 [CREST_SUMMON,3],
					 [CREST_SUMMON,3],
					 [CREST_MOVEMENT,2],
					 [CREST_TRAP,3],
					 [CREST_ATTACK,1]]);

DICES['Garen'] = new Dice(UNITS['Garen'],
					[[CREST_SUMMON,4],
					 [CREST_SUMMON,4],
					 [CREST_DEFENSE,3],
					 [CREST_MOVEMENT,1],
					 [CREST_MAGIC,3],
					 [CREST_TRAP,2]])

 DICES['Lucian'] = new Dice(UNITS['Lucian'],
 					[[CREST_SUMMON,4],
 					 [CREST_SUMMON,4],
 					 [CREST_DEFENSE,3],
 					 [CREST_MOVEMENT,1],
 					 [CREST_MAGIC,3],
 					 [CREST_TRAP,2]])

//var diceid = 0;

function Board(){
	this.tiles = [];
	this.units = [];
	this.boardSizeX = 13;
	this.boardSizeY = 19

	for (var i=0; i<this.boardSizeY;i++){
		this.tiles[i] = [];
		for (var j=0;j<this.boardSizeX; j++){
			this.tiles[i].push(0);
			//this.tiles[i].push(util.EMPTY);
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
		console.assert(x != undefined)
		console.assert(y != undefined)
		if (!boundCursor(x,y)) return -1

		return this.units[y][x];
	}

	this.setTileState = function(point, state){
		this.tiles[point[1]][point[0]] = state;
	}

	this.getTileState = function(x,y){
		  if (exports.boundCursor(x,y)){
		    return this.tiles[y][x];
		  } else {
		    return exports.EMPTY;
		  }
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
			if (!boundCursor(x,y) || this.getTileState(x,y) != util.EMPTY){
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
		//console.log('passed')
		return valid;
	}

	return this;
}

function Player(id){
	this.id = id;
	this.num;
	this.pool = [5,5,5,5,5]

	this.state = util.GAME_STATE_END;
	//this.actionstate = util.PLAYER_STATE_NEUTRAL;
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
	this.spell = util.EMPTY;

	this.valid = false;
	this.dices = [DICES['Teemo'],DICES['Teemo'],DICES['Teemo'],DICES['Teemo'],DICES['Teemo'],
								DICES['Soraka'],DICES['Soraka'],DICES['Soraka'],DICES['Soraka'],DICES['Soraka'],
								DICES['Garen'],DICES['Garen'],DICES['Garen'],DICES['Garen'],DICES['Garen']];


	this.spell = util.EMPTY;

	this.updatePool = function(crest, point){
		this.pool[crest] += point;
		//console.log('update pool')
		if (player.num == this.num)
			conn.send({id:'update pool', crest:crest, point:point})
		//games[this.id].update('pool', this.num, {crest:crest, point:point})
	}

	this.updateShape = function(x,y){
		if (this.summonchoice == util.EMPTY) return;

		var shape = [];
		var cshape = rotateShape(this.shape,this.rotate);
		for (var i=0; i<cshape.length; i++){
			shape.push([cshape[i][0]+x, cshape[i][1]+y])
		}
		return shape;

	}

	this.updateTile = function(shape){
		this.tileSelected = shape;
		//console.log('update tile')
		this.valid = game.board.validPlacement(this)
		//console.log(shape)
		//console.log('setting', this.num, this.valid)
		if (player.num == this.num){
			conn.send({id:'update tile', shape:shape})
		}
	}

	this.getCrestPool = function(crest){
  		return this.pool[crest]
	}





	this.changeState = function(state){
		//var game = games[this.id]
		//console.log('change state')
		//console.log(game.combat)
		this.state = state;
		this.unitSelected = util.EMPTY;
		this.movePath = []
		this.tileSelected = []

		if (state == util.GAME_STATE_END){
			game.turn++;
			this.rolled = false;
			this.summon = [];
			this.summonlevel = 0;
			this.shape = 0;
			this.rotate = 0;
			this.valid = false;
			this.spell = util.EMPTY
			//this.actionstate = util.PLAYER_STATE_NEUTRAL;

			for (var i=0; i<game.monsters.length;i++){
				if (!game.monsters[i].exist) continue;
				if (game.monsters[i].player.num == this.num){
					game.monsters[i].hasAttacked = false;
					game.monsters[i].canAttacked = true;
				}
			}

			var p = game.props
			for (var i=0; i< p.length; i++){
				if (p[i].clear){
				p.splice(i,1)
				}
			}

			//game.players[((this.num == 0) ? 1 : 0)].changeState(util.GAME_STATE_ROLL);
			//game.players[((this.num == 0) ? 1 : 0)].changeState(util.GAME_STATE_UNIT);
			if (player.num != this.num){
				player.changeState(util.GAME_STATE_UNIT)
			}
		}
		//game.update('change state', this.num, state)
		if (player.num == this.num){
			conn.send({id:'change state', state:state})
		}

		changeState(state)
	}

	this.changeActionState = function(state){
		this.actionstate = state;
	}

	this.endTurn = function (){
		//sockets[this.id].send(JSON.stringify({data:'alert', data:"End Phase"}));

		console.log('end turn')
		this.changeState(util.GAME_STATE_END);
	}

	this.onRoll = function(data){
		console.log(this.dices[2])
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
		//send(this.id, {id:'alert', data:data})
	}

	this.selectUnit = function(x,y){
		//var game = games[this.id]
		var m = util.getUnitAtLocation(game.board,x,y)
		if (this.unitSelected == m) {
			this.changeState(util.GAME_STATE_UNIT);
		} else if (game.monsters[m].player.num==this.num){
			this.changeState(util.GAME_STATE_SELECT);
			this.unitSelected = m;
			conn.send({id:'select unit', unit:m})

			if (player.num == this.num){
				if (game.monsters[m].spells[0]){
					qButton.innerHTML = game.monsters[m].spells[0].name
				}
				if (game.monsters[m].spells[1]){
					wButton.innerHTML = game.monsters[m].spells[1].name
				}
				if (game.monsters[m].spells[2]){
					eButton.innerHTML = game.monsters[m].spells[2].name
				}

			}
			return true
		}
		return false;
	}

	return this;
}

/*
socket.onmessage = function(event){
	try {
		var data = JSON.parse(event.data)
    } catch (e){
    	console.log("ERROR: parsing JSON failed")
    	return;
    }


    // playerPanel.innerHTML = players;


    if (data.id == 's_roll'){
      if( data.data.length != 0 ) {
        //sockets[this.id].emit('alert', "Dice Dimension Phase")
        //player.state = util.GAME_STATE_SUMMON;
        console.log('summoning')
      } else {
      	console.log('unit')
        //player.state = util.GAME_STATE_UNIT;
         //sockets[this.id].emit('alert', "Action Phase")
      }
		console.log(data);
		var string = "";
		for (var i=0; i<data.length; i++){
			if (data[i][0] != CREST_SUMMON){
				string += "+" + data[i][1] + CREST_TEXT[data[i][0]] + "<br\>"
			}

		//setDicePanelText(string);
	}

	if (data.id == 'alert'){
		//console.log("new laert" + TimeoutAlpha)
		if (Timeout != null){
			Timeout.remove();
		}
		Timeout = registerTimerEvent(100, alertTimeout);
		TimeoutAlpha = 1500/100;
		TimeoutReady = false;
		AlertText = data.data;
	}

	if (data.id == 'id'){
		socketid = data.data
	}

	if (data.id == 'combat'){
		game.combat = data.data
		console.log(data.data.unit.type.name, 'attacking', data.data.target.type.name)
	}

	if (data.id == 'guard'){
		console.log('block damage?')
		yesButton.hidden = false;
		noButton.hidden = false;
	}

	if (data.id == 'postattack'){

	}

	if (data.id == 'update'){
		//console.log('updating', data.type)


		if (data.type == 'unit location'){
			if (data.data.unit != util.EMPTY){
		      game.monsters[data.data.unit].x = data.data.loc[0]
		      game.monsters[data.data.unit].y = data.data.loc[1]
		    }
			game.board.units[data.data.loc[1]][data.data.loc[0]] = data.data.unit;

		}

		var p1 = data.num != util.EMPTY ? game.players[data.num] : null;

		if (data.type == 'roll'){
			console.log(data.data.data)
			p1.summon = data.data.data

		}

		if (data.type == 'impairment'){
			game.monsters[data.data.unit].impairment += data.data.point
		}

		if (data.type == 'destroy prop'){
			console.log('Removing', data.data.unit.name+"'s", data.data.name)
			game.props.splice(game.props.indexOf(data.data),1)
		}

		if (data.type == 'destroy unit'){
			console.log('Removing', data.data.unit.name)
			game.board.units[data.data.loc[1]][data.data.loc[0]] = util.EMPTY
			//game.monsters.splice(game.monsters.indexOf(data.data.unit),1)
			game.monsters[data.data.unit.id].exist = false
		}

		if (data.type == 'prop'){
			game.props.push(data.data)
		}

		if (data.type == 'make selection'){
			if (p1.num == player.num)
				Buttons[data.data.dice].hidden = true;
			console.log(data.data)

			for (var i =0; i<6; i++){

        		var x = data.data.shape[i][0];
        		var y = data.data.shape[i][1];
  				console.log(x,y)
				game.board.tiles[y][x] = p1.num
			}
		}

		if (data.type == 'attack'){
			//damage', player.id, {trigger:this.unit.id, target:this.target, damage:dmg})
			console.log(data.data.damage)
			game.monsters[data.data.target].hp -= data.data.damage;
			if (data.data.guard){
				console.log('Blocked!')
			}
			game.monsters[data.data.target].exists = game.monsters[data.data.target].hp <= 0
			console.log(game.monsters[data.data.target].type.name, 'took', data.data.damage, 'hit')


		}

		if (data.type == 'miss'){

			console.log(game.monsters[data.data.trigger].type.name, 'missed')
		}

		if (data.type == 'damage'){
			//damage', player.id, {trigger:this.unit.id, target:this.target, damage:dmg})
			game.monsters[data.data.target].hp -= data.data.damage;
			game.monsters[data.data.target].exists = game.monsters[data.data.target].hp <= 0
			console.log(game.monsters[data.data.target].type.name, 'took', data.data.damage, 'hit')
		}

		if (data.type == 'buff unit'){
			game.monsters[data.data.target.id] = data.data.target
			console.log(data.data.target.type.name,'received ',data.data.buff)
		}

		if (data.type == 'tile'){
			p1.tileSelected = data.data.shape;
			p1.valid = data.data.valid;

		} else if( data.type == 'pool' ){
			if(p1.num == player.num)
			console.log(data.data.point , CREST_TEXT[data.data.crest])
			p1.pool[data.data.crest] += data.data.point

		}

		if (data.type == 'select unit'){
			p1.unitSelected = data.data
		}

		if (data.type == 'create unit'){
      		game.monsters.push(data.data);
		}

		if (data.type == 'change state'){
			changeState(p1, data.data)
		}

		//render()

	}

	if (data.id == 'new game') {
		console.log('data')
		game = data.data;

		playerPanel.innerHTML = " Player: " + socketid;
		init();
		opponent = game.players[1];
		player = game.players[0];
		//console.log(game.players[0].id)
		if (game.players[1].id == socketid) {
			player = game.players[1]
			opponent = game.players[0]
		}
		render();
	}



}
*/

//state codes

//board states

//var util.EMPTY = -1;
//var util.PLAYER_1 = 0;
//var util.util.PLAYER_2= 1;

//states
var keyZ = 122;
var keysDown = {};
var rotate = 0;
var flip = false;
var shape = 0;
var validpos = true;
var monsters = [];
var selectedUnit = util.EMPTY;


var game;

function disableSpell(d){
		passiveButton.hidden = d;
		qButton.hidden = d;
		wButton.hidden = d;
		eButton.hidden = d;
		rButton.hidden = d;
		passiveButton.disabled = d;
		qButton.disabled = d;
		wButton.disabled = d;
		eButton.disabled = d;
		rButton.disabled = d;
		player.spell = util.EMPTY
}

function disableButtons(a,b){
		rollButton.disabled = a;
		endturnButton.disabled = b;
}

function changeState(p1, state){

	if (p1.num == player.num){
		console.log('Phase',GAME_STATE_TEXT[state])
	}
    //var state = data.data;
  p1.state = state;
  p1.tileSelected = []
  player.spell = util.EMPTY

  if (state == util.GAME_STATE_UNIT){
    p1.unitSelected = util.EMPTY;

  }

  if (state == util.GAME_STATE_END){
  	disableButtons(true,true)
	for (i=0;i<15;i++) Buttons[i].reset();
	DiceSelection = [];

	p1.rolled = false;
	p1.shape = 0;
	p1.rotate = 0;
	p1.valid = false;
	p1.spell = util.EMPTY

  p1.movePath = []
    for (var i=0; i<game.monsters.length;i++){
      if (!game.monsters[i].exist) continue;
      if (game.monsters[i].player.num == this.num){
        game.monsters[i].hasAttacked = false;
        game.monsters[i].canAttacked = true;
      }
    }
    game.turn++;
  }

	//UI
	yesButton.hidden = true;
	noButton.hidden = true;

	for (i=0; i<15; i++){
		if (!player.dices[i]){
			Buttons[i].hidden = true;
		}
	}
	disableButtons(true,true)

	if (player.state == util.GAME_STATE_SUMMON){
		for (i=0;i<15;i++) Buttons[i].reset();
		console.log('summon', player.summon)
		for (i=0;i<player.summon.length;i++) {
			Buttons[player.summon[i]].toggle = true;
			Buttons[player.summon[i]].focus = true;
		}
	} else if (player.state == util.GAME_STATE_SELECT ||
		player.state == util.GAME_STATE_UNIT) {
		disableButtons(true,false)
	}

}

function flipXY(x,y){
	return [util.boardSizeX-x,util.boardSizeY-y]
}

function drawSelection (player){
	var selection = player.tileSelected;
	//console.log(player.tileSelected);
	if (!selection || selection.length <= 0) {
		return;
	}
	ctx.globalAlpha = 0.5;

	for (var i = 0; i<6; i++){
		ctx.fillStyle = purple;
		if (player.num == util.PLAYER_2){
		ctx.fillStyle = blue;
		}

		if (i == 0){
			ctx.fillStyle = black;
		}
		//console.log(game.board)
		if (!player.valid){
			//console.log('not valid')
			ctx.fillStyle = red;
		}
		ctx.strokeStyle = "#303030";
		ctx.lineWidth = 1;
		var x = selection[i][0]
		var y = selection[i][1]
		if (player.num == 1){
			//x = util.boardSizeX-x-1
			//y = util.boardSizeY-y-1
			//console.log(x,y)
		}

		drawSquare(x*squareSize, y*squareSize);
		//console.log(selection)
	}
	ctx.globalAlpha = 1;

}

function drawPath(){
	//movePathSelection = player.movePath;
	if (player.state != exports.GAME_STATE_SELECT) return;
	//var movePathSelection = movePath;
	//console.log(movePathSelection)

	//if (movePathSelection.length > 1 && movePathSelection.length-1 <= player.pool.pool[CREST_MOVEMENT]) {
	ctx.globalAlpha = 0.5;

	for (var i=0; i<player.movePath.length; i++){
		var x = player.movePath[i][0]
		var y = player.movePath[i][1]
		if (!boundCursor(x,y)) continue
		if (player.num == 1){
			//x = util.boardSizeX-x-1;
			//y = util.boardSizeY-y-1
		}
		if (cursorX == x && cursorY == y) continue;
		ctx.fillStyle= "#000000";
		ctx.strokeStyle = "#303030";
		ctx.lineWidth = 1;
		drawSquare(x*squareSize, y*squareSize )
	}
	ctx.globalAlpha = 1.0;

	//};

}

var Buttons = [];

//var AlertText = "";

var Timeout = null;
var TimeoutReady = true;
var TimeoutAlpha = 0;
var AlertText = "";
var DialogText = "";

function alertTimeout(){
	//console.log("timeout");
	TimeoutAlpha--;
	//console.log(TimeoutAlpha);
	if (TimeoutAlpha < 0) {
		Timeout.remove();
		Timeout = null;
		AlertText = "";
		//socket.emit('alert timeout');
	}


}

function drawDialog(text){
	if (DialogText != ""){
		ctx.strokeStyle = red;
		ctx.lineWidth = 3;
		ctx.fillStyle = white;
		ctx.fillRect(200,200,200,80);
		ctx.strokeRect(200,200,200,80);
		ctx.fillStyle = black;
		ctx.font = ctx.font = "13px Arial";
		ctx.fillText(DialogText,225, 225 )
	}

}

function drawAlert(){
	if (AlertText != ""){
		//ctx.globalAlpha = TimeoutAlpha/30;
		ctx.globalAlpha = 0.75;
		//console.log(TimeoutAlpha/30*100)

		ctx.strokeStyle = red;
		ctx.lineWidth = 3;
		ctx.fillStyle = white;
		ctx.fillRect(200,200,250,80);
		ctx.strokeRect(200,200,250,80);
		ctx.fillStyle = black;
		ctx.font = ctx.font = "13px Arial";
		ctx.fillText(AlertText,225, 225 )
		//ctx.fillText("x"+p[1],400 + j* 28+15,255 + i*30+30);
	}
	ctx.globalAlpha = 1;
}

function drawButton(){
	for (var i=0; i< Buttons.length; i++){
		if (!Buttons[i].hidden){
			Buttons[i].render();
		}
	}
}



var DicePattern = [];

function drawDicePattern(){
	var count = 0
	for (var i=0; i< DicePattern.length;i++){
		for (var j=0; j<6; j++){
			var p = DicePattern[i].pattern[j];
			drawCrest(p[0], 400 + j* 28, 255 + i*30, 25, 25)
			ctx.fillStyle = red;
			if (p[0] == 5) {
				//ctx.fillText(p[1],400 + j* 28+9,255 + i*30+16);
			} else {
				ctx.font = ctx.font = "10px Arial";
				ctx.fillText("x"+p[1],400 + j* 28+15,255 + i*30+30);
			}

		}
	}
}
function changeCursor(cursor){
	console.log("sdf");
	canvas.style.cursor = cursor;

	//body.cursor = cursor;
}

var Event_Button_Focus = function(x,y){
	DicePattern = [];
	for (var i=0;i<Buttons.length; i++){
		var b = Buttons[i];
		if (b.hidden) continue;
		if (x >= b.x && x <= b.sx+b.x && y >= b.y && y <= b.sy+b.y) {
			if (player.state == util.GAME_STATE_ROLL){
				b.onFocus(x,y);

			}

			var m = player.dices[b.id].type;
			DicePattern.push(player.dices[b.id]);
			setStatePanelText(m)
		} else {

			if (player.state == util.GAME_STATE_ROLL){
				b.onUnfocus(x,y);

			}
		}

	}
	//render();

}



var Event_Button_Click = function(x,y){
	if (player.state == util.GAME_STATE_ROLL || util.GAME_STATE_SUMMON){
		for (var i=0;i<Buttons.length; i++){
			var b = Buttons[i];
			if (b.hidden) continue;
			if (x >= b.x && x <= b.sx+b.x && y >= b.y && y <= b.sy+b.y) {
				b.onClick(x,y)
			}
		}
	}
}

var summonToggle;

var Button = function(id, img, x, y,sx,sy,unit){
	this.rx = x;
	this.ry = y;
	this.x = x;
	this.y = y;

	this.sx = sx;
	this.sy = sy;
	console.log(this.sx,this.sy)
	this.hidden = false;
	this.toggle = false;
	this.focus = false;
	this.unfocus = false;
	this.id = id;
	//this.unit = unit;

	this.reset = function(){
		this.toggle = false;
		this.focus = false;
		//icePattern = [];
	}

	this.onFocus = function(x,y){

		if (this.focus) return;
		//console.log(x,y, b.x, b.y, b.wx, b.hy)
		if (player.state == util.GAME_STATE_ROLL){
			//changeCursor("pointer")
			this.focus = true;

			//DicePattern = [];
			//DicePattern.push(player.dices[0])

		}
		//render();

	}
	this.onUnfocus = function(x,y){

		if (!this.focus) return;

		if (this.toggle) return;
		//changeCursor("default")
		//changeCursor("pointer")
		if (player.state == util.GAME_STATE_ROLL){
			this.focus = false;

			//DicePattern = [];
		}
		//render();
	}
	this.onClick = function(x,y){

		if (player.state == util.GAME_STATE_ROLL){
			if (this.toggle){
				this.toggle = false;
				DiceSelection.splice(DiceSelection.indexOf(this),1);
				//this.onUnfocus(x,y);
			} else {
				this.toggle = true;
				DiceSelection.unshift(this);
				if (DiceSelection.length > 3){
					var b = DiceSelection.pop();
					b.toggle = false;
					b.onUnfocus(x,y);
				}
			}
			for (var i=0; i<15; i++){
				Buttons[i].unfocus = false;
			}

			if (DiceSelection.length == 3){
				disableButtons(false,true)
				for (var i=0; i<15; i++)
					Buttons[i].unfocus = true;

			}

		} else if (player.state == util.GAME_STATE_SUMMON ){
			if (this.toggle){
				summonToggle = this;
				console.log('summoinining')
				player.summonchoice = this.id;
				player.updateTile(player.updateShape(cursorX,cursorY))
				//socket.send(JSON.stringify({id:'c_summonoption', data:this.id}))
			}
		}
	}
	this.img = img;


	this.render = function(){
		ctx.globalAlpha = 0.25;
		if (player.state == util.GAME_STATE_ROLL || player.state == util.GAME_STATE_SUMMON){
			var mod = 0;
			if (player.state == util.GAME_STATE_ROLL){
				ctx.globalAlpha = 1;
			}

			if (this.unfocus){
				ctx.globalAlpha = 0.5;
			}

			if (this.focus){
				mod = 1;
			}

			if (this.toggle){
				ctx.globalAlpha = 1;
				if (player.state == util.GAME_STATE_ROLL){
					ctx.fillStyle = black;
				} else if (player.state == util.GAME_STATE_SUMMON){
					if (summonToggle == this){
						ctx.fillStyle = black;
					} else {
						ctx.fillStyle = white;
					}
				}
				ctx.fillRect(this.rx-(mod*4),this.ry-(mod*4), this.sx+8*mod,this.sy+8*mod);
			}
			drawCrest(CREST_SUMMON, this.rx-mod,this.ry-mod, this.sx+(2*mod), this.sy+(2*mod))
			var lvl = player.dices[this.id].pattern[0][1]
			ctx.fillStyle = black;
			ctx.font = ctx.font = "10px Arial";
			ctx.fillText(lvl,this.rx+15,this.ry+21);
		} else {
			drawCrest(CREST_SUMMON, this.rx,this.ry, this.sx, this.sy)
			ctx.fillStyle = black;
			var lvl = player.dices[this.id].pattern[0][1]
			ctx.fillText(lvl,this.rx+15,this.ry+21);
		}
		ctx.globalAlpha = 1;
	}
	Buttons.push(this);
	return this;
}

var DicePool = []
var DiceSelection = []
for (var i=0; i<3; i++){
	for (var j=0;j<5;j++){
		var b = new Button((i*5)+j,heartImage, 415+50*i,300+50*j, 36,36)
		DicePool.push(b);

	}
}

var CREST_MOVEMENT = 0;
var CREST_ATTACK = 1;
var CREST_DEFENSE = 2;
var CREST_MAGIC = 3;
var CREST_TRAP = 4;
var CREST_SUMMON = 5;

var CREST_TEXT = ["MOVEMENT", "ATTACK","DEFENSE", "MAGIC", "TRAP", "SUMMON" ]




//colours
var blue    = "#000099";
var red = "#990000";
var purple  = "#990099";
var white = "#ffffff";
var black = "#000000"

var heartReady = false;
var heartImage = new Image();
heartImage.onload = function(){
	heartReady = true;
	//init();
};
heartImage.src = 'assets/img/heart.png';

var img_crest_rdy = false;
var img_crest = new Image();
img_crest.onload = function(){
	img_crest_rdy = true;
}
img_crest.src = "assets/img/crests.jpg"

/*
function validPlacement(player){
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
		if (!boundCursor(x,y) || getBoardState(x,y) != util.EMPTY){
			return false;
		}
		//adjacent
		if (getBoardState(x+1,y) == player.num ||
			getBoardState(x-1,y) == player.num ||
			getBoardState(x,y-1) == player.num ||
			getBoardState(x,y+1) == player.num ){
			valid = true;
		}
	}
	return valid;
}
*/


addEventListener("keypress", function(e){
		//keysDown[e.keyCode] = true;
		//console.log(e.charCode);
		if (!game) return
		if (player.state != util.GAME_STATE_SUMMON) return;
		if (e.charCode == 122){
			socket.send(JSON.stringify({id:'rotate shape'}));
		} else if (e.charCode == 99){
			socket.send(JSON.stringify({id:'change shape'}));
		}
		//console.log('keypress')
}, false);




cursorX = 0;
cursorY = 0;
pageX = 0;
pageY = 0;
//PLAYER_ID.pool.set(CREST_MOVEMENT, 5);

var summonNames = [];

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
	//console.log(getUnitAtLocation([x,y]))
	if (isUnitOnCursor(x,y)) {
		return game.monsters[getUnitAtLocation([x,y])];
	} else {
		return null;
	}
}

var getUnitById = function(id){
	return monsters[id];

}

var getUnitAtLocation = function (l){
	//console.log("unit at " + x +" " + y);
	if (game)
		return game.board.units[l[1]][l[0]];
}
/*
var setUnitAtLocation = function (id, point){
	game.board.units[point[1]][point[0]] = id;
}
}

function setBoardState(state, point){
	game.board.tiles[point[1]][point[0]] = state;

*/

function getBoardState(x,y){
	//console.log(x, y)
	if (boundCursor(x,y) && game){
		return game.board.tiles[y][x];
	} else {
		return util.EMPTY;
	}
}


function updateCrest(pool){
	crestPanel.innerHTML = 	"<b>Movement: </b>" + pool[CREST_MOVEMENT]+ "<br>" +
						"<b>Attack</b>: " + pool[CREST_ATTACK] +"<br>" +
						"<b>Defense</b>: " + pool[CREST_DEFENSE] +"<br>" +
						"<b>Magic</b>: " + pool[CREST_MAGIC] +"<br>" +
						"<b>Trap</b>: " + pool[CREST_TRAP] +"<br>";

}



function spellButtonEffect(button){
	if (player.state != util.GAME_STATE_SELECT) return;
	if (!game.monsters[player.unitSelected].spells[button]) return
	if (!game.monsters[player.unitSelected].spells[button].target){
		socket.send(JSON.stringify({ id:'cast', data:button}));
	} else {
		player.spell = button;
		game.monsters[player.unitSelected].spells[button].fire('cast', {trigger:game.monsters[player.unitSelected]})
	}
	//console.log('cast',button)
}

function responseButton(button){
	conn.send({id:'guard response', data:button})
	yesButton.hidden = true;
	yesButton.hidden = true;
	//socket.send(JSON.stringify({ id:'guard response', data:button}));
}
yesButton.addEventListener("click", function(){
	responseButton(1)
	player.updatePool(CREST_DEFENSE,-1);
})

noButton.addEventListener("click", function(){
	responseButton(0)
})

qButton.addEventListener("click", function(){
	spellButtonEffect(0)
})

wButton.addEventListener("click", function(){
	spellButtonEffect(1)
})

eButton.addEventListener("click", function(){
	spellButtonEffect(2)
})

cancelButton.addEventListener("click", function(){
	player.spell = -1;
	player.changeState(util.GAME_STATE_UNIT)
})


endturnButton.addEventListener("click", function(){
	//socket.send(JSON.stringify({id:'end turn'}));
	player.endTurn();
	//PLAYER_ID.endTurn();
})

rollButton.addEventListener("click", function(){
	//this.state = PLAYER_STATE_ROLL;
    //setDicePanelText("+2 MOVEMENT")
    //var dices = [Dice_Teemo, Dice_Soraka, Dice_Teemo];
    //var summonlevel = 0;
    //var summon = [[],[],[],[]];
    //update crestpool
    var data = [];
    for (var i=0; i<DiceSelection.length; i++){
    	data.push(DiceSelection[i].id)
    }
    player.onRoll(data)
	if( player.summon != 0 ) {
		player.changeState(util.GAME_STATE_SUMMON);
	} else {
		player.changeState(util.GAME_STATE_UNIT)
	}
    //socket.send(JSON.stringify({id:'c_roll', data:data}));
})

function hideButton(button, boolean, point){
	b = "hidden";
	o = "0";
	if (!boolean) {
		b = "visible";
		o = "100";
	}
	point = point || [0,0];
	with(button.style){
		top =  point[1]*squareSize-squareSize+"px";
		left=  point[0]*squareSize-squareSize+"px";
	}
	with(button.style){
		visibility = b;
		opacity= o;
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
		//var mt = m.type;
		var hpheart = "";
		for (var i=0;i<m.hp;i=i+10){
			hpheart += heartImg;
		}
		text =  "<b>"+ m.name + "</b><br>" +
				"<b>HP</b> : "  + hpheart +"<br>" +
				"<b>ATK</b> : " + m.atk +"<br>" +
				"<b>DEF</b> : " + m.def +"<br>"
	}
	statPanel.innerHTML = text;
}


function drawBoard(){
	//console.log('drawing board')
	ctx.strokeStyle = "#ffffff";
	ctx.lineWidth = 1;
	//ctx.shadowBlur = 5;
	//ctx.shadowColor = "grey";
	//board[6][7] =  1;

	var verticalFlip = player.num == 0;
	var dx = dy = 0;
	/*
	for (var i= verticalFlip ? 0 : util.boardSizeX-1; verticalFlip ? i< util.boardSizeX : i>=0 ; verticalFlip ? i++:i--){
		for (var j= verticalFlip ? 0 : util.boardSizeY-1; verticalFlip ? j< util.boardSizeY : j>=0 ; verticalFlip ? j++:j--){
	*/
	for (var i = 0; i< util.boardSizeX; i++ ){
		for (var j = 0; j< util.boardSizeY; j++ ){
			ctx.fillStyle = "#303030";
			ctx.strokeStyle = white
			drawSquare(i*squareSize,j*squareSize);
		}
	}

	for (var i = 0; i< util.boardSizeX; i++ ){
		for (var j = 0; j< util.boardSizeY; j++ ){
			var x = i,y = j
			if (player.num == 1){
				//x = util.boardSizeX-x-1
				//y = util.boardSizeY-y-1
				//console.log(x,y)
			}

			if (getBoardState(i,j)== util.PLAYER_1){
				ctx.fillStyle = purple;
				ctx.strokeStyle = purple
			} else if (getBoardState(i,j) == util.PLAYER_2){
				ctx.fillStyle = blue;
				ctx.strokeStyle = blue
			} else {
				continue;
			}
			drawSquare(x*squareSize,y*squareSize);
		}
	}


}

var drawCircle = function(x,y,w,p) {
	ctx.beginPath();
	ctx.arc(x*squareSize+ squareSize/2, y*squareSize+ squareSize/2, squareSize/2, 0, 2 * Math.PI, false);
	if (p.num == 0){
		ctx.fillStyle = "#008080";
	} else {
		ctx.fillStyle = "#808000";
	}
	ctx.fill();

	ctx.lineWidth = w;
	ctx.strokeStyle = '#000000';
	ctx.stroke();
}

var drawProps = function() {
	for (var i=0; i<game.props.length; i++){
		var p = game.props[i];
		//p = getCurrentPlayer()
		if (!p){
			continue;
		}
		ctx.beginPath();
		ctx.arc(p.x*squareSize+ squareSize/2, p.y*squareSize+ squareSize/2, squareSize/4, 0, 2 * Math.PI, false);
		if (p.unit.player.num == 0){
			ctx.fillStyle = "#008080";
		} else {
			ctx.fillStyle = "#808000";
		}
		ctx.fill();
		ctx.lineWidth = 1;
		ctx.strokeStyle = '#000000';
		ctx.stroke();
		}
}

var drawUnits = function() {
	//console.l(game.monsters.length)
	for(var i=0; i<game.monsters.length; i++) {
		//console.log(game.monsters[i]);
		var m = game.monsters[i];
		if (!m.exist) continue
		var w = 1;
		//p = getCurrentPlayer()
		if (player.unitSelected == m.id){
			w = 3;
		}
		if (opponent.unitSelected == m.id){
			w = 5;
		}
		var x = m.x,y = m.y
		if (player.num == 1){
			//x = util.boardSizeX-x-1
			//y = util.boardSizeY-y-1

		}
		drawCircle(x, y,w, m.player);

	}

}



//triggers
var TRIGGER_MOUSE_CLICK = 0;
var TRIGGER_MOUSE_MOVE = 1;
var TRIGGER_KEY_PRESSED = 2;
var TRIGGER_TIMEOUT = 3;


var eventTriggerKey = 0;

var EVENT_LIST = [];

function Event(trigger, action){
	this.trigger = trigger;
	this.action = action;
	this.enabled = true;
	this.interval = 0;
	this.timeout = 0;
	EVENT_LIST.push(this);

	this.remove = function(){
		this.enabled = false;
		//EVENT_LIST.splice(EVENT_LIST.indexOf(this),1);
		console.log("removed");
	}
}


function registerClickEvent(action){
	return new Event(TRIGGER_MOUSE_CLICK,action)
}

function registerMoveEvent(condition, action){
	return new Event(TRIGGER_MOUSE_MOVE,action)
}

function registerPressEvent(condition, action){
	return new Event(TRIGGER_KEY_PRESSED, condition, action)
}

function registerTimerEvent(interval, action) {
	var e = new Event(TRIGGER_TIMEOUT, function(){return true}, action);
	e.interval = interval;
	return e;
}

registerMoveEvent(
	function(){return true},
	function(){

	});

registerMoveEvent(
	function(){return true},
	function(){


		if (game.turn%2 != player.num) return
		if (player.state != util.GAME_STATE_SUMMON) return
		if (boundCursor(cursorX,cursorY))
		//player.cursorX = data.X;
		//player.cursorY = data.Y;
		//console.log('playrerx',p1.cursorX)

		player.updateTile(player.updateShape(cursorX, cursorY))

			//socket.send(JSON.stringify({id :'mouse move', data:{X:cursorX, Y:cursorY}}))

	});




new Event(TRIGGER_MOUSE_CLICK,
	function(){
		if (game.turn%2 != player.num) return
		var x = cursorX;
		var y = cursorY;
		if (player.num == 1){
			//x = util.boardSizeX-x-1
			//y = util.boardSizeY-y-1
		}
		var u = game.board.getUnitAtLoc(x,y)
		if (player.state == util.GAME_STATE_UNIT){
			if (u == util.EMPTY) return;
			//console.log('unit select')
     		//socket.send(JSON.stringify({id:'mouse click', data:{state: 'select', loc:[x, y]}}))
   		player.selectUnit(x, y)
   		var m = game.monsters[u]
			player.movePath = util.findPossiblePath(game.board,[m.x, m.y],exports.getCrestPool(player,CREST_MOVEMENT)-m.impairment)
    } else if (player.state == util.GAME_STATE_SELECT){
 				if (player.spell != util.EMPTY){
     			console.log('cast',player.spell)
					var spell = game.monsters[player.unitSelected].spells[player.spell]
					//console.log(spell)

					var event = {trigger: game.monsters[player.unitSelected], location: [x,y]};
					spell.fire('effect',event);

     		} else if (u == util.EMPTY){
     			//socket.send(JSON.stringify({id:'mouse click', data:{state:'move', loc:[x, y]}}))
 					if (game.board.getTileState(x, y) != util.EMPTY){
	 					console.log('moving')
						var m = game.monsters[player.unitSelected]
						var path = util.findPath(game.board,[m.x,m.y],[x,y]);
						var plen = path.length
						if (plen > 1 && plen-1 <= player.getCrestPool(util.CREST_MOVEMENT) - m.impairment) {
	 						m.movement(path)
							player.updatePool(CREST_MOVEMENT,-plen+1)
							player.changeState(util.GAME_STATE_UNIT)
						}
					}
     		} else if (game.monsters[u].player.num == player.num){
					//console.log('u not null')
     			player.selectUnit(x, y)
				} else if (game.monsters[u].player.num != player.num){
					console.log('atacking')
					game.monsters[player.unitSelected].attack(game.monsters[u])
				}
    } else if (player.state == util.GAME_STATE_SUMMON){
				if (game.makeSelection(player)){
					game.createUnit(player,player.dices[player.summonchoice].type,[x,y])
					player.changeState(util.GAME_STATE_UNIT);
				}
     		//socket.send(JSON.stringify({id:'tile place',data:{loc:[x, y]} }))
		}
		//render();
	});





function manhattanDistance(point, goal){
	return Math.abs(point.x - goal.x) + Math.abs(point.y- goal.y);
}

function findStraightPath(pathStart, pathEnd){
	var result = []
	var dx = pathEnd[0]-pathStart[0];
	var dy = pathEnd[1]-pathStart[1];
	if (!(dx == 0 || dy == 0)) return [];
	for (var i=1; i<=Math.max(Math.abs(dx),Math.abs(dy)); i++){
		var xi = pathStart[0]
		var yi = pathStart[1]
		if (dx == 0){
			if (dy <0) yi -= i
			else 	yi += i;
		} else if (dy == 0){
			if (dx <0) xi -= i
			else 	xi+=i;
		}
		if (validWalk(xi,yi)){
			result.push([xi,yi])
		} else {
			console.log('breaking at', xi,yi)
			break;
		}

	}
	return result
}

function validWalk(x, y){
	console.log()
	return boundCursor(x,y) && game.board.getUnitAtLoc(x,y) == util.EMPTY && util.getTileState(game.board,x,y) != util.EMPTY;
}
function findPath(pathStart, pathEnd) {

	function Node(parent, point){

		this.x = point.x;
		this.y = point.y;
				this.parent = parent;
		this.value = point.x + point.y * util.boardSizeY;
		this.f = 0;
		this.g = 0;
		return this;
	}


	function neighbours(x, y ){
		var N = y-1;
		var S = y+1;
		var E = x+1;
		var W = x-1;
		result = [];
		if (validWalk(x,N)) result.push({x:x, y:N});
		if (validWalk(x,S)) result.push({x:x, y:S});
		if (validWalk(E,y)) result.push({x:E, y:y});
		if (validWalk(W,y)) result.push({x:W, y:y});
		return result;
	};


	function calculatePath(){
		var pathstart = new Node(null, {x:pathStart[0], y:pathStart[1]});
		var pathend = new Node(null, {x:pathEnd[0], y:pathEnd[1]});
		var astar = new Array(util.boardSizeX*util.boardSizeY);
		var open = [pathstart];
		var closed = [];
		var result = [];
		var neighcurr;
		var nodecurr;
		var path;
		var length, max, min, i, j;

		while (length = open.length){

			max = util.boardSizeX*util.boardSizeY;
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
				neighcurr = neighbours(nodecurr.x, nodecurr.y);

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
		//console.log(result);
		return result;
	}
	return calculatePath();

}




//setInterval("checkCursor()", 1000);
//function checkCursor(){
//    ;
//}

var middle = false;


var printCursor = function() {
	if (cursorX<= canvas.width && cursorY <= canvas.height){
		console.log("Cursor at: " + cursorX + ", " + cursorY);
	}
}

var then = Date.now();

function drawCrest(crest, x,y, sx, sy){
	//var size = wx;
	if (img_crest_rdy) {
		if (crest == CREST_SUMMON){
			ctx.drawImage(img_crest,0,0,58,58, x, y, sx, sy);
		} else if (crest == CREST_MOVEMENT){
			ctx.drawImage(img_crest,55,0,59,58, x, y, sx, sy);
		} else if (crest == CREST_MAGIC){
			ctx.drawImage(img_crest,112,0,59,58, x, y, sx, sy);
		} else if (crest == CREST_ATTACK){
			ctx.drawImage(img_crest,169,0,59,58, x, y, sx, sy);
		} else if (crest == CREST_DEFENSE){
			ctx.drawImage(img_crest,227,0,59,58, x, y, sx, sy);
		} else if (crest == CREST_TRAP){
			ctx.drawImage(img_crest,284,0,59,58, x, y, sx, sy);
		}


	};
}


var time;
function render(){
	requestAnimationFrame(render);
	ctx.clearRect(0,0,canvas.width,canvas.height)
	drawBoard();
	drawUnits();
	drawProps();
	drawButton()

	drawDicePattern();
	drawSelection(player);
	drawSelection(opponent);
	drawPath();
	//drawAlert();
	drawDialog();
	updateCrest(player.pool);


	//====
	canvas.style.cursor = "default";
	var m = getUnitOnCursor(cursorX,cursorY);
	setStatePanelText("")
	if (m){
		setStatePanelText(m)
		if (m.player.num == player.num){
			canvas.style.cursor = "pointer";
		} else if (player.state == util.GAME_STATE_SELECT){
			canvas.style.cursor = "crosshair";
		}
	}

	var now = new Date().getTime(),
    //var dt = now - (time || now);
    time = now;


}



//socket.on('guard trigger', function(){
//	console.log("to guarding");
//})

var PLAYER_ID = -1;
var player;
var opponent;




var Second = 0;

function drawGame(){

	var now = Date.now();
	var delta = now - then;
	then = now;
	window.requestAnimationFrame(drawGame);
	Second += delta;
	//console.log(delta);
	if (Second >= 100){
		Second = 0;
		//console.log("one second");
		for (var i=0; i<EVENT_LIST.length; i++){

			if (EVENT_LIST[i].enabled && EVENT_LIST[i].trigger == TRIGGER_TIMEOUT) {
				EVENT_LIST[i].timeout += 100;
				if (EVENT_LIST[i].timeout >= EVENT_LIST[i].interval){
					EVENT_LIST[i].action();
					EVENT_LIST[i].timeout = 0;
				}

			}
		}
	}
	if (game){
		//console.log('rending')
		//render()
	}
}

//if (PLAYER_ID.isPlaying()) {
//	//PLAYER_ID.nextState();
//}

var main = function(){

	//requestAnimationFrame(main);
	//printCursor();

}
