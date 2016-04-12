var SPELLS = {};
SPELLS['Nasus'] = []
SPELLS['Nasus'][0] = new Spell('Siphoning Strike', [CREST_ATTACK, 2], "self")
SPELLS['Nasus'][0].on ('learn', function(event){
	event.trigger.addBuff(event.trigger,BUFFS['Siphoning Strike']())
})
SPELLS['Nasus'][0].on ('effect', function(event){
	if (event.trigger.hasAttacked){
		console.log('unit already attacked')
		return false;
	}
	spellButton[0].disabled = true;
	for (var i = 0; i < event.trigger.buff.length; i++){
		if (event.trigger.buff[i].name == 'Siphoning Strike'){
			event.trigger.buff[i].active = true;
		}
	}
	return true;
})

SPELLS['Nasus'][1] = new Spell('Spirit Fire', [CREST_MAGIC, 2], "target")
SPELLS['Nasus'][1].on ('effect',function(event){
	PROPS['Spirit Fire'](event.location, event.trigger)
})

SPELLS['Nasus'][2] = new Spell ('Soul Eater', [CREST_MAGIC, 0], "passive")
SPELLS['Nasus'][0].on ('learn', function(event){
	event.trigger.addBuff( event.trigger,BUFFS['Soul Eater']())
})


SPELLS['Lucian'] = []
SPELLS['Lucian'][0] = new Spell("Piercing Light", [CREST_ATTACK, 2],"target")
SPELLS['Lucian'][0].on('effect', function(event){
	if (game.board.getUnitAtLoc(event.location[0],event.location[1]) == util.EMPTY) return false

	if (event.location[0] == event.trigger.x || event.location[1] == event.trigger.y){
		//var path = util.findPath(game.board,[event.trigger.x,event.trigger.y],event.location);
		var p = new Projectile(event.trigger.x,event.trigger.y,event.location[0],event.location[1],event.trigger )
		p.on('collision', function(event){
			if (event.trigger.id == p.caster.id) return;
			DamageUnit(p.caster.id, event.trigger.id, 20)
		})
		return true;
	}
	return false;

})


SPELLS['Lucian'][1] = new Spell("Ardent Blaze", [CREST_MAGIC, 2],"target")
SPELLS['Lucian'][1].on('effect',function(event){
	if (game.board.getUnitAtLoc(event.location[0],event.location[1]) == util.EMPTY) return false
	if (event.location[0] == event.trigger.x || event.location[1] == event.trigger.y){
		//var path = util.findPath(game.board,[event.trigger.x,event.trigger.y],event.location);
		var p = new Projectile(event.trigger.x,event.trigger.y,event.location[0],event.location[1],event.trigger )
		p.on('collision', function(event){
			if (event.trigger.id == p.caster.id) return;
			DamageUnit(p.caster.id, event.trigger.id, 10)
			game.monsters[event.trigger.id].addBuff(p.caster,BUFFS['Ardent Blaze']() )
			p.destroy()
		})
		return true;
	}
	return false;
})
SPELLS['Lucian'][2] = new Spell("Relentless Pursuit", [CREST_MOVEMENT, 2],"target")
SPELLS['Lucian'][2].on('learn', function(event){
	event.trigger.addBuff(event.trigger, BUFFS['Relentless Pursuit']())

})

SPELLS['Lucian'][2].on('cast', function(event){
//	console.log('casting relentless puruist')

	var buff = util.EMPTY;
	for (var i=0; i< event.trigger.buff.length; i++){
		if (event.trigger.buff[i].name == 'Relentless Pursuit'){
			buff = event.trigger.buff[i];
			break;
		}
	}
	player.movePath = []
	var x = event.trigger.x;
	var y = event.trigger.y
	//console.log(x,y)
	player.movePath = player.movePath.concat(findStraightPath([x,y],[x+buff.stack+1,y]))
	player.movePath = player.movePath.concat(findStraightPath([x,y],[x-(buff.stack+1),y]))
	player.movePath = player.movePath.concat(findStraightPath([x,y],[x,y-(buff.stack+1)]))
	player.movePath = player.movePath.concat(findStraightPath([x,y],[x,y+buff.stack+1]))
	console.log(player.movePath)
	//player.movePath.concat()

	//findStraightPath([x,y],[x,y+3]),  findStraightPath([x,y],[x,y-3])

})

