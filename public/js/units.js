var UNITS = {}

UNITS['Teemo'] = {
	name: 'Teemo',
	hp: 30,
	atk: 10,
	def: 10,
	spells: SPELLS['Teemo']
}

UNITS['Soraka'] = {
	name: 'Soraka',
	hp: 20,
	atk: 10,
	def: 20,
	spells: SPELLS['Soraka'],
}

UNITS['Poppy'] = {
	name: 'Poppy',
	hp: 40,
	atk: 10,
	def: 10,
	spells: [],
}

UNITS['Garen'] = {
	name: 'Garen',
	hp: 30,
	atk: 20,
	def: 40,
		spells: []
}

UNITS['Lucian'] = {
	name: 'Lucian',
	hp: 20,
	atk: 30,
	def: 10,
	spells: SPELLS['Lucian'],
}

UNITS['Nasus'] = {
	name: 'Nasus',
	hp: 40,
	atk: 10,
	def: 20,
	spells:SPELLS['Nasus'],
}

UNITS['Braum'] = {
	name:'Braum',
	hp: 50,
	atk: 10,
	def: 10,
	spells:SPELLS['Braum']
}

UNITS['Ahri'] = {
	name: 'Ahri',
	hp: 30,
	atk:10,
	def:10,
	spells:SPELLS['Ahri']
}

UNITS['Sivir'] = {
	name: 'Sivir',
	hp: 20,
	atk:30,
	def:10,
	spells:SPELLS['Sivir']
}

UNITS['Darius'] = {
	name: 'Darius',
	hp: 30,
	atk:10,
	def:20,
	spells:SPELLS['Darius']
}

UNITS['Yasuo'] = {
	name: 'Yasuo',
	hp: 50,
	atk:20,
	def:30,
	spells:SPELLS['Yasuo']
}

UNITS['Kogmaw'] = {
	name: "Kogmaw",
	hp: 30,
	atk:20,
	def:20,
	spells:SPELLS['Kogmaw']
}

UNITS['Kogmaw'] = {
	name: "Kogmaw",
	hp: 30,
	atk:20,
	def:20,
	spells:SPELLS['Kogmaw']
}

UNITS['Sona'] = {
	name: "Sona",
	hp: 30,
	atk:20,
	def:20,
	spells:SPELLS['Sona']
}

UNITS['Janna'] ={
	name:"Janna",
	hp: 30,
	atk:20,
	def:20,
	spells:SPELLS['Janna']
}

UNITS['Vayne'] ={
	name:"Vayne",
	hp: 30,
	atk:30,
	def:10,
	spells:SPELLS['Vayne']
}

UNITS['Annie'] ={
	name:"Annie",
	hp: 30,
	atk:10,
	def:10,
	spells:SPELLS['Annie']
}

UNITS['Nunu'] ={
	name:"Nunu",
	hp: 50,
	atk:20,
	def:30,
	spells:SPELLS['Nunu']
}

UNITS['Bard'] ={
	name:"Bard",
	hp: 60,
	atk:10,
	def:10,
	spells:SPELLS['Bard']
}


class Unit {
	//idcounter++;
	constructor(player,type,point,level){
		this.player = player
		this.type = type
		this.name = type.name;
		this.point = point
		this.x = point[0];
		this.y = point[1];
		this.animx = point[0];
		this.animy = point[1];

		this.hp = type.hp;
		this.shield = [];
		this.maxhp = type.hp;
		this.atk = type.atk;
		this.def = type.def;
		this.statmod = [0,0,0]
		this.player = player;

		this.hasAttacked = false;
		this.canAttacked = true;
		this.atkcost = 1;
		this.atkrange = 1;
		this.buff = []
		this.exist = true;
		this.impairment = 0;
		this.spells = type.spells;
		this._path = [];
		this._buffer = []
		this._path = []
		if (level != null) this.level = level;
	}


	addShield(source, hp){
		this.shield.push([source,hp])
	}

	subtractShield(damage){

		while(damage > 0 && this.shield.length>0){

			var shield = this.shield.pop()
			console.log(shield)
			damage -= shield[1]
			console.log('shielding ' , shield[1])
			if (damage < 0){
				shield[1] = -damage
				console.log('leftover' , shield[1])
				this.shield.push(shield)
			} else {
				console.log('no more shield')
				this.removeBuff(shield[0].name)
			}
		}
		if (damage < 0) damage = 0;
		return damage
	}

