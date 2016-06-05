
class Projectile{
  constructor(x,y,dx,dy,caster){
    this.x = x;
    this.y = y;
    this._x = x;
    this._y = y;
    this.dx = dx;
    this.dy = dy;
    this.size = 30
    this.speed = 5;
    this.dir = 0;
    this.img = IMAGES['Orb of Deception Sprite']
    this.caster = caster;
    this.collision = []
    this.delay = 0;
    this.target = false;
    this.range = manhattanDistance({x:x, y:y}, {x:dx, y:dy});
    this.callbacks = {}
    game.projectiles.push(this)
  }


  update(dt){
    if (this.delay > 0) return;
    var dx = this.dx - this.x
    var dy = this.dy - this.y

    var x = this._x;
    var y = this._y;

    if (dx < 0) dx = -1

    if (dx > 0) dx = 1

    if (dy < 0) dy = -1

    if (dy > 0)  dy = 1

    x = positionAdjustment(x, dx)
    y = positionAdjustment(y, dy)

    //console.log(dx,dy)
    //var x = Math.floor(this._x)
    //var y = Math.floor(this._y)

    var m = game.board.getUnitAtLoc(x,y)

    var p = game.prop
    if ((m != EMPTY && this.collision.indexOf(m) == EMPTY) || (this.target &&  this.dx == x && this.dy == y)){
      this.collision.push(m)
      console.log(this.target, this.dx, this.y, this.range,m, x,y)

      for (var i =0; i<game.monsters[m].buff.length; i++){
        game.monsters[m].buff[i].fire('spell hit',{proj:this})
      }
      if (game.projectiles.indexOf(this) == EMPTY) return;

      this.fire('collision', {trigger:game.monsters[m], caster:this.caster})
    }

    if (this.target || this.dx == x && this.dy == y){
      this.fire('finish', {})
      this.destroy()
    }
    this._x += dx*dt*this.speed
    this._y += dy*dt*this.speed
  }

	on(event, callback){
		this.callbacks[event] = callback;
	}

	fire(event){
		if (!this.callbacks.hasOwnProperty(event)){
			return;
		}
		var args = Array.prototype.slice.call( arguments );
		var topic = args.shift();
		//console.log('topic is',topic)
		var boolean = this.callbacks[event].apply(undefined, args)
	}

  render(){
    ctx.drawImage(this.img, this._x*squareSize, this._y*squareSize, this.size,this.size)
  }

  destroy(){

    game.projectiles.splice(game.projectiles.indexOf(this),1)
  }
}
