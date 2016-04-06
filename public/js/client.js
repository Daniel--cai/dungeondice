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
var spellButton = [qButton, wButton, eButton, rButton]

var statPanel = document.getElementById("stat");
var crestPanel = document.getElementById("crest");
var dicePanel = document.getElementById("diceroll");
var playerPanel = document.getElementById("players")
var content = document.getElementById("content")

var actionState = util.PLAYER_STATE_NEUTRAL
var sendSwitch = true;
//var movePath = []
//var movementButton = document.getElementById("movement")

var ctx = canvas.getContext("2d");
content.hidden = true;
cancelButton.hidden = true

var squareSize = 30;
var boardXPadding = 0;
var boardYPadding = 50;

var animation = []
var controlLock = false;
var initUnit = 0;

//var util.boardSizeX = 13;
canvas.width = 1200;
canvas.height =680;

var CREST_MOVEMENT = 0;
var CREST_ATTACK = 1;
var CREST_DEFENSE = 2;
var CREST_MAGIC = 3;
var CREST_TRAP = 4;
var CREST_SUMMON = 5;

var CREST_TEXT = ["MOVEMENT", "ATTACK","DEFENSE", "MAGIC", "TRAP", "SUMMON" ]

var STAT_HP =0
var STAT_ATTACK = 1
var STAT_DEFENSE = 2


var IMAGES = {}
function ImageLoader(key, src){
	IMAGES[key] = new Image();
	IMAGES[key].src = src;
}

IMAGES['New Crest'] = [];
for (var i=0; i<6;i++){
	var image = new Image()
	image.src = 'assets/img/crest/'+ CREST_TEXT[i].toLowerCase() +'.png'
	IMAGES['New Crest'].push(image)
}
ImageLoader('Heart', 'assets/img/Health_Potion_item.png')
ImageLoader('Sword', 'assets/img/Long_Sword.png')
ImageLoader('Heart Grey',  'assets/img/Health_Potion_item_grey.png')
ImageLoader('Shield','assets/img/dshield.png')

ImageLoader('Crest', 'assets/img/championstats_icons.jpg')
ImageLoader('Lucian', 'assets/img/lucian.jpg')
ImageLoader('Lightslinger', 'assets/img/Lightslinger.png')
ImageLoader('LucianSquare', 'assets/img/LucianSquare.png')
ImageLoader('TeemoSquare', 'assets/img/TeemoSquare.png')
ImageLoader('Teemo', 'assets/img/teemo.jpg')
ImageLoader('Soraka', 'assets/img/soraka.jpg')
ImageLoader('SorakaSquare', 'assets/img/SorakaSquare.png')
ImageLoader('Garen', 'assets/img/garen.jpg')
ImageLoader('GarenSquare', 'assets/img/GarenSquare.png')
ImageLoader('Texture','assets/img/texture.jpg')
ImageLoader('Texture2','assets/img/texture2.jpg')
ImageLoader('UI', 'assets/img/border.png')
ImageLoader('UITEXTURE', 'assets/img/bgtexture.png')
ImageLoader('Runeterra', 'assets/img/runeterra.png')
ImageLoader('ButtonFrame', 'assets/img/buttonframe.png')
ImageLoader('Guard', 'assets/img/armor.png')
ImageLoader('Relentless Pursuit', 'assets/img/Relentless_Pursuit.png')
ImageLoader('Ardent Blaze', 'assets/img/Ardent_Blaze.png')
ImageLoader('Blinding Dart', 'assets/img/Blinding_Dart.png')
ImageLoader('Starcall', 'assets/img/Starcall.png')
ImageLoader('Piercing Light', 'assets/img/Piercing_Light.png')

ImageLoader('NasusSquare', 'assets/img/NasusSquare.png')
ImageLoader('Nasus', 'assets/img/Nasus.jpg')
ImageLoader('Siphoning Strike', 'assets/img/Siphoning_Strike.png')
ImageLoader('Spirit Fire', 'assets/img/Spirit_Fire.png')
ImageLoader('Soul Eater', 'assets/img/Soul_Eater.png')



var UNITS = {};
var SPELLS = {};
var BUFFS = {}
var PROPS = {}

BUFFS['Relentless Pursuit'] = function(){
	var buff = new Buff("Relentless Pursuit", 0);
	buff.stack = 0;
	buff.on('attack', function(event){
		buff.stack++;
	})
	return buff
}


BUFFS['Ardent Blaze'] =  function(){
	var buff = new Buff("Ardent Blaze", 1, true);
	buff.on('attacked', function(event){
		//console.log(event)
		var m = game.monsters[buff.owner]
		if (m.player.num == event.attacker.player.num){
			m.player.updatePool(CREST_MOVEMENT, 1)
		}
	})
	return buff;
}

BUFFS['Siphoning Strike'] = function(){
	var buff = new Buff("Siphoning Strike", 0);
	buff.stack = 3;
	buff.active = false;
	buff.on('attack', function(event){
		if (!buff.active) return
		var m = game.monsters[buff.owner]
		game.combat.atkmodifier += buff.stack*10;
		buff.active = false;
		console.log('Siphon')
	})
	buff.on('kill', function(event){
		console.log('kill',event)
		buff.stack++
	})
	return buff
}

PROPS['Spirit Fire'] = function (point, unit){
	var prop = new Prop("Spirit File", point,unit);
	prop.duration = 3;
	prop.on('collision', function(event){
		if (event.trigger.hasBuff('Spirit Fire') != util.EMPTY) return;
		ApplyBuff(prop.unit, event.trigger, BUFFS['Spirit Fire']())
	})

	prop.on('dies', function(event){
		console.log('prop removed')
	})

	prop.on('turn', function(event){
		prop.duration --;
		if (prop.duration <= 0) {
			prop.destroy();
		}
		var m = game.board.getUnitAtLoc(prop.x, prop.y)
		if (m == util.EMPTY) return;
		if (game.monsters[m].hasBuff('Spirit Fire') != util.EMPTY) return;
		console.log('reapply')
		ApplyBuff(prop.unit, game.monsters[m], BUFFS['Spirit Fire']())


	})
	return prop;
}

BUFFS['Spirit Fire'] = function(){
	var buff = new Buff("Spirit Fire",1);
	buff.on('apply', function(event){
			console.log('Spirit fire applied on', event.trigger.name)
			event.trigger.statmod[STAT_DEFENSE] -= 10;
	})
	buff.on('expire', function(event){
			console.log('Spirit Fire expired!')
			var m = game.monsters[buff.owner]
			m.statmod[STAT_DEFENSE] += 10
	})
	return buff;
}

BUFFS['Soul Eater'] = function(){
	var buff = new Buff('Soul Eater', 0);
	buff.on('attack', function(event){
		console.log('Soul eater +hp!')
		game.monsters[buff.owner].hp += 10;
		if (game.monsters[buff.owner].hp > game.monsters[buff.owner].maxhp)
		game.monsters[buff.owner].hp = game.monsters[buff.owner].maxhp

	})
	return buff;
}

SPELLS['Nasus'] = []

SPELLS['Nasus'][0] = new Spell('Siphoning Strike', [CREST_ATTACK, 2], "self")
SPELLS['Nasus'][0].on ('learn', function(event){
	ApplyBuff(event.trigger, event.trigger,BUFFS['Siphoning Strike']())
})

SPELLS['Nasus'][0].on ('effect', function(event){
	if (event.trigger.hasAttacked){
		console.log('unit already attacked')
		return;
	}
	spellButton[0].disabled = true;
	for (var i = 0; i < event.trigger.buff.length; i++){
		if (event.trigger.buff[i].name == 'Siphoning Strike'){
			event.trigger.buff[i].active = true;
		}
	}
})

SPELLS['Nasus'][1] = new Spell('Spirit Fire', [CREST_MAGIC, 2], "target")
SPELLS['Nasus'][1].on ('effect',function(event){
	PROPS['Spirit Fire'](event.location, event.trigger)
})

SPELLS['Nasus'][2] = new Spell ('Soul Eater', [CREST_MAGIC, 0], "passive")
SPELLS['Nasus'][0].on ('learn', function(event){
	ApplyBuff(event.trigger, event.trigger,BUFFS['Soul Eater']())
})


SPELLS['Lucian'] = []
SPELLS['Lucian'][0] = new Spell("Piercing Light", [CREST_ATTACK, 2],"target")
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
				//ApplyBuff(event.trigger, game.monsters[m],BUFFS['Ardent Blazer']() )
			}
		}

		//SPELLS['Lucian'][0].fire('finish', {trigger:event.trigger})

	}

})

SPELLS['Lucian'][1] = new Spell("Ardent Blaze", [CREST_MAGIC, 2],"target")
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
				ApplyBuff(event.trigger, game.monsters[m],BUFFS['Ardent Blaze']() )
				break;
			}
		}
	//SPELLS['Lucian'][1].fire('finish', {trigger:event.trigger})
	}
})
SPELLS['Lucian'][2] = new Spell("Relentless Pursuit", [CREST_MOVEMENT, 2],"target")
SPELLS['Lucian'][2].on('learn', function(event){
	//console.log('learnt relentless')
	//console.log(event)
	ApplyBuff(event.trigger, 	event.trigger, BUFFS['Relentless Pursuit']())

})

