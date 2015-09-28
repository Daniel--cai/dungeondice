var socket = io();

socket.on('new player id', function(players){
	//text = ""
	//for (var i=0; i < players.length; i++){
	//	text += players[i] + "<br\>";
	//} 
	playerPanel.innerHTML = players;
})



var canvas = document.getElementById("games");
//var switchButton = document.getElementById("switch");
var summonButton = document.getElementById("summon");

var summonOptionButton = [for (i of [0,1,2]) document.getElementById("summon"+i)]

var rollButton = document.getElementById("roll");
var endturnButton = document.getElementById("endturn");


var statPanel = document.getElementById("stat");
var crestPanel = document.getElementById("crest");
var dicePanel = document.getElementById("diceroll");
var playerPanel = document.getElementById("players")
//var movementButton = document.getElementById("movement")

var ctx = canvas.getContext("2d");
var squareSize = 30;
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
/*
var IDLE = 0
var TILE_PLACEMENT = 1;
var UNIT_SELECT = 2;
var GAME_STATE_IDLE = 0;
var GAME_STATE_STOP = 3;
*/


//states
var keyZ = 122;
var keysDown = {};
var rotate = 0;
var flip = false;
var shape = 0;
var validpos = true;
var monsters = [];
var selectedUnit = EMPTY;
//var movePathSelection = [];

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
//function Game(){
//	this.player;
//	this.turn;
//	this.board;
//	return this;
//}

var game;

//game = new Game();
//game.board = new Board();

function disableButtons(a,b,c){
		rollButton.disabled = a;
		summonButton.disabled = b;
		endturnButton.disabled = c;
}


function drawSelection (player){
	selection = player.tileSelected;
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
		//console.log(game.board)
		if (!validPlacement(player)){
			ctx.fillStyle = red;
		}
		ctx.strokeStyle = "#303030";
		ctx.lineWidth = 1;
		drawSquare((selection[i][0])*squareSize, (selection[i][1])*squareSize);
		//console.log(selection)
	}
	ctx.globalAlpha = 1;

}

function drawPath(){
	//movePathSelection = player.movePath;
	var movePathSelection = player.movePath;
	//if (movePathSelection.length > 1 && movePathSelection.length-1 <= player.pool.pool[CREST_MOVEMENT]) {			
	ctx.globalAlpha = 0.5;
	for (var i=0; i<movePathSelection.length; i++){	
		if (cursorX == movePathSelection[i][0] && cursorY == movePathSelection[i][1]) continue;
		ctx.fillStyle= "#000000";
		ctx.strokeStyle = "#303030";
		ctx.lineWidth = 1;
		drawSquare(movePathSelection[i][0]*squareSize, movePathSelection[i][1]*squareSize )
	}
	ctx.globalAlpha = 1.0;	

	//};

}



/*
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
*/

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