	removeBuff(name){
		//onsole.log('removing ',name)
		//this._buffer.push(name)

		for (var j=this.buff.length-1; j>=0;j--){
			if(this.buff[j].name == name){
				//console.log('removing',this.buff[j].name)
				this.buff[j].fire('expire', {trigger:this})
				this.buff.splice(j,1)
				break;
			}
		}
	}

	clearBuff(){

		for (var i=0; i<this._buffer.length; i++){
			for (var j=0; j<this.buff.length;j++){
				if(this.buff[j].name == this._buffer[i]){
						console.log('clearing ',this.buff[j].name)
					this.buff[i].fire('expire', {trigger:this})
					this.buff.splice(i,1)
					break;
				}
			}
		}
	}

	addBuff(caster, buff){
		if (!caster) {console.log('caster null'); return false}
		if (!buff) {console.log('buff null'); return false}
		var index = this.hasBuff(buff.name)
		var prevStacks = 0;
		if (index != EMPTY){
			if (this.buff[index].stack != null){
				buff.stack = this.buff[index].stack + 1
			}
			this.buff.splice(index,1)
		}
		this.buff.push(buff);
		buff.owner = caster.id;
		buff.fire('apply', {trigger:this, caster:caster})

		return true
	}

	hasBuff(name){
			for (var i=0; i<this.buff.length;i++){
				if(this.buff[i].name == name){
					return i;
				}
			}
			return EMPTY;
	}

	attack(target){

		var d = manhattanDistance(this, target);

		if (!target.exist){
			console.log("Target is dead")
			return false;
		}

		if (this.player.getCrestPool(CREST_ATTACK) < this.atkcost){
			console.log("Not enough attack crest")
			return false;
		}

		if (d > this.atkrange){
			this.player.alert('Out of range')
			console.log("Out of range")

			//var socket = sockets[this.player.id]
			//socket.emit('alert', "Out of range");
			return false
		}
		if (this.hasAttacked) {
			console.log("Already attack")


			//var socket = sockets[this.player.id]
			//socket.emit('alert', "Already attacked");
			return false
		}
		//game = games[this.player.id]


		if (this.player.num == target.player.num) {
			console.log("Cannot attack allies")
			this.player.alert("Cannot attack allies")
			return false
		}
		game.combat = new Combat(this, target);
		console.log('attack')
		var event = {trigger:this, target:target, combat:game.combat}
		for (var i=this.buff.length-1; i>=0 ; i--){
			this.buff[i].fire('attack',event);
		}

		//game.combat.status.push(status)

		var event = {attacker: this, trigger: target, combat:game.combat}
		for (var i=target.buff.length-1; i>=0 ; i--){
			target.buff[i].fire('attacked', event)
		}

		//game.combat.status.push(status)

		if (sendSwitch){
			conn.send({id:'attack', trigger:this.id, target:target.id, guard:target.player.getCrestPool(CREST_DEFENSE) > 0})
		}
		if (target.player.getCrestPool(CREST_DEFENSE) > 0){
			console.log('waiting for opponent..guard')
			player.changeState(GAME_STATE_COMBAT)
			//game.combat.guard();
		} else {
			console.log('post attack')
			game.combat.postattack();
		}
		this.clearBuff()
		return true;
	}

	destroy(){
		console.log('Removing', this.name, this.id, 'hp:', this.hp)
		//var game = games[this.player.id]

		game.setUnitAtLoc(EMPTY, [this.x,this.y])
		//console.log('destroy',[this.x,this.y],getTileState(game.board,this.x,this.y))
		this.exist = false;
		//console.log(game.board.getUnitAtLoc(this.x,this.y))
		//game.monsters[this.id] = null
		//game.update('destroy unit', EMPTY, {unit:this, loc:[this.x,this.y]})
	}


	setLoc(x,y){
		console.assert(x != undefined, 'setLoc: null X value '+x)
		console.assert(y != undefined,'setLoc: null Y value '+y)
		game.board.units[y][x] = this.id;
		game.board.units[this.y][this.x] = EMPTY;
		this.x = x;
		this.y = y;
	}