SPELLS['Lucian'][2].on('cast', function(event){
//	console.log('casting relentless puruist')

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
	player.movePath = player.movePath.concat(findStraightPath([x,y],[x+buff.stack+1,y]))
	player.movePath = player.movePath.concat(findStraightPath([x,y],[x-(buff.stack+1),y]))
	player.movePath = player.movePath.concat(findStraightPath([x,y],[x,y-(buff.stack+1)]))
	player.movePath = player.movePath.concat(findStraightPath([x,y],[x,y+buff.stack+1]))
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
	if (path.length> Math.min(buff.stack+1, 4)) return

	player.updatePool(CREST_MOVEMENT, -2)
	buff.stack = 0;
	console.log('casting relentless pursuit', event.location[0],event.trigger.x ,event.location[1] , event.trigger.y)
	if (!(event.location[0] == event.trigger.x || event.location[1] == event.trigger.y))  {console.log('Must target in a line'); return}

	var path = util.findPath(game.board,[event.trigger.x,event.trigger.y],event.location);
	console.log(path)
	event.trigger.movement(path)
	//SPELLS['Lucian'][2].fire('finish', {trigger:event.trigger})
})

SPELLS['Lucian'][3] = new Spell("Ardent Blaze", [CREST_MAGIC, 2],"target")

SPELLS['Lucian'][4] = new Spell('The Culling', [CREST_ATTACK,0], "target")
SPELLS['Lucian'][4].on('learn', function(event){
	//console.log('Learnt lightslinger')
	//ApplyBuff(event.trigger,event.trigger, BUFFS['Lightslinger']())
})


SPELLS['Teemo'] = []

SPELLS['Teemo'][0] = new Spell("Blinding Dart", [CREST_ATTACK, 2],"target")
SPELLS['Teemo'][1] = new Spell("Noxious Trap", [CREST_MAGIC, 2],"target")

SPELLS['Teemo'][0].on('effect',function(event){

	//var game = games[event.trigger.player.id]
	var id = game.board.getUnitAtLoc(event.location[0],event.location[1]);
	if (id == util.EMPTY) {console.log("Must target unit"); return };

	var target = game.monsters[game.board.getUnitAtLoc(event.location[0],event.location[1])]
	var buff = BUFFS['Blinding Dart']()
	ApplyBuff(event.trigger, target, buff)

	DamageUnit(event.trigger.id, target.id, 10);
	//SPELLS['Teemo'][0].fire('finish',{trigger:event.trigger})
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

	//SPELLS['Teemo'][1].fire('finish',{trigger:event.trigger})
})

BUFFS['Starcall'] =  function(){
	var buff = new Buff("Starcall", 1);
	return buff;
}

SPELLS['Soraka'] = [];
SPELLS['Soraka'][0] = new Spell("Starcall", [CREST_MAGIC, 2],"target")
SPELLS['Soraka'][0].on('effect',function(event){
	if (!event.target){
		console.log('No units in area')
		return
	}
	DamageUnit(event.trigger.id, event.target.id, 10);
	BUFF_SLOW(event.target, 1)
	ApplyBuff(event.trigger, event.target, BUFFS['Starcall']())
	//SPELLS['Soraka'][0].fire('finish',{trigger:event.trigger})
})

SPELLS['Soraka'][1] = new Spell("Astral Infusion", [CREST_MAGIC, 2],"target")
SPELLS['Soraka'][1].on('effect',function(event){
	if (event.trigger.hp == 10) {
		console.log('Not enough hp to cast');
		return
	}
	console.log(event.target)
	if (!event.target || event.target.id == event.trigger.id){
		console.log('Must target another unit')
		return;
	}

	if (event.target.player.num != event.trigger.player.num){
		console.log('Cannot heal enemy units');
		return;
	}
	event.target.hp = Math.min(event.target.hp + 10,event.target.maxhp);
	event.trigger.hp -= 10;
	//SPELLS['Soraka'][1].fire('finish',{trigger:event.trigger})
})


SPELLDESCRIPTION = {};

SPELLDESCRIPTION['Piercing Light'] = "Deal 20 damage 3 squares in front of Lucian. Can only be used if a target exists that is up to 2 squares away."

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
	spells: SPELLS['Soraka'],
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

UNITS['Nasus'] = {
	name: 'Nasus',
	hp: 40,
	atk: 10,
	def: 20,
	spells:SPELLS['Nasus'],
}

function Buff(name, duration){
	this.name = name;
	this.duration = duration;
	//this.durationcounter = duration;
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
	//console.log(point)
	this.x = point[0];
	this.y = point[1];
	this.name = name;
	this.unit = unit ? unit : util.EMPTY;
	this.clear = false;
	this.exist = true;
	this.callbacks = {}

	this.on = function(event, callback){

		this.callbacks[event] = callback;
	}

	this.fire = function(event){
		if (this.exist == false) return;
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
		this.exist = false;
		this.fire('dies', {})
		console.log('destroy')
	}

	this.id = game.props.length;
	game.props.push(this)
	if (player.num == game.turn%2){
		//conn.send({id:'new prop', name:name, point:point,unit:unit.id})
	}

	return this;
}


var BUFF_stun = new Buff("Stunned", 1);
var BUFF_silence = new Buff("Silenced", 1);
var BUFF_root = new Buff("Root", 1);
var BUFF_knock_up = new Buff("Knock Up", 1);

BUFFS['Lightslinger'] = function(){
	var buff = new Buff('Lightslinger', 0)
	//buff.active = false;
	buff.on('spell', function(event){
		//buff.active = true;
		event.trigger.hasAttacked = false;
	})

	//buff.on('attack',function(event){
	//	if (!buff.active) return;
	//})
	return buff;
}

BUFFS['Blinding Dart'] = function(){
	var buff = new Buff("Blinding Dart", 1);
	buff.on('attack', function(event){
		//console.log(event)
		game.combat.atkmodifier = 0;
		event.status.push('miss')
		console.log('missed!')
	})
	return buff;
}

PROPS['Toxic Mushroom'] = function (point, unit){
	var prop = new Prop("Toxic Mushroom", point,unit);
	prop.on('collision', function(event){
		DamageUnit(prop.unit.id,event.trigger.id, 10)
		BUFF_SLOW(event.trigger, 1)
		animation.push({type:'text', text:'Toxic Shroom!', color:white, x:prop.x*squareSize,y:(prop.y-1)*squareSize+boardYPadding, dy:-25,
		duration:0.75, onfinish: function(a,b){console.log(a,b)}, args:[1,'ab']})
		prop.destroy();
	})
	return prop;
}

function BUFF_SLOW(unit, movement){
	unit.impairment += movement;
	//games[unit.player.id].update('impairment', util.EMPTY, {unit: unit.id, point:movement})
}

function ApplyBuff (caster, target, buff){
	if (!caster) {console.log('caster null'); return false}
	if (!target) {console.log('target null'); return false}
	if (!buff) {console.log('buff null'); return false}
	for (var i = 0; i<target.buff.length; i++){
		if (target.buff[i].name == buff.name){
			target.buff.splice(i,1);
			break;
		}
	}
	target.buff.push(buff);
	buff.owner = caster.id;
	if (sendSwitch){
		//conn.send({id:'apply buff', caster:caster.id, target:target.id, buff: buff.name})
	}
	return true
	//console.log(buff.name)
	//games[target.player.id].update('buff unit',target.player.num, {target:target, buff:buff.name})
}



