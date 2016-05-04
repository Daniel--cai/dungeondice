//var socket = io();


//var player1;
//var player2;

var playernum = 0;

var sendSwitch = true;
//var movePath = []
//var movementButton = document.getElementById("movement")

var ctx = canvas.getContext("2d");
content.hidden = true;
cancelButton.hidden = true


var animation = []
var projectiles = []
var controlLock = false;
var initUnit = 0;

//var boardSizeX = 13;
canvas.width = 1200;
canvas.height = 680;

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
			//if (event != 'apply')
			//console.log(event, 'not implemented for', this.name)
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

function BUFF_SLOW(unit, movement){
	//games[unit.player.id].update('impairment', EMPTY, {unit: unit.id, point:movement})
}
/*
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
*/


function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}






//var socket = new WebSocket(location.origin.replace(/^http/, 'ws'));
var socketid;



function rotateShape(shape,rotate){
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

function HealUnit(trig,targ,damage){
	if (targ == -1 || targ == null) {
		console.log('DamageUnit null target')
		return false;
	}
	if (trig == -1 || trig == null) {
		console.log('DamageUnit null trigger')
		return false;
	}
	var target = game.monsters[targ]
	var trigger = game.monsters[trig]

	if (!target.exist){
		console.log('Damaging a dead unit')
		return false;
	}
	if (damage <= 0) return false;
	target.hp = Math.min(target.hp + damage,target.maxhp);

	var tx = boardXPadding+target.x*squareSize;
	var ty = boardYPadding+target.y*squareSize;
	animation.push({type:'text', text:'+'+damage, color:green, x:tx,y:ty, dy:-25, duration:0.75})

	var event = {trigger:target, source: trigger}
	for (var i=0; i<target.buff.length ;i++){
		target.buff[i].fire('heal', event)
	}
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
	var event = {trigger:trigger, target:target}
	for (var i=0; i<trigger.buff.length ;i++){
		trigger.buff[i].fire('damage', event)
	}
	//var remove = false

	//games[trigger.player.id].update('damage', EMPTY, {trigger:trigger.id, target:target.id, damage:damage})
	if (sendSwitch){
		//conn.send({id:'damage unit', trigger:trig, target:targ, damage:damage,})
	}
	//console.log(trigger.type.name,'hit', target.type.name, 'for',damage)
	if (target.hp <= 0){
		var event = {target:target}
		for (var i=0; i<trigger.buff.length ;i++){
			trigger.buff[i].fire('kill', event)
		}
		var event = {trigger: target, attacker:trigger}
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
	this.atkunguardable = 0
	this.defmodifier = 0;
	this.guarded = false;
	this.status = []

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
		//console.log(this.atkunguardable)

		if (dmg < 0) {
			dmg = 0;
		}
		dmg += this.atkunguardable

		//console.log('status',event.status)

		//conn.send({id:'combat resolution', status:status})
		//var game = games[this.unit.player.id]

		if (this.status.indexOf('miss') != -1){
			console.log('mised!')
			//game.update('miss', EMPTY, {trigger:this.unit.id, target:this.target.id})
		} else {

			//DamageUnit(this.unit, this.target, dmg)
			console.log(this.unit.name+'('+this.unit.hp+')'+'attacking', this.target.name+'('+this.target.hp+')', 'for',this.atkmodifier+"(-"+this.defmodifier+")")
			//this.target.hp = this.target.hp - dmg;
			//if (this.target.hp <= 0){
				//this.target.destroy()
			//}

			dmg = this.target.subtractShield(dmg)
			if (dmg > 0)
				DamageUnit(this.unit.id,this.target.id,dmg)
		}
		game.combat = null
		this.unit.hasAttacked = true;
		this.unit.player.updatePool(CREST_ATTACK, -this.unit.atkcost);
		this.unit.player.animateDice(CREST_ATTACK)
		this.unit.player.changeState(GAME_STATE_UNIT)
		//this.target.player.changeState(GAME_STATE_NEUTRAL);
		//update(game);
	}

	return this;
}



function Game(){
	this.players = []
	this.turn = 0;
	this.board;
	//this.currentPlayer;
	this.monsters =[];
	this.combat = null;
	this.props = [];
	this.projectiles = []
	//this.chain = [];

	//this.timeout = false;

	this.init = function (){
		this.board = new Board();
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
			player.changeState(GAME_STATE_UNIT)
			return true;

		}
		//console.log('return fasle')
		return false
	}

	this.setUnitAtLoc = function(unit, point){
		console.assert(point[0] != undefined, 'setUnitAtLoc: null X value '+point[0])
		console.assert(point[1] != undefined,'setUnitAtLoc: null Y value '+point[1])
		this.board.units[point[1]][point[0]] = unit;
		//console.log('setting points', point, unit)
		if (unit != EMPTY){
			this.monsters[unit].x = point[0]
			this.monsters[unit].y = point[1]
		}
		//console.log('setting', unit,'to',point)

		//this.update('unit location', EMPTY, {unit:unit, loc:point})
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
			for (var i = 0; i< u.spells.length; i++){
				u.spells[i].fire('learn', {trigger:u})
			}
			sendSwitch = temp;

			this.setUnitAtLoc(u.id, point)
			if (sendSwitch){
				//console.log(id, point)
				conn.send({id:'create unit', unitid:id.name, point:point, player:player.num})
			}
			return u
		//var unit2 = new unit(id1, 2, 2, PLAYER_2);
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
	//this.tiles[0][6] = PLAYER_2;
	this.tiles[17][5] = PLAYER_1;
	this.tiles[17][4] = PLAYER_1;
	this.tiles[17][6] = PLAYER_1;

	this.getUnitAtLoc = function (x,y){
	//console.log("unit at " + x +" " + y);
		//console.log(this.units)
		console.assert(x != undefined, 'getUnitAtLoc: null X value')
		console.assert(y != undefined,'getUnitAtLoc: null Y value')
		if (!boundCursor(x,y)) return EMPTY

		return this.units[y][x];
	}

	this.setTileState = function(point, state){
		this.tiles[point[1]][point[0]] = state;
	}

	this.getTileState = function(x,y){
		  if (boundCursor(x,y)){
		    return this.tiles[y][x];
		  } else {
		    return EMPTY;
		  }
	}

	this.colorPath = function(path){
		for (var i=0;i<path.length;i++){
			this.colorSquare(path[i][0],path[i][1])
		}
	}

	this.colorSquare = function(x,y){
		if (!boundCursor(x,y)) return
		ctx.fillStyle= "#000000";
		ctx.strokeStyle = "#303030";
		ctx.lineWidth = 1;
		ctx.globalAlpha = 0.5
		drawSquare(x*squareSize, y*squareSize )
		ctx.globalAlpha = 1
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
			//console.log('hello ',x,y,this.tiles[18][6],getTileState(this,x,y));
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
		//console.log('passed')
		return valid;
	}

	return this;
}

//states
var keyZ = 122;
var keysDown = {};
var rotate = 0;
var flip = false;
var shape = 0;
var validpos = true;
var monsters = [];
var selectedUnit = EMPTY;


var game;

function changeUIState(state){
	console.log('Phase',GAME_STATE_TEXT[state])
	if (state == GAME_STATE_COMBAT){
			player.movePath = []
			disableButtons(true,true)
			return;
	}

	disableSpell(true)
	rollButton.hidden = true;

	for (i=0;i<15;i++) DicePool[i].hidden = true;
	if (state == GAME_STATE_ROLL){
		rollButton.hidden = false;

		for (i=0;i<15;i++) DicePool[i].reset();
		for (i=0; i<15; i++){
			//console.log(i)
			if (player.dices[i]){
				DicePool[i].hidden = false;
			}
		}
	}
  if (state == GAME_STATE_END){
  	disableButtons(true,true)
		//for (i=0;i<15;i++) Buttons[i].reset();
		DiceSelection = [];
	}

	//UI
 disableConfirmButtons(true)


	disableButtons(true,true)

	if (player.state == GAME_STATE_SUMMON ){
		/*
		for (i=0;i<15;i++) DicePool[i].reset();
		console.log('summon', player.summon)
		for (i=0;i<player.summon.length;i++) {
			DicePool[player.summon[i]].toggle = true;
			DicePool[player.summon[i]].focus = true;
		}
		*/
	} else if (player.state == GAME_STATE_SELECT ||
		player.state == GAME_STATE_UNIT) {
		disableButtons(true,false)
	}

}

function flipXY(x,y){
	return [boardSizeX-x,boardSizeY-y]
}

function drawHUD(){
	ctx.globalAlpha = 1
	ctx.drawImage(IMAGES['HUD'], 50,175, 400,300)
		ctx.globalAlpha = 1
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
		if (player.num == PLAYER_2){
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
			//x = boardSizeX-x-1
			//y = boardSizeY-y-1
			//console.log(x,y)
		}

		drawSquare(x*squareSize, y*squareSize);
		//console.log(selection)
	}
	ctx.globalAlpha = 1;

}

