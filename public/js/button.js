var Buttons = [];
class Button {
  constructor(id, img, x, y,sx,sy,unit){
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
    this.img = img;
    Buttons.push(this);
  }

	//this.unit = unit;
	reset(){
		this.toggle = false;
		this.focus = false;
		this.unfocus = false
		//icePattern = [];
	}

	onFocus(x,y){
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
	onUnfocus(x,y){
		if (!this.focus) return;
		if (this.onUnfocus) this.onUnfocus()
		this.focus = false;
	}
}

function EventButtonClick(x,y){
	for (var i=0;i<Buttons.length; i++){
		var b = Buttons[i];
		if (b.hidden) continue;
		if (x >= b.x && x <= b.sx+b.x && y >= b.y && y <= b.sy+b.y) {
			if (b.onClick) b.onClick(x,y)
		}
	}
}

var EventButtonFocus = function(x,y){
	//player.diceButtonFocus = -1
	for (var i=0;i<Buttons.length; i++){
		var b = Buttons[i];
		if (b.hidden) continue;
		if (x >= b.x && x <= b.sx+b.x && y >= b.y && y <= b.sy+b.y) {
			b.onFocus(x,y);
		} else {
			b.onUnfocus(x,y);

		}
	}
}
