//var socket = io();

//data = "hellsdo";
//socket.emit('first request', data); 

//socket.on('first request', function(data){
//	console.log("received data:"+data);
//});

var canvas = document.getElementById("game");
var switchButton = document.getElementById("switch");
var summonButton = document.getElementById("summon");

var summonOptionButton = [for (i of [0,1,2]) document.getElementById("summon"+i)]

var rollButton = document.getElementById("roll");
var endturnButton = document.getElementById("endturn");


var statPanel = document.getElementById("stat");
var crestPanel = document.getElementById("crest");
var dicePanel = document.getElementById("diceroll");
//var movementButton = document.getElementById("movement")

var ctx = canvas.getContext("2d");
var squareSize = 25;
var boardSizeX = 13;
var boardSizeY= 19;
canvas.width = 580;
canvas.height =580;
//state codes

//board states

var EMPTY = -1;
var PLAYER_1 = 0;
var PLAYER_2 = 1;

//game states
var IDLE = 0
var TILE_PLACEMENT = 1;
var UNIT_SELECT = 2;
var GAME_STATE_IDLE = 0;
var GAME_STATE_STOP = 3;



//states
var keyZ = 122;
var keysDown = {};
var rotate = 0;
var flip = false;
var shape = 0;
var validpos = true;
var monsters = [];
var selectedUnit = EMPTY;
var movePathSelection = [];

//var units = [];
//var board = [];

//for (var i=0; i<boardSizeY;i++){
//	units[i] = [];
//	for (var j=0;j<boardSizeX; j++){
//		units[i].push(-1);
//	}
//}

//board[0][6] = PLAYER_2;
//board[18][6] = PLAYER_1;
/*
for (var i=0; i<boardSizeX;i++){
	units[i] = [];
	for (var j=0;j<boardSizeY; j++){
		units[i].push(-1);
	}
}
*/
function Game(){
	this.player;
	this.turn;
	this.board;
	return this;
}

game = new Game();
game.board = new Board();

function Board(){
	this.tiles = [];
	this.units = [];

	for (var i=0; i<boardSizeY;i++){
		this.tiles[i] = [];
		for (var j=0;j<boardSizeX; j++){
			this.tiles[i].push(-1);
		}
	}

	for (var i=0; i<boardSizeY;i++){
		this.units[i] = [];
		for (var j=0;j<boardSizeX; j++){
			this.units[i].push(-1);
		}
	}

	this.tiles[0][6] = PLAYER_2;
	this.tiles[18][6] = PLAYER_1;

	this.drawSelection = function (){
		selection = getCurrentPlayer().tileSelected;
		if (!selection || selection.length <= 0) {
			return;
		}
		ctx.globalAlpha = 0.5;	
		for (var i = 0; i<6; i++){
			ctx.fillStyle = green;
			if (!validPlacement(selection, game.board)){
				ctx.fillStyle = red;
			}
			ctx.strokeStyle = "#303030";
			ctx.lineWidth = 1;
			drawSquare((selection[i][0])*squareSize, (selection[i][1])*squareSize);
			//console.log(selection)
		}
		ctx.globalAlpha = 1;

	}

	this.drawPath = function(){
		movePathSelection = getCurrentPlayer().movePath;
		if (movePathSelection.length > 1 && movePathSelection.length-1 <= getCurrentPlayer().pool.get(CREST_MOVEMENT)) {			
			ctx.globalAlpha = 0.5;
			
			for (var i=1; i<movePathSelection.length; i++){	
				ctx.fillStyle= "#000000";
				ctx.strokeStyle = "#303030";
				ctx.lineWidth = 1;
				drawSquare(movePathSelection[i][0]*squareSize, movePathSelection[i][1]*squareSize )
			}
			ctx.globalAlpha = 1.0;	

		};

	}

	this.render = function(){
		ctx.clearRect(0,0,canvas.width,canvas.height)
		drawBoard();
		drawUnits();
		this.drawSelection();
		this.drawPath();
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
								[CREST_MOVEMENT,2],
								[CREST_ATTACK,1]])