function drawPath(){
	//movePathSelection = player.movePath;
	if (player.state != GAME_STATE_SELECT) return;
	//var movePathSelection = movePath;
	//console.log(movePathSelection)

	//if (movePathSelection.length > 1 && movePathSelection.length-1 <= player.pool.pool[CREST_MOVEMENT]) {
	ctx.globalAlpha = 0.5;
	for (var i=0; i<player.movePath.length; i++){
		var x = player.movePath[i][0]
		var y = player.movePath[i][1]
		if (cursorX == x && cursorY == y) continue;
		game.board.colorSquare(x,y)
	}
	ctx.globalAlpha = 1.0;
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
		if (player.state == GAME_STATE_ROLL){
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
		if (player.state == GAME_STATE_ROLL){
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
			//if (player.state != GAME_STATE_ROLL) return

			player.diceButtonFocus = this.id
			DicePattern = player.dices[this.id]
			//console.log(DicePattern)
		}

		b.onClick = function(x,y){
			if (player.state != GAME_STATE_ROLL) return;
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
				if (player.state == GAME_STATE_ROLL){
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
		if (player.state != GAME_STATE_SUMMON) return;
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
		//if (player.state != GAME_STATE_SUMMON) return;
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
var black = "#000000";
var green = "#00FF00";

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
		if (!boundCursor(x,y) || getBoardState(x,y) != EMPTY){
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
		if (player.state != GAME_STATE_SUMMON) return;
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
	if (x>= boardSizeX || y >= boardSizeY ||x < 0 || y < 0){
    	return false
    }
    return true;
}



var isUnitOnCursor = function(x, y){
	return boundCursor(x,y) && game.board.getUnitAtLoc(x,y) != EMPTY
}

var getUnitOnCursor = function(x,y){
	//console.log(getUnitAtLocation([x,y]))
	if (isUnitOnCursor(x,y)) {
		return game.monsters[game.board.getUnitAtLoc(x,y)];
	} else {
		return null;
	}
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
		return EMPTY;
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
	if (player.state != GAME_STATE_SELECT) return;
	var spell = game.monsters[player.unitSelected].spells[button]
	var name = game.monsters[player.unitSelected].name
	if (!spell) return
	var cost = SPELLS[name][button].cost()
	if (player.pool[cost[0]] < cost[1]){
		console.log('Not enough', CREST_TEXT[cost[0]], 'to cast', SPELLS[name][button].name)
		player.spell = -1;
		return;
	}
	if (spell.type == "self"){
		console.log('no target spell')
		var event = {trigger: game.monsters[player.unitSelected]};
		conn.send({id:'spell effect', spell:button, location:[-1,-1], target:-1})
		spell.fire('effect',event);
		spell.fire('finish', {trigger:event.trigger})

	} else {
		player.spell = button;
		//console.log('player spell now',player.spell)
		var event = {trigger:game.monsters[player.unitSelected]}
		if (game.monsters[player.unitSelected].spells[button].fire('cast', event)){
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
	disableConfirmButtons(true)

	//socket.send(JSON.stringify({ id:'guard response', data:button}));
}
yesButton.addEventListener("click", function(){
	responseButton(1)
})

noButton.addEventListener("click", function(){
	responseButton(0)
})

qButton.addEventListener("click", function(){
	spellButtonEffect(1)
})

wButton.addEventListener("click", function(){
	spellButtonEffect(2)
})

eButton.addEventListener("click", function(){
	spellButtonEffect(3)
})
rButton.addEventListener("click", function(){
	spellButtonEffect(4)
})

cancelButton.addEventListener("click", function(){
	player.spell = -1;
	disableSpell(false)
	cancelButton.hidden = true;
	var m = game.monsters[player.unitSelected]
	player.movePath = findPossiblePath([m.x, m.y],player.getCrestPool(CREST_MOVEMENT)-m.impairment)
})


endturnButton.addEventListener("click", function(){
	//socket.send(JSON.stringify({id:'end turn'}));
	player.endTurn();
	opponent.startTurn();
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
		player.changeState(GAME_STATE_SUMMON);
	} else {
		player.changeState(GAME_STATE_UNIT)
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
	for (var i= verticalFlip ? 0 : boardSizeX-1; verticalFlip ? i< boardSizeX : i>=0 ; verticalFlip ? i++:i--){
		for (var j= verticalFlip ? 0 : boardSizeY-1; verticalFlip ? j< boardSizeY : j>=0 ; verticalFlip ? j++:j--){
	*/
	ctx.globalAlpha = 0.5
	for (var i = 0; i< boardSizeX; i++ ){
		for (var j = 0; j< boardSizeY; j++ ){
			ctx.fillStyle = "#303030";
			ctx.strokeStyle = white

			drawSquare(i*squareSize,j*squareSize);
		}
	}
		ctx.globalAlpha = 1
	for (var i = 0; i< boardSizeX; i++ ){
		for (var j = 0; j< boardSizeY; j++ ){
			var x = i,y = j
			if (player.num == 1){
				//x = boardSizeX-x-1
				//y = boardSizeY-y-1
				//console.log(x,y)
			}

			if (getBoardState(i,j)== PLAYER_1){
				ctx.fillStyle = purple;
				ctx.strokeStyle = white
				ctx.drawImage(IMAGES['Texture'],x*squareSize,y*squareSize, squareSize,squareSize)
			} else if (getBoardState(i,j) == PLAYER_2){
				ctx.fillStyle = blue;
				ctx.strokeStyle = white
				ctx.drawImage(IMAGES['Texture'],x*squareSize,y*squareSize, squareSize,squareSize)
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
		if (p.exist == false)	continue;

		p.render()

	}
}

var drawUnits = function(dt) {
	//console.l(game.monsters.length)
	for(var i=0; i<game.monsters.length; i++) {
		//console.log(game.monsters[i]);
		var m = game.monsters[i];
		if (!m.exist) continue
		m.update(dt)
		m.render()
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
		if (player.state != GAME_STATE_SUMMON) return
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
				console.log('check lock')
		if (controlLock) return;
		console.log('helsdf')
		var x = cursorX;
		var y = cursorY;
		if (player.num == 1){
			//x = boardSizeX-x-1
			//y = boardSizeY-y-1
		}
		var u = game.board.getUnitAtLoc(x,y)
		console.log(u, EMPTY)
		if (player.state == GAME_STATE_UNIT){
			if (u == EMPTY) return;
			//console.log('unit select')
     		//socket.send(JSON.stringify({id:'mouse click', data:{state: 'select', loc:[x, y]}}))
   		player.selectUnit(x, y)

    } else if (player.state == GAME_STATE_SELECT){
 				if (player.spell != EMPTY){
     			console.log('cast',player.spell)
					var spell = game.monsters[player.unitSelected].spells[player.spell]
					var m = game.board.getUnitAtLoc(x,y)
					var target = m != EMPTY ? game.monsters[m] : null
					//console.log(target.name)
					var event = {trigger: game.monsters[player.unitSelected], location: [x,y], target:target};
					conn.send({id:'spell effect', spell:player.spell, location:[x,y], target:m})
					spell.fire('effect',event);

     		} else if (u == EMPTY){
					console.log('moving unit')
     			//socket.send(JSON.stringify({id:'mouse click', data:{state:'move', loc:[x, y]}}))
 					if (game.board.getTileState(x, y) != EMPTY){
	 					//console.log('moving')
									console.log('tile state')
						var m = game.monsters[player.unitSelected]
						var path = findPath([m.x,m.y],[x,y]);
						var plen = path.length
						if (plen > 1 && plen-1 <= player.getCrestPool(CREST_MOVEMENT) - m.impairment) {

	 						m.movement(path)
							conn.send({id:'move unit', unit:m.id, path:path})
							//console.log(m.impairment)
							player.updatePool(CREST_MOVEMENT,-Math.max(plen-1+m.impairment,1))
							player.animateDice(CREST_MOVEMENT)
							player.changeState(GAME_STATE_UNIT)
						}
					}
     		} else if (game.monsters[u].player.num == player.num){
					//console.log('u not null')
     			player.selectUnit(x, y)
				} else if (game.monsters[u].player.num != player.num){
					console.log('atacking')
					game.monsters[player.unitSelected].attack(game.monsters[u])
				}
    } else if (player.state == GAME_STATE_SUMMON){
				if (game.makeSelection(player)){
					game.createUnit(player,player.dices[player.summonchoice].type,[x,y])
					//DicePool[player.summonchoice].hidden = true;
					player.dices[player.summonchoice] = null;
					//SummonPool = []
					player.changeState(GAME_STATE_UNIT);

				}
     		//socket.send(JSON.stringify({id:'tile place',data:{loc:[x, y]} }))
		}
		//render();
	});



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
		ctx.drawImage(IMAGES['New Crest'][crest],x,y,sx,sy)
		//ctx.drawImage(IMAGES['Crest'][crest][0],CrestCoord[crest][1],35,35,x,y,sx,sy)
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
	//ctx.drawImage(IMAGES['Runeterra'], 0,0, canvas.width,canvas.height)
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

function drawProjectile(dt){
	for (var i = game.projectiles.length-1; i>=0; i--){
		var p =
		game.projectiles[i].update(dt)
		game.projectiles[i].render()
	}
}

function drawAnimation(dt){
	var splice = [];

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
						a.unit.animx = a.unit.animx + dx/Math.abs(dx)*a.speed*dt;
						//console.log(dx/Math.abs(dx)*a.speed*dt)
						if (dx > 0 && a.unit.animx >= move[0] || dx < 0 && a.unit.animx <= move[0]){
							finish = true;
						}
				} else if (dy != 0){
					a.unit.animy = a.unit.animy + dy/Math.abs(dy)*a.speed*dt;
					if (dy > 0 && a.unit.animy >= move[1] || dy < 0 && a.unit.animy <= move[1]){
							finish = true;
					}
				} else {
					console.log('same location')
					finish = true;
				}
				if (finish){
					a.path.shift();
					a.unit.animx = move[0];
					a.unit.animy = move[1];



					var event = {trigger: a.unit, location: move}
					for (var j=0; j<game.props.length; j++){
						if (game.props[j] && game.props[j].x == move[0] && game.props[j].y == move[1]){
							game.props[j].fire('collision',event);
						}
					}
					splice.push(i)
					animation.push({type:'move unit', unit:a.unit, path:a.path , px:move[0], py:move[1], speed:a.speed, duration:200})
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
	ctx.lineWidth =1
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
	if (player.state != GAME_STATE_ROLL) return;
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

function drawUnitHUD(dt){
	if (player.unitSelected != EMPTY){
		var	m = game.monsters[player.unitSelected];
		//setStatePanelText(m)
		/*
		if (m.player.num == player.num){
			canvas.style.cursor = "pointer";
		} else if (player.state == GAME_STATE_SELECT){
			canvas.style.cursor = "crosshair";
		}
		*/
		//buffs
		var skip = 0;
		for (var i =0; i<m.buff.length; i++){
			console.log()
			if (IMAGES[m.buff[i].name]){
				ctx.drawImage(IMAGES[m.buff[i].name],m.x*squareSize+(i-skip)*squareSize,(m.y-1)*squareSize, squareSize,squareSize)
				if (m.buff[i].stack != null){
					ctx.font = "bolder 20px Arial"
						ctx.strokeStyle = black
						ctx.lineWidth = 1
					ctx.fillText(m.buff[i].stack, m.x*squareSize+i*20+20, m.y*squareSize-20+20);
					ctx.strokeText(m.buff[i].stack, m.x*squareSize+i*20+20, m.y*squareSize-20+20);
				}
			} else {
				skip++
			}

		}
		//unit hud

		if (IMAGES[m.name]){
				ctx.drawImage(IMAGES[m.name],415+150,0);
		}
		ctx.drawImage(IMAGES['ButtonHUD'],415+150,0,110,200)

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

		for (var i=0; i<m.atk; i=i+10){
				ctx.drawImage(IMAGES['Sword'],415+290+(i/10)*(32)+60,0+42, 30,30 )
		}
		for (var i=0; i<m.def; i=i+10){
				ctx.drawImage(IMAGES['Shield'],415+290+(i/10)*(32)+60,0+74, 30,30 )
		}


		for (var i=0; i<m.spells.length; i++){
			if (IMAGES[m.spells[i].name]){
					//console.log(i)
					ctx.drawImage(IMAGES[m.spells[i].name],415+150,200+i*60+20,40,40)
					ctx.drawImage(IMAGES['ButtonHUD'],415+150,200+i*60+20,40,40)
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
}

function render(){

	controlLock = false
	if (animation.length != 0) controlLock = true
	var now = new Date().getTime()
	if (!time) time = now;
	var dt = (now - time) / 1000.0
	time = now;

	requestAnimationFrame(render);

	ctx.clearRect(0,0,canvas.width,canvas.height)
	//ctx.drawImage(IMAGES['UI'],0,0, canvas.width,canvas.height)
	drawUIFrame()

	ctx.translate(boardXPadding,boardYPadding)
	drawBoard();
	drawUnits(dt);
	drawProps();
	if (player.state == GAME_STATE_ROLL) drawHUD()
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
	drawProjectile(dt)

	//====
	canvas.style.cursor = "default";
	setStatePanelText("")
	//var m = game.monsters[player.unitSelected]
	//if (!m){

	if (player.unitSelected != EMPTY){
		var m = game.monsters[player.unitSelected]
		if (IMAGES[m.name]){
				//ctx.drawImage(IMAGES[m.name],415,0);
		}
	}

	if (!controlLock)
		drawUnitHUD(dt)

	/*
	if (game.combat){
		if (IMAGES[game.combat.target.name]){
				ctx.drawImage(IMAGES[game.combat.target.name],415+150,0);
				ctx.drawImage(IMAGES[game.combat.unit.name],415,0);
		}
	}*/

	if (player.diceButtonFocus != EMPTY){
		//console.log(player.diceButtonFocus)
		m = player.dices[player.diceButtonFocus].type;
		//DicePattern.push(player.dices[b.id]);
		setStatePanelText(m)
	}
	ctx.translate(-boardXPadding,-boardYPadding)
	drawAnimation(dt);

}



//socket.on('guard trigger', function(){
//	console.log("to guarding");
//})

var PLAYER_ID = -1;

//if (PLAYER_ID.isPlaying()) {
//	//PLAYER_ID.nextState();
//}
var main = function(){
	//requestAnimationFrame(main);
	//printCursor();

}
