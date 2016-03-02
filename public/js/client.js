//var socket = io();
var socket = new WebSocket(location.origin.replace(/^http/, 'ws'));
var socketid;

PLAYER_STATE_NEUTRAL = 0;
PLAYER_STATE_MOVE = 1;
PLAYER_STATE_ATTACK = 2;
PLAYER_STATE_SPELL_TARGET = 3;



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
		/*
		for (var i=0; i<data.length; i++){
			if (data[i][0] != CREST_SUMMON){
				string += "+" + data[i][1] + CREST_TEXT[data[i][0]] + "<br\>" 
			}
		}*/
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
		console.log('updating', data.type)
		if (data.type == 'unit location'){
			if (data.data.unit != util.EMPTY){
		      game.monsters[data.data.unit].x = data.data.loc[0]
		      game.monsters[data.data.unit].y = data.data.loc[1]
		    }
			game.board.units[data.data.loc[1]][data.data.loc[0]] = data.data.unit;
			
		}

		var p1 = data.num != util.EMPTY ? game.players[data.num] : null;
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
		    var state = data.data;
		    p1.state = state;
		    p1.unitSelected = util.EMPTY;
		    p1.movePath = []
		    p1.tileSelected = []
		    if (state == util.GAME_STATE_END){
		      p1.summoned = false;
		      p1.rolled = false;
		      p1.summon = [];
		      p1.summonlevel = 0;
		      p1.shape = 0;
		      p1.rotate = 0;
		      p1.valid = false;
		      p1.spell = util.EMPTY

		      for (var i=0; i<game.monsters.length;i++){
		        if (!game.monsters[i].exist) continue;
		        if (game.monsters[i].player.num == this.num){
		          game.monsters[i].hasAttacked = false;
		          game.monsters[i].canAttacked = true;
		        }
		      }

			}
			update()
		}

		render()
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
		update()
		render();
	}
	



}

var canvas = document.getElementById("games");
//var switchButton = document.getElementById("switch");
//var summonButton = document.getElementById("summon");

var rollButton = document.getElementById("roll");
var endturnButton = document.getElementById("endturn");
var yesButton = document.getElementById('yesguard');
var noButton = document.getElementById('noguard');

var moveButton = document.getElementById('move');
var attackButton = document.getElementById('attack');
var abilityButton = document.getElementById('ability');
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
var spellState = -1;
var movePath = []
//var movementButton = document.getElementById("movement")

var ctx = canvas.getContext("2d");
content.hidden = true;


var squareSize = 30;
//var util.boardSizeX = 13;
canvas.width = 580;
canvas.height =580;
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
		spellState = -1;
}

