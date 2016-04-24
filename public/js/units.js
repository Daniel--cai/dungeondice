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
	def:20,
	spells:SPELLS['Yasuo']
}

UNITS['Kogmaw'] = {
	name: "Kogmaw",
	hp: 30,
	atk:20,
	def:20,
	spells:SPELLS['Kogmaw']
}

function Unit(player, type, point, level) {
	//idcounter++;
	this.name = type.name;
	this.type = type;
	this.x = point[0];
	this.y = point[1];
	this.animx = point[0];
	this.animy = point[1];
	this.hp = type.hp;
	this.shield = 0;
	this.maxhp = type.hp;
	this.atk = type.atk;
	this.def = type.def;
	this.statmod = [0,0,0]
	this.player = player;
	if (level) this.level = level;
	this.hasAttacked = false;
	this.canAttacked = true;
	this.atkcost = 1;
	this.atkrange = 1;
	this.buff = []
	this.exist = true;
	this.impairment = 0;
	this.spells = type.spells;
	this.animations = [];
	this._buffer = []

	this.removeBuff = function(name){
		//onsole.log('removing ',name)
		//this._buffer.push(name)

		for (var j=this.buff.length-1; j>=0;j--){
			if(this.buff[j].name == name){
				console.log('removing',this.buff[j].name)
				this.buff[j].fire('expire', {trigger:this})
				this.buff.splice(j,1)
				break;
			}
		}
	}

	this.clearBuff = function(){

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

	this.addBuff = function(caster, buff){
		if (!caster) {console.log('caster null'); return false}
		if (!buff) {console.log('buff null'); return false}
		for (var i = 0; i<this.buff.length; i++){
			if (this.buff[i].name == buff.name){
				this.buff.splice(i,1);
				break;
			}
		}
		this.buff.push(buff);
		buff.owner = caster.id;
		buff.fire('apply', {trigger:this, caster:caster})

		return true
	}

	this.hasBuff = function(name){
			for (var i=0; i<this.buff.length;i++){
				if(this.buff[i].name == name){
					return i;
				}
			}
			return util.EMPTY;
	}

	this.attack = function(target){

		var d = util.manhattanDistance(this, target);

		if (!target.exist){
			console.log("Target is dead")
			return false;
		}

		if (util.getCrestPool(this.player, CREST_ATTACK) < this.atkcost){
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
			this.player.alert('Already attacked')

			//var socket = sockets[this.player.id]
			//socket.emit('alert', "Already attacked");
			return false
		}
		//game = games[this.player.id]


		if (this.player.num == target.player.num) {
			console.log("Cannot attack allies")
			this.player.alert("Cannot attack allies")

			//var socket = sockets[this.player.id]
			//socket.emit('alert', "Already attacked");
			return false
		}
		game.combat = new Combat(this, target);
		//sendAll(game, {id:'combat', data:game.combat})
		console.log('attack')
		//animation.combat = {attacker:this, target:target, dt:0, finish:false};
		//animation.push({image:IMAGES[this.name], x:0, y:0, dx:500, effect:'pan', duration:0.5})

		//var ubuffs = JSON.parse(JSON.stringify(this.buff))
		//var ubuffs =  this.buff.splice(0)

		//var tbuffs =  target.buff.splice(0)
		var event = {trigger:this, target:target}
		for (var i=this.buff.length-1; i>=0 ; i--){
			this.buff[i].fire('attack',event);
		}

		game.combat.status.push(status)

		var event = {attacker: this, trigger: target}
		for (var i=target.buff.length-1; i>=0 ; i--){
			target.buff[i].fire('attacked', event)
		}

		game.combat.status.push(status)

		if (sendSwitch){
			conn.send({id:'attack', trigger:this.id, target:target.id, guard:util.getCrestPool(target.player,CREST_DEFENSE) > 0})
		}
		if (util.getCrestPool(target.player,CREST_DEFENSE) > 0){
			console.log('waiting for opponent..guard')
			player.changeState(util.GAME_STATE_COMBAT)
			//game.combat.guard();
		} else {
			console.log('post attack')
			game.combat.postattack();
		}
		this.clearBuff()
		return true;
	}

	this.destroy = function(){
		console.log('Removing', this.name, this.id, 'hp:', this.hp)
		//var game = games[this.player.id]

		game.setUnitAtLoc(util.EMPTY, [this.x,this.y])
		//console.log('destroy',[this.x,this.y],util.getTileState(game.board,this.x,this.y))
		this.exist = false;
		//console.log(game.board.getUnitAtLoc(this.x,this.y))
		//game.monsters[this.id] = null
		//game.update('destroy unit', util.EMPTY, {unit:this, loc:[this.x,this.y]})
	}



	this.update = function(dt){

		if (this.animations.length == 0) return

		var move = this.animations[0];
		//console.log(move)
		var dx = move[0]- this.animx;
		var dy = move[1] -this.animy ;
		var ms = 10;

		//console.log(this.animx,move[0])
		//console.log(this.y,move[1])
		if (dx != 0){
				//console.log(dx/Math.abs(dx))
				this.animx = this.animx + dx/Math.abs(dx)*ms*dt;
				if (dx > 0 && this.animx >= move[0] || dx < 0 && this.animx <= move[0]){
					this.animations.shift();
					//this.x = move[0]
					this.animx = move[0]
					//console.log('popped!')

				}
		} else if (dy != 0){
			this.animy = this.animy + dy/Math.abs(dy)*ms*dt;
			if (dy > 0 && this.animy >= move[1] || dy < 0 && this.animy <= move[1]){
				this.animations.shift();
				//this.y = move[1]
				this.animy = move[1]
					//console.log('popped!')
			}

		} else {
			console.log('shift!')
			this.animations.shift();
		}
		//console.log(this.animx,this.animy)
	}

	this.movement = function(path){
			//console.log('exist is ', this.exist)
			//var m = game.monsters[this.id]
			if (!this.exist){
				console.log('Moving a dead unit')
				return;
			}
			//var game = games[this.player.id]
			//console.log(this.x, this.y, loc)
			var board = game.board
			//var path = util.findPath(board,[m.x,m.y],loc);
			var plen = path.length;

			//console.log(plen-1,'<=',this.impairment + util.getCrestPool(this.player,util.CREST_MOVEMENT))
			//console.log(util.getCrestPool(this.player,util.CREST_MOVEMENT))
			//if (plen > 1 && plen-1 <= this.getCrestPool(util.CREST_MOVEMENT) - m.impairment) {

			var finish = function(m, path){
				console.log('finished!')
				var plen =  path.length;
				var event = {trigger: m, x1:this.x, y1:m.y, x2:path[plen-1][0], y2:path[plen-1][1]}
				for (var i=0; i<m.buff.length; i++){
						m.buff[i].fire('move',event);
				}
			}


			animation.push({type:'move unit', unit:this, path:path , px:this.x, py:this.y, speed:5, duration:200, onfinish:finish, args:[this,path]})

			game.setUnitAtLoc(util.EMPTY,[this.x, this.y])

			game.setUnitAtLoc(this.id,path[path.length-1])
			/*
			for (var i=1; i<path.length; i++){
				//console.log(path[i])
				this.moveUnit(path[i])
					//console.log('moved!')
			}

			if (this.exist == false) return;
			game.setUnitAtLoc(util.EMPTY,[this.x, this.y])
			game.setUnitAtLoc(this.id,path[plen-1])
			*/
			//this.player.changeState(util.GAME_STATE_UNIT)

				//return plen
			//} else {
			//	console.log('Illegal move',plen)
			//	return 0;
			//}

	}

}
