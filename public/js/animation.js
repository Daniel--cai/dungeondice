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
