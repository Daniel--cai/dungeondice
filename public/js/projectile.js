function Projectile(x,y,dx,dy,caster){

  this.x = x;
  this.y = y;
  this._x = x;
  this._y = y;
  this.dx = dx;
  this.dy = dy;
  this.size = 30
  this.speed = 2;
  this.dir = 0;
  this.img = IMAGES['Orb of Deception Sprite']
  this.caster = caster;
  this.collision = []
  this.delay = 0;
  this.clear = true;
  this.update = function(dt){

    if (this.delay > 0) return;
    var dx = this.dx - this.x
    var dy = this.dy - this.y
    if (dx < 0) dx = -1;
    if (dx > 0) dx = 1;
    if (dy < 0) dy = -1;
    if (dy > 0) dy = 1;

    //console.log(dx,dy)

    var m = game.board.getUnitAtLoc(Math.floor(this._x), Math.floor(this._y))
    if (m != util.EMPTY && this.collision.indexOf(m) == util.EMPTY){
      this.collision.push(m)
      console.log(m)
      this.fire('collision', {trigger:game.monsters[m], caster:this.caster})
    }

    if (dx < 0 && this._x <= this.dx || dx > 0 && this._x >= this.dx || dy < 0 && this._y <= this.dy || dy > 0 && this._y >= this.dy ){
      this.fire('finish', {})
      if (this.clear)
        this.destroy()
    }

    this._x += dx*dt*this.speed
    this._y += dy*dt*this.speed


  }

	this.callbacks = {}
	this.on = function(event, callback){
		this.callbacks[event] = callback;
	}

	this.fire = function(event){
		if (!this.callbacks.hasOwnProperty(event)){
			return;
		}
		var args = Array.prototype.slice.call( arguments );
		var topic = args.shift();
		//console.log('topic is',topic)
		var boolean = this.callbacks[event].apply(undefined, args)
	}

  this.render = function(){
    ctx.drawImage(this.img, this._x*squareSize, this._y*squareSize, this.size,this.size)
  }

  this.destroy = function(){
    window.projectiles.splice(window.projectiles.indexOf(this),1)
  }

  window.projectiles.push(this)
  return this
}