function Spell(name, cost,type){
	this.name = name;
	this.cost = cost;
	this.type = type
	this.cooldown = 1;
	this.type = type
	this.onEffect = () => console.log(this.name+'onEffect not implemented')

	this.callbacks = {}
	this.on = function(event, callback){
		this.callbacks[event] = callback;
	}


	this.on('finish', function(event){
		for (var i =0; i<event.trigger.buff.length; i++){
			event.trigger.buff[i].fire('spell', event)
		}
		//console.log('finishing spell')
		event.trigger.player.changeState(util.GAME_STATE_UNIT)
	})

	this.fire = function(event){
		if (!this.callbacks.hasOwnProperty(event)){
			if (event != 'learn')
				console.log(event, 'not implemented for', this.name)
			return;

		}
		var args = Array.prototype.slice.call( arguments );
		var topic = args.shift();
		//console.log('topic is',topic)
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

		if(num == 0){
			player.changeState(util.GAME_STATE_UNIT)
			game.createUnit(player,UNITS['Lucian'],[5,17])
		} else {
			player.state = util.GAME_STATE_END
			changeUIState(util.GAME_STATE_END)
			game.createUnit(player,UNITS['Teemo'],[4,17])

		}
			PROPS['Spirit Fire']([6,17], game.monsters[0])
		//console.log(window.player)
	});

	conn.on('data', function(data) {
		sendSwitch = false;
		console.log('Received', data);
		if (data.id == 'move unit'){
			//game.monsters[data.unit].moveUnit([data.x, data.y])
			game.monsters[data.unit].movement(data.path)
			opponent.updatePool(CREST_MOVEMENT,-data.path.length+1)
			opponent.animateDice(CREST_MOVEMENT)
			opponent.changeState(util.GAME_STATE_UNIT)
		} else if (data.id == 'select unit'){
			opponent.unitSelected = data.unit
		} else if (data.id == 'change state'){
			opponent.changeState(data.state)
			if (data.state == util.GAME_STATE_END){
				player.changeState(util.GAME_STATE_ROLL)
				changeUIState(util.GAME_STATE_ROLL)
			}
		} else if (data.id == 'update pool'){
			opponent.updatePool(data.crest, data.point)
		} else if (data.id == 'update tile'){
			opponent.updateTile(data.shape)
		} else if (data.id == 'make selection'){
			game.makeSelection(opponent);
		} else if(data.id == 'create unit'){
			game.createUnit(opponent,UNITS[data.unitid],data.point)
			//conn.send({id:, player:player,id:id,point:point})
		} else if (data.id == 'attack'){
			game.monsters[data.trigger].attack(game.monsters[data.target])
			if (data.guard){
				console.log('block damage?')
				yesButton.hidden = false;
				noButton.hidden = false;
			}
		} else if (data.id == 'spell effect'){
			console.log(opponent.unitSelected)
			var spell = game.monsters[opponent.unitSelected].spells[data.spell]
			var target = data.target != util.EMPTY ? game.monsters[data.target]: null
			var event = {trigger: game.monsters[opponent.unitSelected], location: data.location, target:game.monsters[data.target]};
			spell.fire('effect',event);
			spell.fire('finish', {trigger:event.trigger})
			//conn.send({id:'spell effect', spell:player.spell, location:[x,y]})
		} else if (data.id == 'guard response'){
			game.combat.guard(data.data)
			game.combat.postattack()
			changeUIState(util.GAME_STATE_UNIT)
		} else if (data.id == 'damage unit'){
			DamageUnit(data.trigger,data.target,data.damage)
		} else if (data.id == 'apply buff'){
			ApplyBuff(game.monsters[data.caster],game.monsters[data.target], BUFFS[data.buff]())
		} else if (data.id == 'new prop'){
			//console.log(PROPS[data.name])
			PROPS[data.name](data.point,game.monsters[data.unit]);
		} else if(data.id == 'end turn'){
			opponent.changeState(util.GAME_STATE_END);
			game.turn++;
			player.changeState(util.GAME_STATE_UNIT)
			for (var i=0;i<game.monsters.length; i++){
				for (var j=0; j<game.monsters[i].buff.length;j++){
					var buff = game.monsters[i].buff[j]
					if (buff.duration == 0) continue
					buff.duration--;
					if (buff.duration == 0){
						console.log('removing', buff.name,'from',game.monsters[i].type.name)
						game.monsters[i].removeBuff(buff.name)
					}
				}
			}
			for (var i=0; i<game.props.length; i++){
				game.props[i].fire('turn',{})
			}

		}
		sendSwitch = true;


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
	var tx = boardXPadding+target.x*squareSize;
	var ty = boardYPadding+target.y*squareSize;
	//console.log(tx,ty)
	if (damage > 0){
		animation.push({type:'text', text:'-'+damage, color:white, x:tx,y:ty, dy:-25, duration:0.75})

	}
	//var remove = false

	//games[trigger.player.id].update('damage', util.EMPTY, {trigger:trigger.id, target:target.id, damage:damage})
	if (sendSwitch){
		//conn.send({id:'damage unit', trigger:trig, target:targ, damage:damage,})
	}
	//console.log(trigger.type.name,'hit', target.type.name, 'for',damage)
	if (target.hp <= 0){
		var event = {target:target}
		for (var i=0; i<trigger.buff.length ;i++){
			trigger.buff[i].fire('kill', event)
		}
		var event = {attacker:trigger}
		for (var i=0; i<target.buff.length ;i++){
			target.buff[i].fire('dies', event)
		}

		target.destroy()
	}


}

function Combat(unit, target){
	this.unit = unit;
	this.target = target;
	this.atkmodifier = unit.atk;
	this.defmodifier = 0;
	this.guarded = false;

	this.guard = function(button){
			if (button == 1){
				target.player.updatePool(CREST_DEFENSE,-1);
				target.player.animateDice(CREST_DEFENSE)
				game.combat.defmodifier = game.combat.target.def;
				game.combat.guarded = true;
				var rx = boardXPadding+target.x*squareSize
				var ry = boardYPadding+target.y*squareSize
				animation.push({
					effect:'grow', image:IMAGES['Guard'],
					x:rx,y:ry, dx:30,dy:30, sx:30, sy:30,
					duration:0.75, fade:true,
				})
			}


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
		for (var i=0; i< this.target.buff.length; i++){
			this.target.buff[i].fire('attacked', event)
		}
		console.log('status',event.status)

		//conn.send({id:'combat resolution', status:status})
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

			//console.log("after attack " +this.target.hp)
			//game.update('attack', util.EMPTY, {trigger:this.unit.id, target:this.target.id, damage:dmg, guard: this.guarded, status:event.status})
			//sendAll(games[trigger.player.id], {id:'damage', trigger:trigger.id, target:target.id, remove: remove})

			//updateCrest();
		}

		this.unit.hasAttacked = true;
		this.unit.player.updatePool(CREST_ATTACK, -this.unit.atkcost);
		this.unit.player.animateDice(CREST_ATTACK)
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
	this.animx = point[0];
	this.animy = point[1];
	this.hp = type.hp;
	this.maxhp = type.hp;
	this.atk = type.atk;
	this.def = type.def;
	this.statmod = [0,0,0]
	this.player = player;
	if (level) this.level = level;
	this.hasAttacked = false;
	this.canAttacked = true;
	this.atkcost = 1;
	this.atkrange = 1;
	this.buff = []
	this.exist = true;
	this.impairment = 0;
	this.spells = type.spells;
	this.animations = [];



	//console.log(type.spells)

	//this.game = game;

	this.removeBuff = function(name){
		for (var i=0; i<this.buff.length;i++){
			if(this.buff[i].name == name){
				this.buff[i].fire('expire', {})
				this.buff.splice(i,1)
				break;
			}
		}
	}

	this.hasBuff = function(name){
			for (var i=0; i<this.buff.length;i++){
				if(this.buff[i].name == name){
					return i;
				}
			}
			return util.EMPTY;
	}

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
		//animation.combat = {attacker:this, target:target, dt:0, finish:false};
		//animation.push({image:IMAGES[this.name], x:0, y:0, dx:500, effect:'pan', duration:0.5})


		var event = {trigger:this, target:target}
		for (var i=0; i< this.buff.length; i++){
			this.buff[i].fire('attack',event);
		}

		if (sendSwitch){
			conn.send({id:'attack', trigger:this.id, target:target.id, guard:util.getCrestPool(target.player,CREST_DEFENSE) > 0})
		}
		if (util.getCrestPool(target.player,CREST_DEFENSE) > 0){
			console.log('waiting for opponent..guard')
			player.changeState(util.GAME_STATE_COMBAT)
			//game.combat.guard();
		} else {
			console.log('post attack')
			game.combat.postattack();
		}

		return true;
	}

	this.destroy = function(){
		console.log('Removing', this.name, this.id, 'hp:', this.hp)
		//var game = games[this.player.id]

		game.setUnitAtLoc(util.EMPTY, [this.x,this.y])
		//console.log('destroy',[this.x,this.y],util.getTileState(game.board,this.x,this.y))
		this.exist = false;
		//console.log(game.board.getUnitAtLoc(this.x,this.y))
		//game.monsters[this.id] = null
		//game.update('destroy unit', util.EMPTY, {unit:this, loc:[this.x,this.y]})
	}



	this.update = function(dt){

		if (this.animations.length == 0) return

		var move = this.animations[0];
		//console.log(move)
		var dx = move[0]- this.animx;
		var dy = move[1] -this.animy ;
		var ms = 10;

		//console.log(this.animx,move[0])
		//console.log(this.y,move[1])
		if (dx != 0){
				//console.log(dx/Math.abs(dx))
				this.animx = this.animx + dx/Math.abs(dx)*ms*dt;
				if (dx > 0 && this.animx >= move[0] || dx < 0 && this.animx <= move[0]){
					this.animations.shift();
					//this.x = move[0]
					this.animx = move[0]
					//console.log('popped!')

				}
		} else if (dy != 0){
			this.animy = this.animy + dy/Math.abs(dy)*ms*dt;
			if (dy > 0 && this.animy >= move[1] || dy < 0 && this.animy <= move[1]){
				this.animations.shift();
				//this.y = move[1]
				this.animy = move[1]
					//console.log('popped!')
			}

		} else {
			console.log('shift!')
			this.animations.shift();
		}
		//console.log(this.animx,this.animy)
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
			animation.push({type:'move unit', unit:this, path:path , px:this.x, py:this.y, speed:5, duration:200})
			/*
			for (var i=1; i<path.length; i++){
				//console.log(path[i])
				this.moveUnit(path[i])
					//console.log('moved!')
			}

			if (this.exist == false) return;
			game.setUnitAtLoc(util.EMPTY,[this.x, this.y])
			game.setUnitAtLoc(this.id,path[plen-1])
			*/
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

			cursorX = Math.floor((e.pageX-boardXPadding)/squareSize);
		  cursorY = Math.floor((e.pageY-boardYPadding)/squareSize);

		    Event_Button_Focus(e.pageX-boardXPadding, e.pageY-boardYPadding);

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
			Event_Button_Click(e.pageX- boardXPadding, e.pageY-boardYPadding);

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
		if (player.tileSelected && player.tileSelected.length > 0 && player.valid){
			//animation.push({type:'tile place'})
			var cshape = rotateShape(this.shape,this.rotate);
			for (var i=0; i<6; i++){
				x = player.tileSelected[i][0];
				y = player.tileSelected[i][1];
				this.board.setTileState([x,y],player.num);
			}
			//this.tileSelected = [];
			if (sendSwitch){
				conn.send({id:'make selection'})
			}
			player.changeState(util.GAME_STATE_UNIT)
			return true;

		}
		//console.log('return fasle')
		return false
	}

	this.setUnitAtLoc = function(unit, point){
		console.assert(point[0] != undefined, 'setUnitAtLoc: null X value')
		console.assert(point[1] != undefined,'setUnitAtLoc: null Y value')
		this.board.units[point[1]][point[0]] = unit;
		//console.log('setting points', point, unit)
		if (unit != util.EMPTY){
			this.monsters[unit].x = point[0]
			this.monsters[unit].y = point[1]
		}
		//console.log('setting', unit,'to',point)

		//this.update('unit location', util.EMPTY, {unit:unit, loc:point})
	}

	this.createUnit = function (player, id, point){
			if (!id) return;
			//console.log(id.name)
			var u = new Unit(player, id, point);
			this.monsters.push(u);
			u.id = this.monsters.length-1;
			//this.board.units[point[1]][point[0]] = u.id;
			//this.update('create unit', player.num, u)
			var temp = sendSwitch
			sendSwitch = false;
			for (var i = 0; i< u.spells.length; i++){1
				u.spells[i].fire('learn', {trigger:u})
			}
			sendSwitch = temp;

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
			if (sendSwitch){
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
	this.type = type;
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
					[[CREST_SUMMON,1],
					 [CREST_SUMMON,1],
					 [CREST_SUMMON,1],
					 [CREST_SUMMON,1],
					 [CREST_ATTACK,1],
					 [CREST_MAGIC,3]]);


DICES['Poppy'] = new Dice(UNITS['Poppy'],
					[[CREST_SUMMON,1],
					 [CREST_SUMMON,1],
					 [CREST_SUMMON,1],
					 [CREST_MOVEMENT,1],
					 [CREST_TRAP,3],
					 [CREST_ATTACK,1]]);

DICES['Garen'] = new Dice(UNITS['Garen'],
					[[CREST_SUMMON,1],
					 [CREST_SUMMON,1],
					 [CREST_DEFENSE,1],
					 [CREST_SUMMON,1],
					 [CREST_SUMMON,1],
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
			//this.tiles[i].push(0);
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
		console.assert(x != undefined, 'getUnitAtLoc: null X value')
		console.assert(y != undefined,'getUnitAtLoc: null Y value')
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
	this.dices = [DICES['Lucian'],DICES['Lucian'],DICES['Teemo'],DICES['Teemo'],DICES['Teemo'],
								DICES['Soraka'],DICES['Soraka'],DICES['Soraka'],DICES['Soraka'],DICES['Soraka'],
								DICES['Garen'],DICES['Garen'],DICES['Garen'],DICES['Garen'],DICES['Garen']];

	this.diceButtonFocus = -1;

	this.spell = util.EMPTY;

	this.animateDice = function(crest,delay){
		var size = 25
		var gap = 10
		var x = 500
		var y = this.num == player.num ? 50 : 400;
		y+i*(size+gap)
		animation.push({
			effect:'grow', image:IMAGES['New Crest'][crest],
			x:x,y:y+(crest)*(size+gap)+boardYPadding, dx:20,dy:20, sx:size, sy:size,
			duration:0.75, fade:true,delay:delay
		})
	}

	this.updatePool = function(crest, point){

		this.pool[crest] += point;


		//console.log('update pool')
		//if (sendSwitch)
			//conn.send({id:'update pool', crest:crest, point:point})
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
		if (this.tileSelected == null) this.tileSelected = []
		//console.log('update tile')
		this.valid = game.board.validPlacement(this)
		//console.log(shape)
		//console.log('setting', this.num, this.valid)
		if (sendSwitch && shape){
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
		if (state != util.GAME_STATE_COMBAT){
			this.unitSelected = util.EMPTY;
		}
		this.movePath = []
		this.tileSelected = []
		this.spell = -1;


		changeUIState(state)

	}

	this.changeActionState = function(state){
		this.actionstate = state;
	}

	this.endTurn = function (){
		//sockets[this.id].send(JSON.stringify({data:'alert', data:"End Phase"}));

		console.log('end turn')
		this.changeState(util.GAME_STATE_END);

		game.turn++;
		this.rolled = false;
		this.summon = [];
		this.summonchoice = util.EMPTY;
		this.summonlevel = 0;
		this.shape = 0;
		this.rotate = 0;
		this.valid = false;
		this.spell = util.EMPTY
		this.unitSelected = util.EMPTY

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
		//this.changeState(util.GAME_STATE_ROLL);
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
			result.push(r)


			if (r[0] != CREST_SUMMON){
				//console.log(this.pool);
				//this.updatePool(r[0],r[1])
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
			//result = summon[summonlevel]
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


		var m = game.board.getUnitAtLoc(x,y)
		if (this.unitSelected == m) {
			this.changeState(util.GAME_STATE_UNIT);
			conn.send({id:'select unit', unit:util.EMPTY})

		} else if (game.monsters[m].player.num==this.num){
			this.changeState(util.GAME_STATE_SELECT);
			this.unitSelected = m;
			conn.send({id:'select unit', unit:m})
			//animation.push({type:'message', text:'End Phase', color:red,x:-200,y:250,speed:1000,  duration:2})
			disableSpell(true)
			if (player.num == this.num){
				for (var i = 0; i<4;i++){
					if (game.monsters[m].spells[i]){
						spellButton[i].innerHTML = game.monsters[m].spells[i].name
						spellButton[i].hidden = false;
						if (game.monsters[m].spells[i].type != "passive")
						spellButton[i].disabled = false;
					}
				}
				if (game.monsters[m].spells[4]){
					passiveButton.innerHTML = game.monsters[m].spells[4].name
					passiveButton.disabled = true
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
		//player.spell = util.EMPTY
}

function disableButtons(a,b){
		rollButton.disabled = a;
		endturnButton.disabled = b;
}

function changeUIState(state){
	console.log('Phase',GAME_STATE_TEXT[state])

	if (state == util.GAME_STATE_COMBAT){
			player.movePath = []
			disableButtons(true,true)
			return;
	}

	disableSpell(true)
	rollButton.hidden = true;

	for (i=0;i<15;i++) DicePool[i].hidden = true;
	if (state == util.GAME_STATE_ROLL){
		rollButton.hidden = false;

		for (i=0;i<15;i++) DicePool[i].reset();
		for (i=0; i<15; i++){
			//console.log(i)
			if (player.dices[i]){
				DicePool[i].hidden = false;
			}
		}
	}
  if (state == util.GAME_STATE_END){
  	disableButtons(true,true)
		//for (i=0;i<15;i++) Buttons[i].reset();
		DiceSelection = [];
	}

	//UI
	yesButton.hidden = true;
	noButton.hidden = true;


	disableButtons(true,true)

	if (player.state == util.GAME_STATE_SUMMON ){
		/*
		for (i=0;i<15;i++) DicePool[i].reset();
		console.log('summon', player.summon)
		for (i=0;i<player.summon.length;i++) {
			DicePool[player.summon[i]].toggle = true;
			DicePool[player.summon[i]].focus = true;
		}
		*/
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
		ctx.font = "13px Arial";
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
		ctx.font = "13px Arial";
		ctx.fillText(AlertText,225, 225 )
		//ctx.fillText("x"+p[1],400 + j* 28+15,255 + i*30+30);
	}
	ctx.globalAlpha = 1;
}

function drawButton(){
	/*
	var grd = ctx.createLinearGradient(0, 0.000,0, 300);
	grd.addColorStop(0.3, 'rgba(255, 235, 204, 1.000)');
	grd.addColorStop(1.000, 'rgba(255, 153, 0,1)');

	//ctx.fillStyle = grd;
	ctx.strokeStyle = white;
	ctx.fillRect(0,200,canvas.width*0.5,canvas.height*0.4);
	ctx.strokeRect(0,200,canvas.width*0.5,canvas.height*0.4)
		*/

	for (var i=0;i<Buttons.length;i++){
		ctx.globalAlpha = 1
		if (!Buttons[i].hidden) Buttons[i].render()
	}

}



var DicePattern;

function drawDicePattern(){
	var count = 0
	var xpad = 110;
	var ypad = 260
	var xgap = 30;
	var txgap =9;
	var tygap =20;
	if (DicePattern == null) return;
	for (var j=0; j<6; j++){
		var p = DicePattern.pattern[j];
		//console.log(p[0])

		//drawCrest(p[0], xpad +j*30, ypad + i*30, 25, 25)
		ctx.fillStyle = white
		ctx.strokeStyle = black
		ctx.drawImage(IMAGES['New Crest'][p[0]],xpad +j*xgap, ypad, 25, 25)
		ctx.font = "bolder 20px Arial ";
		ctx.lineWidth = 1;
		//if (p[0] == 5) {
			ctx.fillText(p[1],xpad + j* xgap+txgap ,ypad+ tygap);
			ctx.strokeText(p[1],xpad + j* xgap+txgap ,ypad + tygap);
		//} else {
		//	ctx.fillText("x"+p[1],xpad + j* 28+20,ypad+35);
		//	ctx.strokeText("x"+p[1],xpad + j* 28+20,ypad+35);
		//}

	}

}
function changeCursor(cursor){
	console.log("sdf");
	canvas.style.cursor = cursor;

	//body.cursor = cursor;
}

var Event_Button_Focus = function(x,y){
	//player.diceButtonFocus = -1
	for (var i=0;i<Buttons.length; i++){
		var b = Buttons[i];
		if (b.hidden) continue;
		if (x >= b.x && x <= b.sx+b.x && y >= b.y && y <= b.sy+b.y) {
			b._onFocus(x,y);
		} else {
			b._onUnfocus(x,y);

		}

	}
	//render();

}



var Event_Button_Click = function(x,y){

	for (var i=0;i<Buttons.length; i++){
		var b = Buttons[i];
		if (b.hidden) continue;
		if (x >= b.x && x <= b.sx+b.x && y >= b.y && y <= b.sy+b.y) {
			if (b.onClick) b.onClick(x,y)
		}
	}

}

var summonToggle;

function Button(id, img, x, y,sx,sy,unit){
	this.rx = x;
	this.ry = y;
	this.x = x;
	this.y = y;

	this.sx = sx;
	this.sy = sy;
	//console.log(this.sx,this.sy)
	this.hidden = false;
	this.toggle = false;
	this.focus = false;
	this.unfocus = false;
	this.id = id;
	this.img = img;
	this.unit = unit;
	//this.unit = unit;

	this.reset = function(){
		this.toggle = false;
		this.focus = false;
		this.unfocus = false
		//icePattern = [];
	}

	this._onFocus = function(x,y){
		if (this.focus) return;
		if (this.onFocus) this.onFocus();
		this.focus = true;
		//console.log(x,y, b.x, b.y, b.wx, b.hy)
		if (player.state == util.GAME_STATE_ROLL){
			//changeCursor("pointer")

			//console.log(this.id)
			//DicePattern = [];
			//DicePattern.push(player.dices[0])

		}
		//render();

	}
	this._onUnfocus = function(x,y){
		if (!this.focus) return;
		if (this.onUnfocus) this.onUnfocus()
		this.focus = false;
		//if (this.toggle) return;
		//changeCursor("default")
		//changeCursor("pointer")
		if (player.state == util.GAME_STATE_ROLL){
			//DicePattern = [];
		}
		//render();
	}

	this.img = img;
	//this
			//ctx.drawImage(IMAGES['ButtonFrame'],this.rx-(mod*4),this.ry-(mod*4), this.sx+8*mod,this.sy+8*mod)
		//} else {
			/*
			drawCrest(CREST_SUMMON, this.rx,this.ry, this.sx, this.sy)
			ctx.fillStyle = black;
			var lvl = player.dices[this.id].pattern[0][1]
			ctx.fillText(lvl,this.rx+15,this.ry+21);
			ctx.drawImage(IMAGES['ButtonFrame'],this.rx,this.ry,this.sx, this.sy)
			*/
		//}
		//ctx.globalAlpha = 1;
	Buttons.push(this);
	return this;
}

var DicePool = []
var DiceSelection = []
var DiceButtonSize = 40;
var SummonPool = []

var CREST_MOVEMENT = 0;
var CREST_ATTACK = 1;
var CREST_DEFENSE = 2;
var CREST_MAGIC = 3;
var CREST_TRAP = 4;
var CREST_SUMMON = 5;

var CREST_TEXT = ["MOVEMENT", "ATTACK","DEFENSE", "MAGIC", "TRAP", "SUMMON" ]


for (var i=0; i<3; i++){
	for (var j=0;j<5;j++){
		//console.log((i*3)+j)
		var b = new Button((i*5)+j,IMAGES['New Crest'][CREST_SUMMON], 75+(DiceButtonSize+15)*j,300+(DiceButtonSize+15)*i, DiceButtonSize,DiceButtonSize)

		b.onUnfocus = function(){
			if (player.diceButtonFocus == this.id){
				player.diceButtonFocus = -1
				DicePattern = null
			}

		}
		b.onFocus = function(){
			//if (player.state != util.GAME_STATE_ROLL) return

			player.diceButtonFocus = this.id
			DicePattern = player.dices[this.id]
			//console.log(DicePattern)
		}

		b.onClick = function(x,y){
			if (player.state != util.GAME_STATE_ROLL) return;
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
			for (var i=0; i<DicePool.length; i++){
				DicePool[i].unfocus = false;
			}

			if (DiceSelection.length == 3){
				disableButtons(false,true)

				for (var i=0; i<15; i++)
					DicePool[i].unfocus = true;
			}
		}

		b.render = function(){
			ctx.globalAlpha = 1;
			var mod = 0;
			if (this.unfocus){
				ctx.globalAlpha = 0.1;
			}

			if (this.focus){
				mod = 0;
			}

			if (this.toggle){
				ctx.globalAlpha = 0.5;
				if (player.state == util.GAME_STATE_ROLL){
					ctx.fillStyle = black;
				}
				ctx.fillRect(this.rx-(mod*4),this.ry-(mod*4), this.sx+8*mod,this.sy+8*mod);
			}
			//drawCrest(CREST_SUMMON, this.rx-mod,this.ry-mod, this.sx+(2*mod), this.sy+(2*mod))
			ctx.drawImage(this.img,  this.rx-mod,this.ry-mod, this.sx+(2*mod), this.sy+(2*mod))
			//var lvl = player.dices[this.id].pattern[0][1]
			var lvl = 4;
			ctx.fillStyle = white;
			ctx.strokeStyle = black;
			ctx.lineWidth = 1;
			ctx.font = "bolder 20px Arial";
			ctx.strokeText(lvl,this.rx+11,this.ry+24);
			ctx.fillText(lvl,this.rx+11,this.ry+24);
		}

		//console.log(b.id)
		DicePool.push(b);
	}
}

for (var i=0;i<3;i++){
	var b = new Button(i, IMAGES['New Crest'][CREST_SUMMON], 100+boardXPadding + 75*i,150+boardYPadding,50,50)
	b.onClick = function(x,y){
		if (player.state != util.GAME_STATE_SUMMON) return;
		if (player.tileSelected.length > 0 ) return;
		player.summonchoice = DiceSelection[this.id].id;
		console.log('summoinining', player.summonchoice)
			//player.dices[player.summonchoice]
		player.updateTile(player.updateShape(cursorX,cursorY))
		SummonPool[0].hidden = true;
		SummonPool[1].hidden = true;
		SummonPool[2].hidden = true;
		DiceSelection = []
		//SummonPool = []
	}

	b.onFocus = function(){
		//console.log('summon buttons ',this.id, DiceSelection[this.id].id)
	}
	b.render = function(){
		//if (player.state != util.GAME_STATE_SUMMON) return;
		//var l = DiceSelection.length
		//if (l <= this.id) return;
		//drawText(player.dices[DiceSelection[this.id].id].type.name, '20px Arial bolder', 200+ 50*this.id,200)
		ctx.drawImage(IMAGES[player.dices[DiceSelection[this.id].id].type.name+'Square'], this.x ,this.y, this.sx,this.sy )
	}
	b.hidden = true;
	SummonPool.push(b)
}

//colours
var blue    = "#000099";
var red = "#990000";
var purple  = "#990099";
var white = "#ffffff";
var black = "#000000"

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
	crestPanel.innerHTML = 	"<img src=assets/img/crest/movement.png height='20px' width='20px'>" + pool[CREST_MOVEMENT]+ "<br>" +
						"<img src=assets/img/crest/attack.png height='20px' width='20px'>" + pool[CREST_ATTACK] +"<br>" +
						"<img src=assets/img/crest/defense.png height='20px' width='20px'>" + pool[CREST_DEFENSE] +"<br>" +
						"<img src=assets/img/crest/magic.png height='20px' width='20px'>" + pool[CREST_MAGIC] +"<br>" +
						"<img src=assets/img/crest/trap.png height='20px' width='20px' >" + pool[CREST_TRAP] +"<br>";

}



function spellButtonEffect(button){
	if (player.state != util.GAME_STATE_SELECT) return;
	var spell = game.monsters[player.unitSelected].spells[button]
	if (!spell) return
	if (spell.type == "self"){
		//socket.send(JSON.stringify({ id:'cast', data:button}));
		console.log('no target spell')
		var event = {trigger: game.monsters[player.unitSelected]};
		conn.send({id:'spell effect', spell:button, location:[-1,-1], target:-1})
		spell.fire('effect',event);
		spell.fire('finish', {trigger:event.trigger})

	} else {
		player.spell = button;
		//console.log('player spell now',player.spell)
		var name = game.monsters[player.unitSelected].name
		if (player.pool[SPELLS[name][button].cost[0]] < SPELLS[name][button].cost[1]){
			console.log('Not enough', CREST_TEXT[SPELLS['Lucian'][2].cost[0]], 'to cast', SPELLS['Lucian'][2].name)
			player.spell = -1;
		} else {
			game.monsters[player.unitSelected].spells[button].fire('cast', {trigger:game.monsters[player.unitSelected]})
			disableSpell(true)
			cancelButton.hidden = false;
		}
	}

}

function responseButton(button){
	conn.send({id:'guard response', data:button})
	sendSwitch = false;
	if (!game.combat){
		console.log('Error: null combat')
		return;
	}
	game.combat.guard(button)
	game.combat.postattack()
	sendSwitch = true;
	yesButton.hidden = true;
	noButton.hidden = true;
	//socket.send(JSON.stringify({ id:'guard response', data:button}));
}
yesButton.addEventListener("click", function(){
	responseButton(1)
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
	disableSpell(false)
	cancelButton.hidden = true;
	var m = game.monsters[player.unitSelected]
	player.movePath = util.findPossiblePath(game.board,[m.x, m.y],exports.getCrestPool(player,CREST_MOVEMENT)-m.impairment)
})


endturnButton.addEventListener("click", function(){
	//socket.send(JSON.stringify({id:'end turn'}));
	player.endTurn();
	conn.send({id:'end turn'})
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
    var result = player.onRoll(data)

		var size = 50;
		var duration = 0.25
		var sxy = size*(1/duration)
		var x = 100+boardXPadding+size/2
		var dx = 75;
		var y =  200+boardYPadding+size/2
	//animation.push({type:'fade dice', crest:result[0], x:25, y:50, duration:4.5, size:size})
		//animation.push({type:'fade dice', crest:result[1], x:100, y:50, duration:4.5, size:size})
		//animation.push({type:'fade dice', crest:result[2], x:175, y:50, duration:4.5, size:size})

		var onfinish = function(result){

			for (var i = 0; i<result.length; i++){
				if (result[i][0] != CREST_SUMMON){
					//player.animateDice(result[0])
					player.updatePool(result[i][0],result[i][1])
				}
			}
		}

		var ongrow = function(i){
			//console.log(SummonPool)
			if (!SummonPool[i]){
				console.log('ongrow summonpool error')
				return;
			}
			//console.log(DiceSelection[i])
			console.log('unhiding button')
			SummonPool[i].hidden = false;
		}

		for (var i =0; i <3; i++){
			animation.push({
				effect:'grow', image:IMAGES['New Crest'][result[i][0]],
				x:x+i*dx,y:y, dx:0,dy:0, sx:size, sy:size,
				duration:3.5, fade:false, text:result[i][1],tx:18,ty:35
			})

			animation.push({
				effect:'grow', image:IMAGES['New Crest'][result[i][0]],
				x:x+i*dx,y:y, dx:-sxy,dy:-sxy, sx:size, sy:size,
				duration:duration, fade:false, delay:3.5
			})

			animation.push({type:'dice', speed:1, accel:5, x:x+i*dx,y:y, size:size,
											duration:2+i*0.5, index:0, dice:player.dices[data[i]].pattern})

			if (i == 2) {
				animation[animation.length-1].onfinish = onfinish
				animation[animation.length-1].args = [result]
			}

			if (result[i][0] != CREST_SUMMON) continue
			//console.log(player.summon)
			/*
			animation.push({
				effect:'grow', image:IMAGES['LucianSquare'],
			x:x+i*dx,y:y, dx:0,dy:0, sx:size, sy:size,
				duration:10, fade:false, delay:3+duration+.5
			})
			*/

			if (player.summon.length == 0) continue
			animation.push({
				effect:'grow', image:IMAGES[player.dices[DiceSelection[i].id].type.name+'Square'],
				x:x+i*dx,y:y, dx:sxy,dy:sxy, sx:0, sy:0, msx:size, msy:size,
				duration:duration, fade:false, delay:3.5,onfinish:ongrow, args:[i]
			})



		}

		/*
		animation.push({type:'dice', speed:0.4, accel:5, x:100,y:50, size:size,
										duration:2.5, index:0, dice:player.dices[data[1]].pattern})
		animation.push({type:'dice', speed:0.4, accel:5, x:175,y:50, size:size,
										duration:3, index:0, dice:player.dices[data[2]].pattern,onfinish:onfinish,args:result})

*/
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
				ctx.strokeStyle = white
				ctx.drawImage(IMAGES['Texture'],x*squareSize,y*squareSize, squareSize,squareSize)
			} else if (getBoardState(i,j) == util.PLAYER_2){
				ctx.fillStyle = blue;
				ctx.strokeStyle = white
				ctx.drawImage(IMAGES['Texture2'],x*squareSize,y*squareSize, squareSize,squareSize)
			} else {
				continue;
			}


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
		if (p.exist == false){
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
		var bordersize = 0;
		if (player.unitSelected == m.id || opponent.unitSelected == m.id){
			w = 3;
			bordersize = 6;
		}
		var x = m.x
		var y = m.y

		ctx.fillStyle = black;
		if (m.player.num == 1){
			//ctx.fillStyle = blue;
		}
		if (player.num != m.player.num){
			//x = util.boardSizeX-x-1
			//y = util.boardSizeY-y-1
			//ctx.fillStyle = purple;

			//ctx.rotate(Math.PI/180);
		}
		//

		if (IMAGES[m.name+'Square']){
			var nx = x*squareSize+bordersize/2;
			var ny = y*squareSize+bordersize/2
			var s = squareSize-bordersize
			var angle = Math.PI
			//console.log(angle)
			ctx.fillRect(x*squareSize,y*squareSize,squareSize,squareSize);
			//ctx.strokeRect(x,y,squareSize,squareSize);
			if (m.player.num == opponent.num){
				ctx.translate(nx,ny)
				ctx.rotate(angle);
				ctx.drawImage(IMAGES[m.name+'Square'],-s,-s,s,s);
				ctx.rotate(-angle);
				ctx.translate(-nx,-ny)
			} else {
					ctx.drawImage(IMAGES[m.name+'Square'],nx,ny,s,s);
			}
		} else {
			drawCircle(x, y,w, m.player);
		}

		if (player.num != m.player.num){
			//x = util.boardSizeX-x-1
			//y = util.boardSizeY-y-1
			//ctx.fillStyle = purple;

			//ctx.rotate(-Math.PI/180);
		}
		//ctx.drawImage('assets/img/LucianSquare.png',x,y)
		//

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

		//remove comment
		//if (game.turn%2 != player.num) return
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
		//if (game.turn%2 != player.num) return
		if (controlLock) return;
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
					var m = game.board.getUnitAtLoc(x,y)
					var target = m != util.EMPTY ? game.monsters[m] : null
					//console.log(target.name)
					var event = {trigger: game.monsters[player.unitSelected], location: [x,y], target:target};
					conn.send({id:'spell effect', spell:player.spell, location:[x,y], target:m})
					spell.fire('effect',event);
					spell.fire('finish', {trigger:event.trigger})
     		} else if (u == util.EMPTY){
     			//socket.send(JSON.stringify({id:'mouse click', data:{state:'move', loc:[x, y]}}))
 					if (game.board.getTileState(x, y) != util.EMPTY){
	 					console.log('moving')
						var m = game.monsters[player.unitSelected]
						var path = util.findPath(game.board,[m.x,m.y],[x,y]);
						var plen = path.length
						if (plen > 1 && plen-1 <= player.getCrestPool(util.CREST_MOVEMENT) - m.impairment) {
	 						m.movement(path)
							conn.send({id:'move unit', unit:m.id, path:path})
							player.updatePool(CREST_MOVEMENT,-plen+1)
							player.animateDice(CREST_MOVEMENT)
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
					//DicePool[player.summonchoice].hidden = true;
					player.dices[player.summonchoice] = null;
					//SummonPool = []
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
			//console.log('breaking at', xi,yi)
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

var then


var CrestCoord = [[290,100],[72,32],[217,35],[144,34],[217,163],[143,229]]
function drawCrest(crest, x,y, sx, sy){
	//var size = wx;
	/*
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
	*/
		ctx.drawImage(IMAGES['Crest'], CrestCoord[crest][0],CrestCoord[crest][1],35,35,x,y,sx,sy)
	/*
	if (crest == CREST_SUMMON){
		ctx.drawImage(IMAGES['Crest'],143,229,35,35, x, y, sx, sy);
	} else if (crest == CREST_MOVEMENT){
		ctx.drawImage(IMAGES['Crest'],290,100,35,35, x, y, sx, sy);
	} else if (crest == CREST_MAGIC){
		ctx.drawImage(IMAGES['Crest'],144,34,35,35, x, y, sx, sy);
	} else if (crest == CREST_ATTACK){
		ctx.drawImage(IMAGES['Crest'],72,32,35,35, x, y, sx, sy);
	} else if (crest == CREST_DEFENSE){
		ctx.drawImage(IMAGES['Crest'],217,35,35,35, x, y, sx, sy);
	} else if (crest == CREST_TRAP){
		ctx.drawImage(IMAGES['Crest'],217,163,35,35, x, y, sx, sy);
	}
	*/
}


var time;



function drawUIFrame(){
	ctx.globalAlpha = 1
	ctx.drawImage(IMAGES['Runeterra'], 0,0, canvas.width,canvas.height)
	ctx.globalAlpha = 1
	var w = 20;
	/*
	for (var i=w*2; i<canvas.width-w*2; i=i+w*2){
		ctx.drawImage(IMAGES['UI'],75,5,40,20,i,0,w*2,w)
	}

	for (var i=w*2; i<canvas.height-w*2; i=i+w*2){
		ctx.drawImage(IMAGES['UI'],5,82,20,40,canvas.width-w,i,w,w*2)
	}

	for (var i=w*2; i<canvas.height-w*2; i=i+w*2){
		ctx.drawImage(IMAGES['UI'],163,82,20,40,0,i,w,w*2)
	}

	for (var i=w*2; i<canvas.width-w*2; i=i+w*2){
		ctx.drawImage(IMAGES['UI'],80,166,40,20,i,canvas.height-w,w*2,w)
	}
	ctx.drawImage(IMAGES['UI'],5,5,40,40,0,0,w*2,w*2)
	ctx.drawImage(IMAGES['UI'],143,5,40,40,canvas.width-w*2,0,w*2,w*2)
	ctx.drawImage(IMAGES['UI'],5,146,40,40,0,canvas.height-w*2,w*2,w*2)
	ctx.drawImage(IMAGES['UI'],143,146,40,40,canvas.width-w*2,canvas.height-w*2,w*2,w*2)
	*/
}

function drawAnimation(dt){
	var splice = [];
	controlLock = true
	if (animation.length == 0) controlLock = false
	for (var i=0;i<animation.length;i++){
		var a = animation[i];
		if (a.delay) a.delay -= dt;
		if (a.delay >= 0) continue

		if (a.type == 'tile place'){
			//console.log(player.tileSelected)
		} else if (a.type == 'move unit'){
			//console.log(a.path)
			if (a.path.length > 0 && a.unit.exist){
				var move = a.path[0];
				var dx = move[0] - a.px;
				var dy = move[1] - a.py ;
				//console.log(dx,dy)
				//console.log(this.animx,move[0])
				//console.log(this.y,move[1])
				var finish = false;
				if (dx != 0){
						a.unit.x = a.unit.x + dx/Math.abs(dx)*a.speed*dt;
						//console.log(dx/Math.abs(dx)*a.speed*dt)
						if (dx > 0 && a.unit.x >= move[0] || dx < 0 && a.unit.x <= move[0]){
							finish = true;
						}
				} else if (dy != 0){
					a.unit.y = a.unit.y + dy/Math.abs(dy)*a.speed*dt;
					if (dy > 0 && a.unit.y >= move[1] || dy < 0 && a.unit.y <= move[1]){
							finish = true;
					}
				} else {
					console.log('same location')
					finish = true;
				}
				if (finish){
					a.path.shift();
					game.setUnitAtLoc(util.EMPTY,[a.px, a.py])
					game.setUnitAtLoc(a.unit.id,move)
					var event = {trigger: a.unit, location: move}
					for (var j=0; j<game.props.length; j++){
						if (game.props[j] && game.props[j].x == move[0] && game.props[j].y == move[1]){
							game.props[j].fire('collision',event);
						}
					}

					splice.push(i)
					animation.push({type:'move unit', unit:a.unit, path:a.path , px:a.unit.x, py:a.unit.y, speed:a.speed, duration:200})

				}
			} else {
				splice.push(i)
			}
		} else if (a.type == 'dice'){
			//animation.push({id:'dice', speed:0.1, accel:1, x:50,y:50, size:50,delay:0.5, duration:2, index:0)
				if (a.speed < 20)
				a.speed = a.speed+a.accel*dt
				a.index = (a.index + dt*a.speed)%6;
				var crest = a.dice[Math.floor(a.index)][0];
				var nextcrest = a.dice[(Math.floor(a.index)+1)%6][0]
				//console.log(a.index)
				//console.log(a.index)
				//ctx.drawImage(IMAGES['Crest'], CrestCoord[crest][0],CrestCoord[crest][1],35,35,x,y,sx,sy)
				var size = a.size *  (1-a.index+Math.floor(a.index))
				ctx.translate(a.x-a.size/2,a.y-a.size/2)
				//ctx.drawImage(IMAGES['New Crest'][crest], 0,35*(a.index-Math.floor(a.index)),35,35*(a.index-Math.floor(a.index)),0,0,a.size,size)
				//ctx.drawImage(IMAGES['New Crest'][nextcrest],0 ,35,35,0,a.size*(1-a.index+Math.floor(a.index)),a.size,a.size *  (a.index-Math.floor(a.index)))
				ctx.drawImage(IMAGES['New Crest'][crest],0,0,a.size,size)
				ctx.drawImage(IMAGES['New Crest'][nextcrest],0,a.size*(1-a.index+Math.floor(a.index)),a.size,a.size *  (a.index-Math.floor(a.index)))

				ctx.translate(-a.x+a.size/2,-a.y+a.size/2)
		} else if(a.type == 'text'){
			ctx.globalAlpha = a.duration*2;
			ctx.fillStyle = white;
			if (a.color)ctx.fillStyle = a.color;
			if (a.dx)	a.x = a.x+ dt*a.dx;
			if (a.dy) a.y = a.y+ dt*a.dy;
			ctx.font = "20px Arial";
			//console.log(a.text)
			ctx.fillText(a.text,a.x, a.y)
			ctx.globalAlpha = 1;
		} else if (a.effect == 'pan'){
			if (a.dx)	a.x = a.x+ dt*a.dx;
			if (a.dy) a.y = a.y+ dt*a.dy;
			ctx.drawImage(a.image,a.x,a.y)
		} else if (a.effect == 'grow'){

			if (a.dx)	{
				a.sx = a.sx+ dt*a.dx;
				//a.x -= (dt*a.dx)/2
			}
			if (a.dy) {
				a.sy = a.sy+ dt*a.dy;
				//a.y -= (dt*a.dy)/2
			}



			if (a.msx != null) if (a.sx >= a.msx) a.sx = a.msx;
			if (a.msy != null) if (a.sy >= a.msy) a.sy = a.msy;
			if (a.sx <= 0) a.sx = 0;
			if (a.sy <= 0) a.sy = 0;
			var x = a.x-a.sx/2
			var y = a.y-a.sy/2

			if (a.fade) ctx.globalAlpha = a.duration
			ctx.translate(x,y)
			if (a.crest != null) {
				ctx.drawImage(a.image,CrestCoord[a.crest][0],CrestCoord[a.crest][1],35,35, 0,0,a.sx,a.sy)
			} else {
				ctx.drawImage(a.image,0,0,a.sx,a.sy)
			}
			if (a.text != null){
				drawText(a.text,"bolder 30px Arial", a.tx,a.ty)
			}
			ctx.translate(-x,-y)

		} else if(a.type == 'fade dice'){
			//	ctx.drawImage(IMAGES['Crest'], ,CrestCoord[crest][1]+35*(a.index-crest),35,35*(1-a.index+crest),a.x,a.y,50,size)
			//animation.push({type:'fade dice', crest:result[0][0], x:50, y:50, duration:1, delay:2})
			ctx.globalAlpha = a.duration
			//console.log(a.duration)
			ctx.drawImage(IMAGES['Crest'],CrestCoord[a.crest[0]][0],CrestCoord[a.crest[0]][1],35,35,a.x,a.y, a.size,a.size)
			ctx.fillStyle = white;
			ctx.strokeStyle = black;
			ctx.lineWidth = 2
			ctx.font = "bolder 20px Arial";
			ctx.fillText(a.crest[1],a.x+20,a.y+30);
			ctx.strokeText(a.crest[1],a.x+20,a.y+30);
			ctx.globalAlpha = 1
		} else if (a.type == 'message'){
			//animation.push({type:'message', text:'End Phase', color:red,x:200,y:200,speed:5, duration:5})
			ctx.fillStyle = white;
			ctx.strokeStyle = black;
			var accel = 1200;
			if (a.speed < 50) accel = 50
			if (a.speed > 1000) accel = -1000
			a.speed -= accel*dt
			//console.log(a.speed)
			if (a.speed < 0) a.speed = 1500
			a.x += a.speed*dt;
			ctx.fillRect(a.x,a.y,500,80);
			ctx.strokeRect(a.x,a.y,500,80);
			ctx.fillStyle = black;

			ctx.font = "20px Arial";
			ctx.fillText('hello',a.x,a.y+20)
		}
		a.duration -= dt;
		if (a.duration < 0){
			splice.push(i);
		}
	}
	while (splice.length > 0){
		var a = splice.pop()
		if (animation[a].onfinish){
			//console.log(animation[a].args)
			//console.log('casting onfihsing with args', animation[a].args)
			animation[a].onfinish.apply(undefined, animation[a].args)
		}
		animation.splice(a,1)
	}

}


function drawCrestPool(player,x,y){
	//var x = 500;
	//var y = 50;
	var size = 25;
	var gap = 10;
	var textsize = 15;
	ctx.translate(x-size/2,y-size/2)
	ctx.strokeStyle = white;
	ctx.fillStyle = black
	ctx.globalAlpha = 0.6
	ctx.fillRect(-20,-20, 100,200)
	ctx.globalAlpha = 1
	ctx.strokeRect(-20,-20, 100,200)
	for (var i=0; i<5; i++){
		drawCrest(i,0,i*(size+gap), size,size)
		ctx.fillStyle = white


		ctx.font = ""+textsize+"px Arial"
		ctx.fillText(player.pool[i], size+10,i*(size+gap)+textsize+5)
	}
	ctx.translate(-x+size/2,-y+size/2)
}

function drawText(msg, font, x,y){
	ctx.fillStyle = white;
	ctx.strokeStyle = black;
	ctx.lineWidth = 2;
	ctx.font = font
	ctx.strokeText(msg,x,y);
	ctx.fillText(msg,x,y);
}


function drawDiceSelection(){
	if (player.state != util.GAME_STATE_ROLL) return;
	for (var i=0; i<DiceSelection.length; i++){
		var l = DiceSelection.length
		//100+boardXPadding + 75*i,150+boardYPadding
		var x = 25+(l-i)*75
		var y = 200
		var s = 50;
		var txgap = 18;
		var tygap = 35;
		ctx.drawImage(IMAGES['New Crest'][CREST_SUMMON],  x ,y, s,s)
		var lvl = player.dices[DiceSelection[i].id].pattern[0][1]
		ctx.fillStyle = white;
		ctx.strokeStyle = black;
		ctx.lineWidth = 2;
		ctx.font = "bolder 30px Arial";

		ctx.strokeText(lvl,x+txgap,y+tygap);
		ctx.fillText(lvl,x+txgap,y+tygap);
	}
}


function wrapText(text, x, y, maxWidth, lineHeight) {
  var words = text.split(' ');
  var line = '';

  for(var n = 0; n < words.length; n++) {
    var testLine = line + words[n] + ' ';
    var metrics = ctx.measureText(testLine);
    var testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    }
    else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

function render(){
	requestAnimationFrame(render);

	ctx.clearRect(0,0,canvas.width,canvas.height)
	//ctx.drawImage(IMAGES['UI'],0,0, canvas.width,canvas.height)
	drawUIFrame()

	ctx.translate(boardXPadding,boardYPadding)
	drawBoard();
	drawUnits();
	drawProps();
	drawButton()
	drawDiceSelection();
	drawDicePattern();
	drawSelection(player);
	drawSelection(opponent);
	drawPath();
	//drawAlert();
	drawDialog();
	drawCrestPool(player,425,32);
	drawCrestPool(opponent,425,400);
	//updateCrest(player.pool);


	//====
	canvas.style.cursor = "default";
	setStatePanelText("")
	//var m = game.monsters[player.unitSelected]
	//if (!m){

	if (player.unitSelected != util.EMPTY){
		var m = game.monsters[player.unitSelected]
		if (IMAGES[m.name]){
				//ctx.drawImage(IMAGES[m.name],415,0);
		}
	}

	var	m = getUnitOnCursor(cursorX,cursorY);
	if (m){
		//setStatePanelText(m)
		if (m.player.num == player.num){
			canvas.style.cursor = "pointer";
		} else if (player.state == util.GAME_STATE_SELECT){
			canvas.style.cursor = "crosshair";
		}

		//buffs
		for (var i =0; i<m.buff.length; i++){
			console.log()
			if (IMAGES[m.buff[i].name]){
				ctx.drawImage(IMAGES[m.buff[i].name],m.x*squareSize+i*squareSize,(m.y-1)*squareSize, squareSize,squareSize)
				if (m.buff[i].stack != null){
					ctx.font = "bolder 20px Arial"
						ctx.strokeStyle = black
						ctx.lineWidth = 1
					ctx.fillText(m.buff[i].stack, m.x*squareSize+i*20+20, m.y*squareSize-20+20);
					ctx.strokeText(m.buff[i].stack, m.x*squareSize+i*20+20, m.y*squareSize-20+20);
				}
			}

		}
		//unit hud

		if (IMAGES[m.name]){
				ctx.drawImage(IMAGES[m.name],415+150,0);
		}

		ctx.strokeStyle = white;
		ctx.fillStyle = black
		ctx.globalAlpha = 0.6
		ctx.fillRect(415+280,0, 325,200)
		ctx.globalAlpha = 1
		ctx.strokeRect(415+280,0, 325,200)

		ctx.fillStyle = white;
		ctx.strokeStyle = black;
		ctx.lineWidth =2
		ctx.font = 'bolder 20px Arial'
		ctx.fillText('HP', 415+290,30)
		ctx.fillText('ATK', 415+290,65)
		ctx.fillText('DEF', 415+290,100)
		ctx.strokeText('HP', 415+290,30)
		ctx.strokeText('ATK', 415+290,65)
		ctx.strokeText('DEF', 415+290,100)
		for (var i=0; i<m.maxhp; i=i+10){
				ctx.globalAlpha = 0.5
				ctx.drawImage(IMAGES['Heart Grey'],415+290+(i/10)*(32)+60,10, 30,30 )
				ctx.globalAlpha = 1
				if (i<m.hp) ctx.drawImage(IMAGES['Heart'],415+290+(i/10)*(32)+60,10, 30,30 )
		}

		for (var i=0; i<1; i=i+10){
				ctx.drawImage(IMAGES['Sword'],415+290+(i/10)*(32)+60,0+42, 30,30 )
		}
		for (var i=0; i<1; i=i+10){
				ctx.drawImage(IMAGES['Shield'],415+290+(i/10)*(32)+60,0+74, 30,30 )
		}


		for (var i=0; i<m.spells.length; i++){
			if (IMAGES[m.spells[i].name]){
					//console.log(i)
					ctx.drawImage(IMAGES[m.spells[i].name],415+150,200+i*60+20,40,40)
					ctx.fillStyle = black;
					ctx.strokeStyle = white;
					ctx.globalAlpha = 0.6
					ctx.fillRect(415+150+40+20,200+i*60+20, 400,40)

					ctx.globalAlpha =1;
					ctx.lineWidth = 2
					ctx.strokeRect(415+150+40+20, 200+i*60+20, 400,40)
					ctx.fillStyle = white;
					ctx.font = "bold 15px Arial"

					var text = m.spells[i].name
					if (SPELLDESCRIPTION[m.spells[i].name]){
						text = SPELLDESCRIPTION[m.spells[i].name]
					}
					wrapText(text, 415+150+40+20+5,200+i*60+20+15, 400, 20)

			}
		}

	}

	if (game.combat){
		if (IMAGES[game.combat.target.name]){
				ctx.drawImage(IMAGES[game.combat.target.name],415+150,0);
				ctx.drawImage(IMAGES[game.combat.unit.name],415,0);
		}
	}

	if (player.diceButtonFocus != util.EMPTY){
		//console.log(player.diceButtonFocus)
		m = player.dices[player.diceButtonFocus].type;
		//DicePattern.push(player.dices[b.id]);
		setStatePanelText(m)
	}
	ctx.translate(-boardXPadding,-boardYPadding)
	var now = new Date().getTime()
	if (!time) time = now;
	var dt = (now - time) / 1000.0
  time = now;
	for (m of game.monsters){
		m.update(dt)
	}

	//drawDiceRoll(dt)

	drawAnimation(dt);

}



//socket.on('guard trigger', function(){
//	console.log("to guarding");
//})

var PLAYER_ID = -1;
var player;
var opponent;

//if (PLAYER_ID.isPlaying()) {
//	//PLAYER_ID.nextState();
//}
var main = function(){
	//requestAnimationFrame(main);
	//printCursor();

}