function disableButtons(a,b,c,d){
		rollButton.disabled = a;
		yesButton.hidden = b;
		noButton.hidden = b;
		
		//hideSummonButton(b)
		//summonButton.disabled = b;
		endturnButton.disabled = c;
		if (d == null) d = true;


		moveButton.hidden = d;
		attackButton.hidden = d;
		abilityButton.hidden = d;

		moveButton.disabled = d;
		attackButton.disabled = d;
		abilityButton.disabled = d;

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
		} else if (player.num == util.PLAYER_1){
			ctx.fillStyle = purple;
		} else if (player.num == util.PLAYER_2){
			ctx.fillStyle = blue;	
		}
		//console.log(game.board)
		if (!player.valid){
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
	if (player.state != exports.GAME_STATE_SELECT) return;
	var movePathSelection = movePath;
	//console.log(movePathSelection)

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

//var AlertText = "";

var Timeout = null;
var TimeoutReady = true;
var TimeoutAlpha = 0;
var AlertText = "";
var DialogText = "sdf";

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
	render();
	
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

		} else if (player.state == util.GAME_STATE_SUMMON ){
			if (this.toggle){
				summonToggle = this;
				console.log('summoinining')
				socket.send(JSON.stringify({id:'c_summonoption', data:this.id}))
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
			

		//console.log("button " + this.name + " " + this.toggle)
	}
	this.img = img;
	

	this.render = function(){
		ctx.globalAlpha = 0.25;
		if (player.state == util.GAME_STATE_ROLL || player.state == util.GAME_STATE_SUMMON){
			var mod = 0;
			if (player.state == util.GAME_STATE_ROLL){
				ctx.globalAlpha = 1;
			}

			if (this.focus){
				mod = 3;
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
				ctx.fillRect(this.rx-(mod*2),this.ry-(mod*2), this.sx+4*mod,this.sy+4*mod);
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


function actionButtonEffect(button) {
	//socket.send(JSON.stringify({ id:'action', data:button}));
	disableSpell(button != 'ability')
}

function spellButtonEffect(button){
	if (!game.monsters[player.unitSelected].spells[button].target){
		socket.send(JSON.stringify({ id:'cast', data:button}));
	} else {
		spellState = button;
	}
}

function responseButton(button){
	socket.send(JSON.stringify({ id:'guard response', data:button}));
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

abilityButton.addEventListener("click", function(){
	disableSpell(false);

})

moveButton.addEventListener("click", function(){
	actionButtonEffect('move')

})

attackButton.addEventListener("click", function(){
	actionButtonEffect('attack')
	//socket.send(JSON.stringify({ id:'action', data:'attack'}));
})

abilityButton.addEventListener("click", function(){
	actionButtonEffect('ability')
	//socket.send(JSON.stringify({ id:'action', data:'ability'}));
})

cancelButton.addEventListener("click", function(){
	//socket.send(JSON.stringify({ id:'action', data:'cancel'}));
	disableSpell(true);
})


endturnButton.addEventListener("click", function(){
	socket.send(JSON.stringify({id:'end turn'}));
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
    socket.send(JSON.stringify({id:'c_roll', data:data}))
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





var drawBoard = function(){
	//console.log('drawing board')
	ctx.strokeStyle = "#ffffff";
	ctx.lineWidth = 1;
	//ctx.shadowBlur = 5;
	//ctx.shadowColor = "grey";
	//board[6][7] =  1;
	/*
	var verticalFlip = player.num == 0;
	var dx = dy = 0;
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
			if (getBoardState(i,j)== util.PLAYER_1){
				ctx.fillStyle = purple;
				ctx.strokeStyle = purple
			} else if (getBoardState(i,j) == util.PLAYER_2){
				ctx.fillStyle = blue;	
				ctx.strokeStyle = blue
			} else {
				continue;
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
		if (p.player.num == 0){
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
		var w = 1;
		//p = getCurrentPlayer()
		if (!m.exist){
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


		var m = getUnitOnCursor(cursorX,cursorY);
		if (m){
			//console.log(m);
			setStatePanelText(m)
			if (m.player.id != player.id && player.unitSelected != util.EMPTY){
				//changeCursor("crosshair")
			} else {
				//changeCursor("default")
			}
		//} else if (player && player.unitSelected){
		//	setStatePanelText(player.unitSelected)
		} else {
			setStatePanelText("")
		}

		if (game.turn%2 != player.num) return
		if (player.state != util.GAME_STATE_SUMMON) return
		if (boundCursor(cursorX,cursorY))
			socket.send(JSON.stringify({id :'mouse move', data:{X:cursorX, Y:cursorY}}))

	});




new Event(TRIGGER_MOUSE_CLICK,
	function(){
		if (game.turn%2 != player.num) return
		var u = util.getUnitAtLocation(game.board,cursorX,cursorY)
	
		if (player.state == util.GAME_STATE_UNIT){
			if (u == util.EMPTY) return;
     		socket.send(JSON.stringify({id:'mouse click', data:{state: 'select', loc:[cursorX, cursorY]}}))
     		var m = game.monsters[u]
			movePath = util.findPossiblePath(game.board,[m.x, m.y],exports.getCrestPool(player,CREST_MOVEMENT))
     	} else if (player.state == util.GAME_STATE_SELECT){
 
     		if (u == util.EMPTY){
     			socket.send(JSON.stringify({id:'mouse click', data:{state:'move', loc:[cursorX, cursorY]}}))
     		} else if (u == player.unitSelected){
  				socket.send(JSON.stringify({id:'mouse click', data:{state: 'select', loc:[cursorX, cursorY]}})) 			
     		} else {
     			socket.send(JSON.stringify({id:'mouse click', data:{state: 'attack', loc:[cursorX, cursorY]}})) 	
     		}
     	} else if (player.state == util.GAME_STATE_SUMMON){
     		socket.send(JSON.stringify({id:'tile place',data:{loc:[cursorX, cursorY]} })) 	
     	}
		
		render();
	  //var game = games[socketid]
      //var player = getCurrentPlayer(socketid)

    
      /*
      var c_tilesplace = function (){
		  //var game = games[socket.id]
		  //var p1 = getCurrentPlayer(socket.id)
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
		    p1.state = util.GAME_STATE_UNIT;
		    socket.emit('alert', 'Action Phase')
		    //update(game);
		  }
	  }
		
      if (player.state == util.GAME_STATE_SUMMON){
        console.log("tile place")
        c_tilesplace();
      } else if (player.state == util.GAME_STATE_SELECT){
      	console.log("selecting")
          c_actionunit(game, player);    
      } else if (player.state == util.GAME_STATE_UNIT){
      	console.log("unit")
        c_selectunit();
      } 
      */
      //update(game)

	});





function manhattanDistance(point, goal){
	return Math.abs(point.x - goal.x) + Math.abs(point.y- goal.y);
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

	function validWalk(x, y){
		return boundCursor(x,y) && !isUnitOnCursor(x,y) && getBoardState(x,y) != util.EMPTY;
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


var render = function(){
	//console.log("rendering")
	ctx.clearRect(0,0,canvas.width,canvas.height)
	
	drawBoard();
	drawUnits();
	drawProps();
	drawButton()
	
	drawDicePattern();
	drawSelection(player);
	drawSelection(opponent);
	drawPath();
	drawAlert();
	drawDialog();
	updateCrest(player.pool);
}

function update(){
	//console.log(player.tileSelected);
	
	var m = getUnitOnCursor(cursorX,cursorY);
	DialogText = ""
	if (m){
		setStatePanelText(m)
	}

	for (i=0; i<15; i++){
		if (!player.dices[i]){
			Buttons[i].hidden = true;
		}
	}

	if (player.state == util.GAME_STATE_END){
		disableButtons(true,true,true)
		disableSpell(true)
		for (i=0;i<15;i++) Buttons[i].reset();
		DiceSelection = [];
	} else if (player.state == util.GAME_STATE_ROLL){
		disableSpell(true)
		if (DiceSelection.length == 3){
			disableButtons(false,true,true)
		} else {
			disableButtons(true,true,true)
		}

	} else if (player.state == util.GAME_STATE_SUMMON){
		disableButtons(true,true,false)
		disableSpell(true)
		for (i=0;i<15;i++) Buttons[i].reset();
		for (i=0;i<player.summon.length;i++) {
			Buttons[player.summon[i]].toggle = true;
			Buttons[player.summon[i]].focus = true;
		}
	} else if (player.state == util.GAME_STATE_UNIT) {
		disableButtons(true,true,false)
		disableSpell(true)
		if (game.turn%2 != player.num){
			disableButtons(true,true,true)
		}
		canvas.style.cursor = "default";
		var m = getUnitOnCursor(cursorX, cursorY)
		if (m && m.player.id == player.id){
			canvas.style.cursor = "pointer";	
		}


	} else if (player.state == util.GAME_STATE_SELECT) {
		canvas.style.cursor = "default";
		disableButtons(true,true,false,false)
		if (game.turn%2 != player.num){
			disableButtons(true,true,true)
		}
	
	} else if (player.state == util.GAME_STATE_COMBAT) {
		disableSpell(true)
		if (!game.combat) {
			console.log('combat missing!')
			return
		}
		if (game.combat.unit.player.num != player.num){
			disableButtons(true,false,true);
			DialogText = "Use a defense crest?"
		} else {
			disableButtons(true,true,true);
			DialogText = "Waiting for opponent..."
		}

		//console.log(game.combat);
	}
}

//socket.on('guard trigger', function(){
//	console.log("to guarding");
//})

var PLAYER_ID = -1;
var player;
var opponent;



var init = function (){
	content.hidden =  false;
	console.log('init')
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
			if (EVENT_LIST[i].enabled && EVENT_LIST[i].trigger == TRIGGER_MOUSE_MOVE) {
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
			if (EVENT_LIST[i].enabled && EVENT_LIST[i].trigger == TRIGGER_MOUSE_CLICK) {
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
	drawGame();
	console.log("ready")
	//}
}

var Second = 0;

var drawGame = function(){

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