SPELLS['Lucian'][2].on('effect', function(event){
	if (game.board.getUnitAtLoc(event.location[0],event.location[1]) != util.EMPTY) {
		console.log('Location not empty');
		return false
	}
	var buff = event.trigger.hasBuff('Relentless Pursuit')
	if (buff == util.EMPTY){
		console.log('Unit has not learnt Relentless Pursuit');
		return false
	}
	var path = findStraightPath([event.trigger.x,event.trigger.y],event.location)
	if (path.length> Math.min(buff.stack+1, 4)) return false

	player.updatePool(CREST_MOVEMENT, -2)
	buff.stack = 0;
	console.log('casting relentless pursuit', event.location[0],event.trigger.x ,event.location[1] , event.trigger.y)
	if (!(event.location[0] == event.trigger.x || event.location[1] == event.trigger.y))  {console.log('Must target in a line'); return}

	var path = util.findPath(game.board,[event.trigger.x,event.trigger.y],event.location);
	console.log(path)
	event.trigger.movement(path)
	return true;
	//SPELLS['Lucian'][2].fire('finish', {trigger:event.trigger})
})


SPELLS['Teemo'] = []
SPELLS['Teemo'][0] = new Spell("Blinding Dart", [CREST_ATTACK, 2],"target")
SPELLS['Teemo'][1] = new Spell("Noxious Trap", [CREST_MAGIC, 2],"target")

SPELLS['Teemo'][0].on('effect',function(event){

	//var game = games[event.trigger.player.id]
	var id = game.board.getUnitAtLoc(event.location[0],event.location[1]);
	if (id == util.EMPTY) {console.log("Must target unit"); return false};

	var target = game.monsters[game.board.getUnitAtLoc(event.location[0],event.location[1])]
	var buff = BUFFS['Blinding Dart']()
	target.addBuff(event.trigger, buff)

	DamageUnit(event.trigger.id, target.id, 10);
	return true;
	//SPELLS['Teemo'][0].fire('finish',{trigger:event.trigger})
})

SPELLS['Teemo'][1].on('effect', function(event){
	//var mushroom = new Prop("Toxic Mushroom", event.trigger.player, event.location, event.trigger);
	//PROP_TEEMO2(mushroom);
	PROPS['Toxic Mushroom'](event.location, event.trigger)
	console.log('toxic mushroom!')
	//console.log(event)
	//var buff = new Buff("Blinding Dart", 1);
	//ApplyBuff(event.trigger, event.target, buff)
	//DamageUnit(event.trigger, event.target, 10);

	//SPELLS['Teemo'][1].fire('finish',{trigger:event.trigger})
	return true;
})



SPELLS['Soraka'] = [];
SPELLS['Soraka'][0] = new Spell("Starcall", [CREST_MAGIC, 2],"target")
SPELLS['Soraka'][0].on('effect',function(event){
	if (!event.target){
		console.log('No units in area')
		return
	}
	DamageUnit(event.trigger.id, event.target.id, 10);
	BUFF_SLOW(event.target, 1)
	event.target.addBuff(event.trigger, BUFFS['Starcall']())
	//SPELLS['Soraka'][0].fire('finish',{trigger:event.trigger})
})

SPELLS['Soraka'][1] = new Spell("Astral Infusion", [CREST_MAGIC, 2],"target")
SPELLS['Soraka'][1].on('effect',function(event){
	if (event.trigger.hp == 10) {
		console.log('Not enough hp to cast');
		return false
	}
	console.log(event.target)
	if (!event.target || event.target.id == event.trigger.id){
		console.log('Must target another unit')
		return false;
	}

	if (event.target.player.num != event.trigger.player.num){
		console.log('Cannot heal enemy units');
		return false;
	}
	event.target.hp = Math.min(event.target.hp + 10,event.target.maxhp);
	event.trigger.hp -= 10;
	return true;
	//SPELLS['Soraka'][1].fire('finish',{trigger:event.trigger})
})

SPELLS['Braum'] = [];
SPELLS['Braum'][0] = new Spell("Concussive Blows", [CREST_MAGIC, 0],"passive")
SPELLS['Braum'][0].on('learn', function(event){
	event.trigger.addBuff(event.trigger, BUFFS['Concussive Blows Passive']())
})