var Dice_Soraka = new Dice(id1, [[CREST_SUMMON,1],
								 [CREST_SUMMON,1],
								 [CREST_SUMMON,1],
								 [CREST_SUMMON,1],
								 [CREST_MAGIC,3],
								 [CREST_TRAP,2]]);


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

var heartReady = false;
var heartImage = new Image();
heartImage.onload = function(){
	heartReady = true;
	init();
};

heartImage.src = 'assets/img/heart.png';




idcounter = 0;

function unit(type, x,y, player) {

	this.id = idcounter;
	idcounter++;
	this.name = type.name;
	this.type = type;
	this.x = x;
	this.y = y;
	this.hp = type.hp;
	this.atk = type.atk;
	this.def = type.def;
	this.player = player;
	console.log(player);
	this.hasAttacked = false;
	this.canAttacked = true;
	this.atkcost = 1;

	setUnitAtLocation(this.id, [x,y]);
	monsters.push(this);

	this.attack = function(target){
		playerpool = allplayers[this.player].pool
		if (this.hasAttacked || playerpool.get(CREST_ATTACK) <= this.atkcost) return false;
		target.hp = target.hp - this.atk;
		setStatePanelText(target);
		if (target.hp <= 0){
			target.remove()
		}
		this.hasAttacked = true;
		playerpool.set(CREST_ATTACK, playerpool.get(CREST_ATTACK) - this.atkcost);
		updateCrest();
		return true;
	}

	this.remove = function(){
		monsters[this.id] = -1;		
	}
}


var allplayers = [];

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

function validPlacement(selection,board){
	//var cshape;
	//if (!selection){
	//	cshape = rotateShape(shape,rotate)
	//} else {
	//	cshape = selection;
	//	console.log("known selection")
	//}
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
		if (getBoardState(x+1,y) == PLAYER_1 || 
			getBoardState(x-1,y) == PLAYER_1 ||
			getBoardState(x,y-1) == PLAYER_1 ||
			getBoardState(x,y+1) == PLAYER_1 ){
			valid = true;
		}
	}

	return valid;
}


var gameState = IDLE;

function setGameState(state){
	gameState = state;
	selectedUnit = EMPTY;

	//hideButton(movementButton,true);

} 
function getGameState(){
	return gameState;
}


//pool states
function Pool(){
	this.pool = [0,0,0,0,0]
	this.set = function (crest, point){
		this.pool[crest] = point;
	}
	this.get = function(crest){
		return this.pool[crest]
	}
}



// player state


var playerid = 0;
var PLAYER_ID

function updateDiceRollPool(player, crest, point){
	player.pool.set(crest, player.pool.get(crest) + point);
	updateCrest();
}


function Player(){
	var PLAYER_STATE_IDLE = 0;
	var PLAYER_STATE_ROLL = 1;
	var PLAYER_STATE_SUMMON = 2
	var PLAYER_STATE_PLACEMENT = 3 
	var PLAYER_STATE_ACTION = 4;

	this.id = playerid;
	playerid++;
	this.pool = new Pool();

	this.state = PLAYER_STATE_IDLE;
	this.summon = [];

	//public variables
	this.tileSelected = []
	this.unitSelected;
	this.movePath = []

	this.makeSelection = function(){
		if (this.tileSelected.length > 0 && validPlacement(this.tileSelected,game.board)){
			var cshape = rotateShape(shape,rotate);
			for (var i=0; i<6; i++){
				x = this.tileSelected[i][0];
				y = this.tileSelected[i][1];
				setBoardState(PLAYER_1,[x,y]);
			}
			this.tileSelected = [];
			return true;
		}
		return false
	}


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
		//console.log("onRoll");
		this.state = PLAYER_STATE_ROLL;
		//setDicePanelText("+2 MOVEMENT")
		rollButton.disabled = true;
		summonButton.disabled = true;
		endturnButton.disabled = false;
		dices = [Dice_Teemo, Dice_Soraka, Dice_Teemo];
	
		var string = "";
		var summonlevel = 0;
		var summon = [[],[],[],[]];
		//update crestpool
		for (var i=0;i<dices.length; i++){
		
			r = dices[i].roll();
		
			
			if (r[0] != CREST_SUMMON){
				updateDiceRollPool(PLAYER_ID,r[0],r[1])
				string += "+" +r[1]+ " "+ CREST_TEXT[r[0]]  
			} else {
				string += "level " +r[1] + " Summon"
				summon[r[1]].push(dices[i]);

				if (summon[r[1]].length > 1){
					summonlevel = r[1]
				}
			}
			string += "<br\>"

		}
		if (summonlevel){
			string += "Summoning level: " + summonlevel + "<br\>";
			
			summonButton.disabled = false;	
			this.summon = summon[summonlevel];
		}

		setDicePanelText(string);
		
	}

	this.onSummon= function(){
		console.log("summon");	
		this.state = PLAYER_STATE_SUMMON;
		//setGameState(TILE_PLACEMENT);
		rollButton.disabled = true;
		summonButton.disabled = true;
		endturnButton.disabled = true;
		hideSummonButton(false, this.summon);

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


	allplayers.push(this);
	//console.log("player")
	//console.log(this)
	return this;
}