/*
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
	this.atkrange = 1;

	//setUnitAtLocation(this.id, [x,y]);
	monsters.push(this);

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
		updateCrest();
		return true;
	}

	this.remove = function(){
		monsters[this.id] = -1;		
	}
}

/*
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
*/
function validPlacement(player){
	//var cshape;
	//if (!selection){
	//	cshape = rotateShape(shape,rotate)
	//} else {
	//	cshape = selection;
	//	console.log("known selection")
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

/*
var gameState = IDLE;

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
	this.pool = [0,0,0,0,0]
	this.set = function (crest, point){
		this.pool[crest] = point;
	}
	this.get = function(crest){
		return this.pool[crest]
	}
}



// player state
/*
var tileSelected = []
var tileShape = [];
var unitSelected;
var movePath = []
*/
/*
var makeSelection = function(){
	if (player.tileSelected && player.tileSelected.length > 0 && validPlacement(tileSelected,game.board)){
		var cshape = rotateShape(shape,rotate);
		for (var i=0; i<6; i++){
			x = this.tileSelected[i][0];
			y = this.tileSelected[i][1];
			setBoardState(PLAYER_1,[x,y]);
		}
		tileSelected = [];
		return true;
	}
	return false
}
*/
/*
var isPlaying = function(){
	return PLAYER_ID.id == getCurrentPlayer().id
}*/


this.onIdle = function(){

}

var beginTurn = function (){
	//this.state = PLAYER_STATE_IDLE;
	//setGameState(GAME_STATE_IDLE);
	rollButton.disabled = false;
	summonButton.disabled = true;
	endturnButton.disabled = true;
	hideSummonButton(true);

	//reset data
	/*
	for (i=0;i<monsters.length;i++){
		monsters[i].hasAttacked = false;
	}*/
}

var onRoll = function(){
	//console.log("onRoll");
	this.state = PLAYER_STATE_ROLL;
	//setDicePanelText("+2 MOVEMENT")
	
	
}

var onSummon= function(){
	console.log("summon");	
	//this.state = PLAYER_STATE_SUMMON;
	//setGameState(TILE_PLACEMENT);
	rollButton.disabled = true;
	summonButton.disabled = true;
	endturnButton.disabled = true;
	hideSummonButton(false);

}

var endTurn = function(){
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

//var playerid = 0;
//var PLAYER_ID
/*
function Player(){

	this.id = playerid;
	playerid++;
	this.pool = new Pool();

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
		
		
	}

	this.onSummon= function(){
		console.log("summon");	
		//this.state = PLAYER_STATE_SUMMON;
		//setGameState(TILE_PLACEMENT);
		rollButton.disabled = true;
		summonButton.disabled = true;
		endturnButton.disabled = true;
		hideSummonButton(false);

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
*/
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

addEventListener("keypress", function(e){
		//keysDown[e.keyCode] = true;
		//console.log(e.charCode);
		if (e.charCode == 122){
			socket.emit('rotate shape');
		} else if (e.charCode == 99){
			socket.emit('change shape');
		}
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
	return boundCursor(x,y) && getUnitAtLocation([x,y]) != EMPTY
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

var getUnitAtLocation = function ([x,y]){
	//console.log("unit at " + x +" " + y);
	if (game)
		return game.board.units[y][x];
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
	crestPanel.innerHTML = 	"<b>Movement: </b>" + pool[CREST_MOVEMENT]+ "<br>" +  
						"<b>Attack</b>: " + pool[CREST_ATTACK] +"<br>" +
						"<b>Defense</b>: " + pool[CREST_DEFENSE] +"<br>" +
						"<b>Magic</b>: " + pool[CREST_MAGIC] +"<br>" + 
						"<b>Trap</b>: " + pool[CREST_TRAP] +"<br>";

}

summonButton.addEventListener("click", function(){
	console.log("summon");	
	//this.state = PLAYER_STATE_SUMMON;
	//setGameState(TILE_PLACEMENT);
	rollButton.disabled = true;
	summonButton.disabled = true;
	endturnButton.disabled = true;
	hideSummonButton(false);
});

var summoni = i;
for (var i=0; i<3; i++){
	summonOptionButton[i].hidden = true;	
	console.log(i);
	summoni = i;
}

summonOptionButton[0].addEventListener("click", function(){
	console.log("summonoption:"+ 0);
	socket.emit('c_summonoption', 0)

})

summonOptionButton[1].addEventListener("click", function(){
	console.log("summonoption:"+ 1);
	socket.emit('c_summonoption', 1)

})

summonOptionButton[2].addEventListener("click", function(){
	console.log("summonoption:"+ 2);
	socket.emit('c_summonoption', 2)

})


endturnButton.addEventListener("click", function(){
	socket.emit('end turn');
	//PLAYER_ID.endTurn();
})
/*
switchButton.addEventListener("click", function(){

	if (PLAYER_ID.isPlaying()){
		PLAYER_ID.endTurn();
		
	} else {
		nextPlayer();	
		PLAYER_ID.beginTurn();
	}
	console.log("Current turn:" + currentPlayer.id);
})
*/

rollButton.addEventListener("click", function(){
	//this.state = PLAYER_STATE_ROLL;
    //setDicePanelText("+2 MOVEMENT")
    rollButton.disabled = true;
    summonButton.disabled = true;
    endturnButton.disabled = false;
    //var dices = [Dice_Teemo, Dice_Soraka, Dice_Teemo];
    //var summonlevel = 0;
    //var summon = [[],[],[],[]];
    //update crestpool
    socket.emit('c_roll')

    socket.on('s_roll', function(data){
    	//console.log(data);
    	updateCrest(data.pool);
    	var string = "";

    	if (data.summon.length > 0){
    		//console.log(data.summon)
    		string += "Summoning level: " + data.level + "<br\>";
      		summonButton.disabled = false; 
      		summonNames = data.summon; 
      		
      		//this.summon = summon[summonlevel];
    	}
    	for (var i=0; i<data.gain.length; i++){
    		if (data.gain[i]){
    			string += "+" + data.gain[i] + CREST_TEXT[i] + "<br\>" 
    		}
    	}
		setDicePanelText(string);
    })
})

function hideSummonButton(boolean){
	
	if (boolean){
		for (var i=0; i<3; i++){
			summonOptionButton[i].hidden = true;
		}
	} else {
		
		for (var i=0;i<summonNames.length; i++){
			summonOptionButton[i].innerHTML = summonNames[i].name;
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

//new unit(id1, 6, 6, PLAYER_2);
/*
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
*/

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





var drawBoard = function(){
	//console.log('drawing board')
	ctx.strokeStyle = "#ffffff";
	ctx.lineWidth = 1;
	//ctx.shadowBlur = 5;
	//ctx.shadowColor = "grey";
	//board[6][7] =  1;
	for (var i=0; i< boardSizeX; i++){
		for (var j=0;j<boardSizeY; j++){
			if (getBoardState(i,j)== PLAYER_1){
				ctx.fillStyle = purple;
			} else if (getBoardState(i,j) == PLAYER_2){
				ctx.fillStyle = blue;	
			} else if (getBoardState(i,j) == EMPTY ){
				ctx.fillStyle = "#303030";
			}
			drawSquare(i*squareSize,j*squareSize);
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
	ctx.stroke();22
}

var drawUnits = function() {
	//console.l(game.monsters.length)
	for(var i=0; i<game.monsters.length; i++) {
		//console.log(game.monsters[i]);
		m = game.monsters[i];
		w = 1;
		//p = getCurrentPlayer()
		if (!m){
			continue;
		}
		if (player.unitSelected == m.id){
			w = 3;
		}
		if (opponent.unitSelected == m.id){
			w = 5;
		}
		drawCircle(m.x, m.y,w, m.player);

	}

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

/*

registerClickEvent(
	function(){return boundCursor(cursorX,cursorY)},
	function(){
		//var p = getCurrentPlayer()
		//var u = player.unitSelected;
		//var m = getUnitOnCursor(cursorX,cursorY);
		socket.emit('c_selectunit', [cursorX, cursorY])
		//console.log("heselectionat " +cursorX, cursorY)
		//if (m){
			//deselect
		//	movePath = []

			/*
			if (m.id == u.id){
				//unitSelected = null;
				setGameState(IDLE);
				SelectEvent.enabled = false;
				
			//new selection
			} else if (m.player == PLAYER_1){
				unitSelected = m;
			//attacking
			} else if (m.player == PLAYER_2){
				if (u.attack(m)){
					unitSelected = null;
				}
			}
			*/
			/*	
		} else if (boundCursor(cursorX, cursorY)){
			if (getBoardState(cursorX, cursorY) != EMPTY){
				moveUnit(u, cursorX,cursorY);
				
				movePath = []
				SelectEvent.enabled = false;
			}
			//setGameState(IDLE);
			//unitSelected = null;
		//}

		//render();
	})
/*
SelectEvent = registerClickEvent(
	function(){return player.unitSelected},
	function(){	
		console.log("deselection")
		var m = getUnitOnCursor(cursorX,cursorY);
		if (m && m.player == PLAYER_1){
			
			//setGameState(UNIT_SELECT);
			//selectedUnit = m.id;
			unitSelected = m
			//render();
			//console.log("selected unit id: " + m);		
		}
	});

registerClickEvent(
	function(){return player && player.tileSelected.length > 0},
	function(){
		//var p = getCurrentPlayer()
		console.log("tile place")
		socket.emit('c_tilesplace')
		socket.on('s_tilesplace', function(data){
			console.log('s_tilesplace')
			//tileSelected = [];
			//p.makeSelection()
			//createUnit(id0,cursorX, cursorY, p);
			//setGameState(IDLE);
			//hideSummonButton(true);
			//endturnButton.disabled = false;
			//render();
		});
		
	});
/*
registerMoveEvent(
	function(){return player && player.unitSelected}, 
	function(){
		
		//var m = game.monsters[player.unitSelected];
		//movePathSelection = findPath([m.x, m.y],[cursorX,cursorY]);

		//console.log("move length is " + movePath.length)
		//render()
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
*/

registerMoveEvent(
	function(){return true},
	function(){

	});

registerMoveEvent(
	function(){return true},
	function(){
		socket.emit('mouse move', {X:cursorX, Y:cursorY})

		var m = getUnitOnCursor(cursorX,cursorY);
		if (m){
			//console.log(m);
			setStatePanelText(m)
		//} else if (player && player.unitSelected){
		//	setStatePanelText(player.unitSelected)
		} else {
			setStatePanelText("")
		}

	});

registerClickEvent(
	function(){return true},
	function(){
		socket.emit('mouse click', {X:cursorX, Y:cursorY})
	});

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

var render = function(){
	//console.log("rendering")
	ctx.clearRect(0,0,canvas.width,canvas.height)
	drawBoard();
	drawUnits();
	drawSelection(player);
	drawSelection(opponent);


	drawPath();
}


function update(data){
	PLAYER_ID = data.pnum
	game = data.game;
	//console.log(data.pnum)
	opponent = game.players[0];
	player = game.players[data.pnum];
	if (data.pnum == 0){
		opponent = game.players[1];
	}
	
	//console.log(player.tileSelected);
	updateCrest(player.pool.pool);
	var m = getUnitOnCursor(cursorX,cursorY);
	if (m){
		//console.log(m.name +" "+m.hp)
		setStatePanelText(m)
	}
	render();

	if (PLAYER_ID != game.turn%2){
		disableButtons(true,true,true)
	} else if (!player.rolled){
		disableButtons(false,false,false)
	} else if (!player.summoned) {
		disableButtons(true,false,false)
	} else if (player.tileSelected.length <=0){
		hideSummonButton(true);
		disableButtons(true,true,false)
	} 
}

socket.on('updategame', function(data){
	if (!game){
		playerPanel.innerHTML += " player: " + data.pnum;
		init();
	}
	update(data)
});
var PLAYER_ID = -1;
var player;
var opponent;



var init = function (){

	canvas.addEventListener("mousemove", function(e){
		//if (getGameState() == GAME_STATE_STOP){
		//	//console.log("paused")
		//	return;
		//}
		
		var prevX = cursorX;
		var prevY = cursorY;
		
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
				
				render();		
			}
		}



	});

	canvas.addEventListener("click", function(e){
		//if (PLAYER_ID.id != currentPlayer.id)
		//	return;
		for (var i=0; i<EVENT_LIST.length; i++){
			//console.log(EVENT_LIST[i].action);
			if (EVENT_LIST[i].enabled && EVENT_LIST[i].trigger == TRIGGER_MOUSE_CLICK && EVENT_LIST[i].condition()) {
				//render();
				EVENT_LIST[i].action();	
				render()	
				//render();
			}
		}
		//SelectEvent.enabled = true;
		//if (getGameState() == GAME_STATE_STOP){
		//	console.log("paused");
			//return;
		//} 

	});

	console.log("ready")
	//}
}

var drawGame = function(){
	var now = Date.now();
	var delta = now - then;
	
	
	then = now;
	
}

//if (PLAYER_ID.isPlaying()) {
//	//PLAYER_ID.nextState();
//}

var main = function(){
	
	//requestAnimationFrame(main);
	//printCursor();

}
