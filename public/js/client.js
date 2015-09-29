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
//var summonButton = document.getElementById("summon");

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

var GAME_STATE_ROLL = 0;
var GAME_STATE_SUMMON = 1;
var GAME_STATE_UNIT = 2;
var GAME_STATE_SELECT = 3;
var GAME_STATE_END = 4;


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

function disableButtons(a,b,c){
		rollButton.disabled = a;
		hideSummonButton(b)
		//summonButton.disabled = b;
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
		if (i == 0){
			ctx.fillStyle = black;
		} else if (player.num == PLAYER_1){
			ctx.fillStyle = purple;
		} else if (player.num == PLAYER_2){
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

var Buttons = [];

function drawButton(){
	for (var i=0; i< Buttons.length; i++){
		if (!Buttons[i].hidden){
			Buttons[i].render();
		}
	}
}


var Event_Button_Focus = function(x,y){
	if (player.state == GAME_STATE_ROLL || GAME_STATE_SUMMON){
		for (var i=0;i<Buttons.length; i++){
			var b = Buttons[i];
			if (b.hidden) continue;
			b.onFocus(x,y);
			b.onUnfocus(x,y);
		}
	}
}

var Event_Button_Click = function(x,y){
	if (player.state == GAME_STATE_ROLL || GAME_STATE_SUMMON){
		for (var i=0;i<Buttons.length; i++){
			var b = Buttons[i];
			if (b.hidden) continue;
			b.onClick(x,y)
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
	this.id = id;
	this.unit = unit;
	this.onFocus = function(x,y){

		if (this.focus) return;
		//console.log(x,y, b.x, b.y, b.wx, b.hy)
		if (x >= this.x && x <= this.sx+this.x && y >= this.y && y <= this.sy+this.y) {
			if (player.state == GAME_STATE_ROLL){
				this.focus = true;
			} 
			render();
		}
	}
	this.onUnfocus = function(x,y){
		if (!this.focus) return;
		if (this.toggle) return;
		if (x < this.x || x > this.sx+this.x || y < this.y || y > this.sy+this.y) {
			if (player.state == GAME_STATE_ROLL){
				this.focus = false;
			} 
			render();
		}
	}
	this.onClick = function(x,y){
		if (x >= this.x && x <= this.sx+this.x && y >= this.y && y <= this.sy+this.y) {
			if (player.state == GAME_STATE_ROLL){
	
				if (this.toggle){
					this.toggle = false;
					DiceSelection.splice(DiceSelection.indexOf(this),1);
					this.onUnfocus(x,y);	
				} else {
					this.toggle = true;
					DiceSelection.unshift(this);
					if (DiceSelection.length > 3){
						var b = DiceSelection.pop();
						b.toggle = false;
						b.onUnfocus(x,y);
					}	
				}

			} else if (player.state == GAME_STATE_SUMMON ){
				if (DiceSelection.indexOf(this) != EMPTY){
					summonToggle = this;
					socket.emit('c_summonoption', 1)
				}
			}
			//if (DiceSelection.length == 3){
			//	disableButtons(false,true,true);
			//	console.log("on")
			//} else {
			//	console.log("of")
			//	disableButtons(true,true,true);
			//}
			update()
		}	

		//console.log("button " + this.name + " " + this.toggle)
	}
	this.img = img;
	

	this.render = function(){
		ctx.globalAlpha = 0.25;
		if (player.state == GAME_STATE_ROLL || player.state == GAME_STATE_SUMMON){
			var mod = 0;
			if (player.state == GAME_STATE_ROLL){
				ctx.globalAlpha = 1;
			}

			if (this.focus){
				mod = 3;
			}

			if (this.toggle){
				ctx.globalAlpha = 1;
				if (player.state == GAME_STATE_ROLL){
					ctx.fillStyle = black;
				} else if (player.state == GAME_STATE_SUMMON){
					if (summonToggle == this){
						ctx.fillStyle = black;
					} else {
						ctx.fillStyle = white;
					}
				}
				ctx.fillRect(this.rx-(mod*2),this.ry-(mod*2), this.sx+4*mod,this.sy+4*mod);
			}
			drawCrest(CREST_SUMMON, this.rx-mod,this.ry-mod, this.sx+(2*mod), this.sy+(2*mod))
		} else {
			drawCrest(CREST_SUMMON, this.rx,this.ry, this.sx, this.sy)
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
/*
summonButton.addEventListener("click", function(){
	console.log("summon");	
	//this.state = PLAYER_STATE_SUMMON;
	//setGameState(TILE_PLACEMENT);
	//rollButton.disabled = true;
	//summonButton.disabled = true;
	//endturnButton.disabled = true;
	hideSummonButton(false);
});
*/
for (var i=0; i<3; i++){
	summonOptionButton[i].hidden = true;	
	//console.log(i);
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
	for (i=0; i<DiceSelection.length; i++){
		DiceSelection[i].toggle = false;
		DiceSelection[i].onUnfocus(9999,9999);
	}
	DiceSelection = []
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
    //var dices = [Dice_Teemo, Dice_Soraka, Dice_Teemo];
    //var summonlevel = 0;
    //var summon = [[],[],[],[]];
    //update crestpool
    socket.emit('c_roll', [for (d of DiceSelection) d.id])
    socket.on('s_roll', function(data){
    	//console.log(data);
    	updateCrest(data.pool);
    	var string = "";
    	if (data.summon.length > 0){
    		//console.log(data.summon)
    		string += "Summoning level: " + data.level + "<br\>";
      		summonNames = data.summon; 
      		
      		//this.summon = summon[summonlevel];
    	}
    	//for (var i=0; i<data.gain.length; i++){
    	//	if (data.gain[i]){
    	//		string += "+" + data.gain[i] + CREST_TEXT[i] + "<br\>" 
    	//	}
    	//}
    	//disableButtons(true,false,false)
		setDicePanelText(string);
    })
})

function hideSummonButton(boolean){
	
	if (boolean){
		for (var i=0; i<3; i++){
			summonOptionButton[i].hidden = true;
		}
	} else {
		
		for (var i=0;i<player.summon.length; i++){
			summonOptionButton[i].innerHTML = player.summon[i].type.name;
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

var render = function(){
	//console.log("rendering")
	ctx.clearRect(0,0,canvas.width,canvas.height)
	drawBoard();
	drawUnits();
	drawButton()
	drawSelection(player);
	drawSelection(opponent);
	drawPath();
	//drawCrest(CREST_TRAP, 500, 500)


}

function update(){
	//console.log(player.tileSelected);
	updateCrest(player.pool.pool);
	var m = getUnitOnCursor(cursorX,cursorY);
	if (m){
		//console.log(m.name +" "+m.hp)
		setStatePanelText(m)
	}
	render();
	player.dices = Buttons;

	if (player.state == GAME_STATE_END){
		disableButtons(true,true,true)
	} else if (player.state == GAME_STATE_ROLL){
		if (DiceSelection.length == 3){
			disableButtons(false,true,true)
		} else {
			disableButtons(true,true,true)
		}
	} else if (player.state == GAME_STATE_SUMMON){
		disableButtons(true,false,false)
	} else if (player.state == GAME_STATE_UNIT) {
		disableButtons(true,true,false)
	//} else if (player.tileSelected.length <=0){
	//	hideSummonButton(true);
	//	disableButtons(true,true,false)
	} 
}

socket.on('updategame', function(data){
	if (!game){
		playerPanel.innerHTML += " player: " + data.pnum;
		init();
	}
	PLAYER_ID = data.pnum
	game = data.game;
	//console.log(data.pnum)
	opponent = game.players[0];
	player = game.players[data.pnum];
	if (data.pnum == 0){
		opponent = game.players[1];
	}

	update()
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
	 
	    Event_Button_Focus(e.pageX, e.pageY);
		
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
		Event_Button_Click(e.pageX, e.pageY);
		
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