player1 = new Player();
player2 = new Player();
currentPlayer = player1;

PLAYER_ID = player1;

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




cursorX = 0;
cursorY = 0;
pageX = 0;
pageY = 0;
PLAYER_ID.pool.set(CREST_MOVEMENT, 5);



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

var getUnitAtLocation = function ([x,y]){
	//console.log("unit at " + x +" " + y);
	return game.board.units[y][x];
}

var setUnitAtLocation = function (id, point){
	game.board.units[point[1]][point[0]] = id;
}

function getBoardState(x,y){
	//console.log(x, y)
	if (boundCursor(x,y)){
		return game.board.tiles[y][x];
	} else {
		return EMPTY;
	}
}

function setBoardState(state, point){
	game.board.tiles[point[1]][point[0]] = state;
}

function updateCrest(){
	crestPanel.innerHTML = 	"<b>Movement: </b>" + player1.pool.get(CREST_MOVEMENT)+ "<br>" +  
						"<b>Attack</b>: " + player1.pool.get(CREST_ATTACK) +"<br>" +
						"<b>Defense</b>: " + player1.pool.get(CREST_DEFENSE) +"<br>" +
						"<b>Magic</b>: " + player1.pool.get(CREST_MAGIC) +"<br>" + 
						"<b>Trap</b>: " + player1.pool.get(CREST_TRAP) +"<br>";

}

summonButton.addEventListener("click", function(){
    console.log("move");
     //summonButton.disabled = false;
     PLAYER_ID.onSummon();

});

for (var i=0; i<3; i++){
	summonOptionButton[i].addEventListener("click", function(){
		console.log("summonoption: " + i);
		setGameState(TILE_PLACEMENT);
	})
	summonOptionButton[i].hidden = true;
}


endturnButton.addEventListener("click", function(){
	PLAYER_ID.endTurn();
})

switchButton.addEventListener("click", function(){

	if (PLAYER_ID.isPlaying()){
		PLAYER_ID.endTurn();
		
	} else {
		nextPlayer();	
		PLAYER_ID.beginTurn();
	}
	console.log("Current turn:" + currentPlayer.id);
})

rollButton.addEventListener("click", function(){
	PLAYER_ID.onRoll();
	//console.log(PLAYER_ID)
})



function hideSummonButton(boolean,dices){
	if (boolean){
		for (var i=0; i<3; i++){
			summonOptionButton[i].hidden = true;
		}
	} else {
		
		for (var i=0;i<dices.length; i++){
			summonOptionButton[i].innerHTML = dices[i].type.name;
			summonOptionButton[i].hidden = false;
		}
	}
}

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

new unit(id1, 6, 6, PLAYER_2);

function createUnit(id, x, y, player){
	new unit(id, x, y, player.id);
	//var unit2 = new unit(id1, 2, 2, PLAYER_2);
}

