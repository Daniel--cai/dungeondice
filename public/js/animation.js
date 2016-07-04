class Animation {
  constructor(){
    this.duration = 0;
    this.timeElapsed = 0;
    this.repeat = 0;
    this.delay = 0;
    if (!Animation.hasOwnProperty('list')){
      Animation.list = []
    }
    Animation.list.push(this)
  }

  update(dt){
    if (this.delay > 0 ){
      this.delay -= dt
    }

    if (!this.running()) return

    if (this.timeElapsed == 0){
      this.start()
    }

    this.timeElapsed += dt;
    if (this.finished()){
      this.end()
    } else {

    }
    this.periodic(dt)
  }

  periodic(dt){}

  render(){}
  start(){}
  end(){}
  running(){
    return (this.delay <= 0)
  }

  finished(){
    return (this.timeElapsed >= this.duration)
  }



}

class Move extends Animation {
  constructor(unit, path){
    super()
    this.path = path;
    this.px = EMPTY
    this.py = EMPTY
    this.unit = unit
    this.speed  = 5
    this.duration = 100;
    this.pcounter = 0
  }

  periodic(dt){

    if (this.pcounter == this.path.length){
      this.timeElapsed = this.duration
      this.end()
      return
    }

    let move = this.path[this.pcounter]
    //console.log(this.px, this.py, this.path[this.pcounter])
    if (this.px == EMPTY ){
      this.px = this.unit.x
      this.py = this.unit.y
    }

    var dx = move[0] - this.px
    var dy = move[1] - this.py

    var done = false;

    if (dx != 0){

      this.unit.animx = this.unit.animx + dx*this.speed*dt;

      if ((dx > 0 && this.unit.animx >= move[0] )|| (dx < 0 && this.unit.animx <= move[0])){
        done = true;

      }
    } else if (dy != 0) {

      this.unit.animy = this.unit.animy + dy*this.speed*dt;
      if ((dy > 0 && this.unit.animy >= move[1] )|| (dy < 0 && this.unit.animy <= move[1])){
        done = true;

      }
    } else {
      done = true
    }

    if (done == true){
      this.px = move[0];
      this.py = move[1];
      this.unit.setXY(move[0],move[1])
      this.pcounter++
    }
  }

  end(){
    var event = {trigger: this.unit, path:this.path}
    for (var i=0; i<this.unit.buff.length; i++){
        this.unit.buff[i].fire('move',event);
    }
    var end = this.path[this.path.length-1]
    this.unit.setBoardXY(end[0],end[1])
    this.unit.path = []
  }
}


class FloatText extends Animation {
  constructor(text, x,y){
    super()
    this.x = x
    this.y = y
    this.duration = 0.75;
    this.color = white
    this.dy = -25
    this.text = text
  }

  periodic(dt){
    this.y = this.y+ dt*this.dy;
  }
  render(){
		ctx.globalAlpha = this.duration*2;
	  ctx.fillStyle = this.color;
		ctx.font = "20px Arial";
		//console.log(a.text)
		ctx.fillText(this.text,this.x, this.y)
		ctx.globalAlpha = 1;
  }
}


class DiceRoll extends Animation{
    //animation.push({type:'dice', speed:1, accel:5, x:x+i*dx,y:y, size:size, duration:2+i*0.5, index:0, dice:player.dices[data[i]].pattern});

    constructor(index,pattern,result){
	super()
	this.size = 50;
	var gap = 75;
	this.speed = 1;
	this.accel = 5;
	this.x = (100+boardXPadding+this.size/2)+index*gap;
	this.y = 200 + boardYPadding + this.size/2;
	console.log(this.x,this.y)
	this.duration = 2+index*0.5;
	this.index = 0;
	this.dice = pattern;
	this.result = result;
	this.state = 0;
	this.i = index;
    };

    periodic(dt){
	if (this.speed < 20) this.speed = this.speed + this.accel*dt
	this.index = (this.index + dt*this.speed)%6;
    };

    render(){
	var crest = this.dice[Math.floor(this.index)][0]
	var nextcrest = this.dice[(Math.floor(this.index)+1)%6][0]
	var size = this.size * (1-this.index+Math.floor(this.index));
        ctx.translate(this.x-this.size/2, this.y- this.size/2);
        ctx.drawImage(IMAGES['New Crest'][crest],0,0,this.size,size)
        ctx.drawImage(IMAGES['New Crest'][nextcrest],0,this.size*(1-this.index+Math.floor(this.index)),this.size,this.size *  (this.index-Math.floor(this.index)))
        ctx.translate(-(this.x-this.size/2), -(this.y-this.size/2))
    }
    end(){
        var grow = new DiceGrow(this.i, this.result[this.i][0]);

    }
	

};

class DiceGrow extends Animation {
    constructor(index,crest,shrink){
        super()
        var size = this.size = 50;
	var x = 100 + boardXPadding+size/2;
	this.dx = this.dy = 100;
	var y = 200+boardYPadding+size/2;
	
	var gap = 75;
	this.x = (100+boardXPadding+this.size/2)+index*gap;
	this.y = 200 + boardYPadding + this.size/2;
	console.log(this.x,this.y)

	this.duration = 2+index*0.5;
	console.log('duration is', this.duration)
        
    	this.sx = this.sy = 0;
	if (shrink){
	}
	//this.msx = this.msy = size;
	//this.delay = 1+0.5*index;
	console.log(crest)
	this.crest = crest
    }
    periodic(dt){
        if (this.dx)	{
            this.sx = this.sx+ dt*this.dx;//this.x -= (dt*this.dx)/2
	}
	if (this.dy) {
	    this.sy = this.sy+ dt*this.dy;
            //this.y -= (dt*this.dy)/2
	}

        if (this.sx >= this.size) this.sx = this.size;
	if (this.sy >= this.size) this.sy = this.size;
	if (this.sx <= 0) this.sx = 0;
	if (this.sy <= 0) this.sy = 0;

    }
    render(){
	var x = this.x-this.sx/2
	var y = this.y-this.sy/2
	ctx.translate(x,y);
	if (this.crest != null){
	    //console.log('drawing at', x,y, this.size, this.crest);
            ctx.drawImage(IMAGES['New Crest'][this.crest],0,0,this.sx,this.sy)
	    //ctx.drawImage(this.image,CresCoord[this.crest][0],CrestCoord[this.crest][1],35,35, 0,0,this.sx,this.sy)
	} else {
	    //ctx.drawImage(this.image,0,0,this.sx, this.sy)
	}
	if (this.text != null){
	    drawText(this.text,"bolder 30px Arial", this.tx,this.ty)
	}
	ctx.translate(-x,-y)
    }

}