	_finish(){
		var move = this._path[0];
		this.animx = move[0];
		this.animy = move[1];
		//this.x = move[0];
		//this.y = move[1];

		this.setLoc(move[0],move[1])
		//game.setUnitAtLoc(EMPTY,[this.x, this.y])
		//game.setUnitAtLoc(this.id,path[path.length-1])

		this._path.shift();

		var event = {trigger: this, location: this.path}
		for (var j=0; j<game.props.length; j++){
			if (game.props[j] && game.props[j].x == move[0] && game.props[j].y == move[1]){
				game.props[j].fire('collision',event);
			}
		}
	//	console.log('_finish')
	}

	update(dt){
		if (this._path.length == 0) return
		controlLock = true
		var move = this._path[0];
		//console.log(move)
		var dx = move[0]- this.animx;
		var dy = move[1] -this.animy ;
		var ms = 2;
		//console.log(this.x, this.y)
	//	console.log('upating!')
		if (dx != 0){

				this.animx = this.animx + dx/Math.abs(dx)*ms*dt;
				if (dx > 0 && this.animx >= move[0] || dx < 0 && this.animx <= move[0]){
					this._finish()
				}
		} else if (dy != 0){
			this.animy = this.animy + dy/Math.abs(dy)*ms*dt;
			if (dy > 0 && this.animy >= move[1] || dy < 0 && this.animy <= move[1]){
				this._finish()
			}

		} else {
			this._finish()
		}
		//console.log(this.animx,this.animy)
	}

	render(){
		var w = 1;
		//p = getCurrentPlayer()
		var bordersize = 0;
		if (player.unitSelected == this.id || opponent.unitSelected == this.id){
			w = 3;
			bordersize = 6;
		}
		var x = this.animx
		var y = this.animy

		ctx.fillStyle = black;
		if (this.player.num == 1){
			//ctx.fillStyle = blue;
		}

		//flip board
		if (player.num != this.player.num){
			//x = boardSizeX-x-1
			//y = boardSizeY-y-1
			//ctx.fillStyle = purple;

			//ctx.rotate(Math.PI/180);
		}


		game.board.colorPath(this._path)

		//
		if (IMAGES[this.name+'Square']){
			var nx = x*squareSize+bordersize/2;
			var ny = y*squareSize+bordersize/2
			var s = squareSize-bordersize
			var angle = Math.PI
			//console.log(angle)
			ctx.fillRect(x*squareSize,y*squareSize,squareSize,squareSize);
			//ctx.strokeRect(x,y,squareSize,squareSize);
			if (this.player.num == opponent.num){
				ctx.translate(nx,ny)
				ctx.rotate(angle);
				ctx.drawImage(IMAGES[this.name+'Square'],-s,-s,s,s);
				ctx.rotate(-angle);
				ctx.translate(-nx,-ny)
			} else {
					ctx.drawImage(IMAGES[this.name+'Square'],nx,ny,s,s);
			}
			ctx.drawImage(IMAGES['ButtonHUD'],nx,ny,s,s);

		} else {
			drawCircle(x, y,w, this.player);
		}


		if (player.num != this.player.num){
			//x = boardSizeX-x-1
			//y = boardSizeY-y-1
			//ctx.fillStyle = purple;

			//ctx.rotate(-Math.PI/180);
		}

	}

	movement(path, forced){
			//console.log('exist is ', this.exist)
			//var m = game.monsters[this.id]
			if (!this.exist){
				console.log('Moving a dead unit')
				return;
			}
			//var game = games[this.player.id]
			//console.log(this.x, this.y, loc)
			var board = game.board
			//var path = findPath(board,[m.x,m.y],loc);
			var plen = path.length;

			//console.log(plen-1,'<=',this.impairment + getCrestPool(this.player,CREST_MOVEMENT))
			//console.log(getCrestPool(this.player,CREST_MOVEMENT))
			//if (plen > 1 && plen-1 <= this.getCrestPool(CREST_MOVEMENT) - m.impairment) {
			if (!forced){
				var finish = function(m, path){
					//console.log('finished!', path)
					var plen =  path.length;
					var event = {trigger: m, x1:this.x, y1:m.y, x2:path[plen-1][0], y2:path[plen-1][1]}
					for (var i=0; i<m.buff.length; i++){
							m.buff[i].fire('move',event);
					}
				}
			}
			//animation.push({type:'move unit', unit:this, path:path , px:this.x, py:this.y, speed:5, duration:200, onfinish:finish, args:[this,path]})
			this._path = path;
			//game.setUnitAtLoc(EMPTY,[this.x, this.y])
			//game.setUnitAtLoc(this.id,path[path.length-1])
	}

}