var moveUnit = function (id, x, y ){
	m = id;
	if (!id){
		console.log("Warning. Moving null unit.")
		return
	}
	l = findPath([m.x, m.y], [x,y]).length;
	if (l>1 && player1.pool.get(CREST_MOVEMENT) >= l-1){
		setUnitAtLocation(EMPTY, [m.x, m.y]);
		//units[m.x][m.y]=EMPTY;
		m.x = x;
		m.y = y;
		setUnitAtLocation(m.id, [x,y])
		//units[x][y]=id;
		PLAYER_ID.pool.set(CREST_MOVEMENT, PLAYER_ID.pool.get(CREST_MOVEMENT) - l+1);
		updateCrest()
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





var drawBoard = function(){
	ctx.strokeStyle = "#ffffff";
	ctx.lineWidth = 1;
	//ctx.shadowBlur = 5;
	//ctx.shadowColor = "grey";
	//board[6][7] =  1;
	for (var i=0; i< boardSizeX; i++){
		for (var j=0;j<boardSizeY; j++){
			if (getBoardState(i,j)== PLAYER_1){
				ctx.fillStyle = green;
			} else if (getBoardState(i,j) == PLAYER_2){
				ctx.fillStyle = blue;	
			} else if (getBoardState(i,j) == EMPTY ){
				ctx.fillStyle = "#303030";
			}
			drawSquare(i*squareSize,j*squareSize);
		}
	}

}

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
			if (getBoardState(cursorX, cursorY) != EMPTY){
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
	function(){return getCurrentPlayer().unitSelected}, 
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
		*/
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
		var x = (cursorX*squareSize)-squareSize ;
		var y = (cursorY*squareSize)-squareSize;
		//render();
		
		pattern = [for (i of rotateShape(shape,rotate)) [i[0]+cursorX, i[1]+cursorY]]
		//console.log(pattern)
		
		getCurrentPlayer().tileSelected = pattern;
		/*
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
		*/
		//game.board.render()
	})

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

canvas.addEventListener("mousemove", function(e){
	//if (getGameState() == GAME_STATE_STOP){
	//	//console.log("paused")
	//	return;
	//}
	prevX = cursorX;
	prevY = cursorY;
	cursorX = Math.floor(e.pageX/squareSize);
    cursorY = Math.floor(e.pageY/squareSize);
	if (prevX == cursorX && prevY == cursorY){
		return;
	}
	for (var i=0; i< EVENT_LIST.length; i++){
		//console.log(EVENT_LIST[i].action);
		if (EVENT_LIST[i].enabled && EVENT_LIST[i].trigger == TRIGGER_MOUSE_MOVE && EVENT_LIST[i].condition()) {
			//render();
			EVENT_LIST[i].action();
			game.board.render();		
		}
	}



});



function findPath(pathStart, pathEnd) {
	
	function Node(parent, point){

		this.x = point.x;
		this.y = point.y;
				this.parent = parent;
		this.value = point.x + point.y * boardSizeY;
		this.f = 0;
		this.g = 0;
		return this;
	}

	function validWalk(x, y){
		return boundCursor(x,y) && !isUnitOnCursor(x,y) && getBoardState(x,y) != EMPTY;
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



	function manhattanDistance(point, goal){
		return Math.abs(point.x - goal.x) + Math.abs(point.y, goal.y);
	}

	function calculatePath(){
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

canvas.addEventListener("click", function(e){
	if (PLAYER_ID.id != currentPlayer.id)
		return;
	for (var i=0; i<EVENT_LIST.length; i++){
		//console.log(EVENT_LIST[i].action);
		if (EVENT_LIST[i].enabled && EVENT_LIST[i].trigger == TRIGGER_MOUSE_CLICK && EVENT_LIST[i].condition()) {
			//render();
			EVENT_LIST[i].action();	
			game.board.render()	
			//render();
		}
	}
	SelectEvent.enabled = true;
	//if (getGameState() == GAME_STATE_STOP){
	//	console.log("paused");
		//return;
	//} 

});



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
var init = function (){
	updateCrest()
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
//	//PLAYER_ID.nextState();
//}

var main = function(){
	drawGame();
	//requestAnimationFrame(main);
	//printCursor();

}