SPELLS['Braum'][1] = new Spell("Stand Behind Me", [CREST_DEFENSE, 0],"target")
SPELLS['Braum'][1].on('effect', function(event){
	console.log('Stand behind me')

	var m = game.board.getUnitAtLoc(event.location[0], event.location[1])
	if (!event.target){
		console.log('No units in area')
		return false
	}
	console.log(event)
	if (event.target.player.num != event.trigger.player.num){
		console.log('Target must be ally')
		return false
	}
	var dx = event.trigger.x - event.target.x;
	var dy = event.trigger.y - event.target.y;

	if (dx != 0 && dy !=0) {
		console.log("Must target something in the same row or column")
		return false
	}
	var path = []
	for (var i = 0; i< Math.max(dx,dy)+2; i++){
		var x = event.trigger.x - dx * i
		var y = event.trigger.y - dy * i
		path.push([x,y])
	}
	event.trigger.movement(path)

	event.trigger.addBuff(event.trigger, BUFFS['Stand Behind Me']())
	game.monsters[m].addBuff(event.trigger, BUFFS['Stand Behind Me']())
	return true;
})


SPELLS['Ahri'] = []
SPELLS['Ahri'][0] = new Spell("Essence Theft", [CREST_MAGIC, 0],"passive")
SPELLS['Ahri'][0].on('learn', function(event){
	event.trigger.addBuff(event.trigger, BUFFS['Essence Theft']())
})

SPELLS['Ahri'][1] = new Spell ("Orb of Deception", [CREST_MAGIC, 2], "target")
SPELLS['Ahri'][1].on('effect', function(event){
	var path = [];
	for (var i = 1; i<4; i++){
	//	path.push([event.trigger.x+dx*i,event.trigger.y+dy*i])
	}
	var p = new Projectile(event.trigger.x,event.trigger.y,event.location[0],event.location[1], event.trigger)
	p.on('collision', function(event){
		if (event.trigger.player.num == p.caster.player.num) return;
		DamageUnit(event.caster.id,event.trigger.id, 10);
	})
	p.on('finish', function(event){
		console.log('finished!',p.dx,p.dy,p.x,p.y)
		var s = new Projectile(p.dx,p.dy,p.x,p.y, p.caster)
		s.delay = 2;
		s.on('collision', function(event){
			if (event.trigger.player.num == s.caster.player.num) return;
			DamageUnit(event.caster.id,event.trigger.id, 10);
		})
	})
	p.on('turn',function(event){

	})
})

SPELLS['Ahri'][2] = new Spell("Charm", [CREST_MAGIC, 0],"target")
SPELLS['Ahri'][2].on('effect', function(event){
	if (!event.target ) {
		console.log('No target')
		return false;
	}
	var dx = event.trigger.x - event.target.x
	var dy = event.trigger.y - event.target.y

	if (dx != 0 && dy != 0) {
		console.log("Must target in a straight line")
		return false;
	}


	var x =	event.target.x + (dx == 0 ? 0 : dx/Math.abs(dx));
	var y = event.target.y + (dy == 0 ? 0 : dy/Math.abs(dy));
	var p = new Projectile(event.trigger.x , event.trigger.y,event.target.x , event.target.y, event.trigger)
	p.on('collision', function(event){
			if (event.trigger.id == p.caster.id) return
			event.trigger.movement([[x,y]])
			DamageUnit(p.caster.id, event.trigger.id, 10);
			p.destroy()
	})

	return true;
	//event.trigger.addBuff(event.trigger, BUFFS['Essence Theft']())
})

SPELLS['Darius'] = []
SPELLS['Darius'][0] = new Spell("Hemorrhage", [CREST_MAGIC, 0],"passive")
SPELLS['Darius'][0].on('learn', function(event){
	event.trigger.addBuff(event.trigger, BUFFS['Hemorrhage Passive']())
})

function Spell(name, cost,type){
	this.name = name;
	this.cost = cost;
	this.type = type
	this.cooldown = 1;
	this.type = type
	//this.onEffect = () => console.log(this.name+'onEffect not implemented')

	this.callbacks = {}
	this.on = function(event, callback){
		this.callbacks[event] = callback;
	}


	this.on('finish', function(event){
		for (var i =0; i<event.trigger.buff.length; i++){
			event.trigger.buff[i].fire('spell', event)
		}
		//console.log('finishing spell')
		event.trigger.player.changeState(util.GAME_STATE_UNIT)
	})

	this.fire = function(event){
		if (!this.callbacks.hasOwnProperty(event)){
			if (event != 'learn' && event != 'spell')
				console.log(event, 'not implemented for', this.name)
			return;

		}
		var args = Array.prototype.slice.call( arguments );
		var topic = args.shift();
		//console.log('topic is',topic)
		var boolean = this.callbacks[event].apply(undefined, args)
		if (event == 'effect'){
			console.log('finish',args[0], boolean)
			if (boolean) this.fire('finish', args[0])
		}
	}

	this.buff;
	//SpellID++;

	return this;
}
