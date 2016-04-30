

class Spell {
	constructor(name, cost,type){
		this.name = name;
		this._cost = cost;
		this.type = type
		this.cooldown = 1
		this.discount = 0;
		this.type = type
		//this.onEffect = () => console.log(this.name+'onEffect not implemented')
		this.callbacks = {}
	}

	on(event, callback){
		this.callbacks[event] = callback;
	}

	finish(event){
		for (var i =0; i<event.trigger.buff.length; i++){
			//event.trigger.buff[i].fire('spell', event)
		}
		//console.log('finishing spell')
		console.log(this.cost())
		event.trigger.player.updatePool(this.cost()[0],-this.cost()[1])
		event.trigger.player.changeState(GAME_STATE_UNIT)
	}

	fire(event){
		if (!this.callbacks.hasOwnProperty(event)){
			if (event != 'learn' &&  event != 'apply'){
				console.log(event, 'not implemented for', this.name)
			}
			return;

		}
		var args = Array.prototype.slice.call( arguments );
		var topic = args.shift();
		//console.log('topic is',topic)
		var boolean = this.callbacks[event].apply(undefined, args)
		if (event == 'effect'){
			//console.log('finish',args[0], boolean)
			if (boolean) this.finish(args[0])
		}
	}
	cost(){
		var pnt = Math.max(this._cost[1]-this.discount,0)
		return [this._cost[0], pnt]
	}
}

var SPELLS = {};

SPELLS['Nasus'] = []
SPELLS['Nasus'][0] = new Spell('Siphoning Strike', [CREST_ATTACK, 2], "self")
SPELLS['Nasus'][0].on ('learn', function(event){
	event.trigger.addBuff(event.trigger,BUFFS['Siphoning Strike']())
	return true;
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
	if (game.board.getUnitAtLoc(event.location[0],event.location[1]) == EMPTY) return false

	if (event.location[0] == event.trigger.x || event.location[1] == event.trigger.y){
		//var path = findPath(game.board,[event.trigger.x,event.trigger.y],event.location);
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
	if (game.board.getUnitAtLoc(event.location[0],event.location[1]) == EMPTY) return false
	if (event.location[0] == event.trigger.x || event.location[1] == event.trigger.y){
		//var path = findPath(game.board,[event.trigger.x,event.trigger.y],event.location);
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

	var buff = EMPTY;
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
	return true;
	//console.log(player.movePath)
	//player.movePath.concat()

	//findStraightPath([x,y],[x,y+3]),  findStraightPath([x,y],[x,y-3])

})

SPELLS['Lucian'][2].on('effect', function(event){
	if (game.board.getUnitAtLoc(event.location[0],event.location[1]) != EMPTY) {
		console.log('Location not empty');
		return false
	}
	var buff = event.trigger.hasBuff('Relentless Pursuit')
	if (buff == EMPTY){
		console.log('Unit has not learnt Relentless Pursuit');
		return false
	}
	var path = findStraightPath([event.trigger.x,event.trigger.y],event.location)
	if (path.length> Math.min(buff.stack+1, 4)) return false

	player.updatePool(CREST_MOVEMENT, -2)
	buff.stack = 0;
	console.log('casting relentless pursuit', event.location[0],event.trigger.x ,event.location[1] , event.trigger.y)
	if (!(event.location[0] == event.trigger.x || event.location[1] == event.trigger.y))  {console.log('Must target in a line'); return}

	var path = findPath(game.board,[event.trigger.x,event.trigger.y],event.location);
	console.log(path)
	event.trigger.movement(path)
	return true;
	//SPELLS['Lucian'][2].fire('finish', {trigger:event.trigger})
})


SPELLS['Teemo'] = []
SPELLS['Teemo'][0] = new Spell("Blinding Dart", [CREST_ATTACK, 2],"target")


SPELLS['Teemo'][0].on('effect',function(event){
	var target = game.board.getUnitAtLoc(event.location[0],event.location[1]);
	if (target == EMPTY) {console.log("Must target unit"); return false};
	var p = new Projectile(event.trigger.x,event.trigger.y,event.location[0],event.location[1],event.trigger )
	p.target = true;
	p.on('collision', function(event){

		event.trigger.addBuff(p.caster, BUFFS['Blinding Dart']())
		p.destroy()
	})
	return true;
})

SPELLS['Teemo'][1] = new Spell("Noxious Trap", [CREST_MAGIC, 2],"target")
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

	if (!isOrthogonal([event.trigger.x,event.trigger.y],event.location)) return false

	var path = [];
	var p = new Projectile(event.trigger.x,event.trigger.y,event.location[0],event.location[1], event.trigger)
	p.on('collision', function(event){
		if (event.trigger.player.num == p.caster.player.num) return false;
		DamageUnit(event.caster.id,event.trigger.id, 10);
	})
	p.on('finish', function(event){
		console.log('finished!',p.dx,p.dy,p.x,p.y)
		var s = new Projectile(p.dx,p.dy,p.x,p.y, p.caster)
		s.delay = 2;
		s.on('collision', function(event){
			if (event.trigger.player.num == s.caster.player.num) return false;
			DamageUnit(event.caster.id,event.trigger.id, 10);
		})
	})
	return true;
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
			event.trigger.movement([[x,y]], true)
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

SPELLS['Sivir'] = [];
SPELLS['Sivir'][0] = new Spell("Fleet of Foot", [CREST_MAGIC, 0],"passive")
SPELLS['Sivir'][0].on('learn', function(event){
	event.trigger.addBuff(event.trigger, BUFFS['Fleet of Foot Passive']())
})

SPELLS['Sivir'][1] = new Spell ("Boomerang Blade", [CREST_MAGIC, 2], "target")
SPELLS['Sivir'][1].on('effect', function(event){

	if (!isOrthogonal([event.trigger.x,event.trigger.y],event.location)) return false

	var p = new Projectile(event.trigger.x,event.trigger.y,event.location[0],event.location[1], event.trigger)
	var damage = 5;
	p.stack = 6;
	var hit = function(event){
		//friendly fire;
		//if (event.trigger.player.num == p.caster.player.num) return false;
		DamageUnit(event.caster.id,event.trigger.id, p.stack*damage);
		p.stack--;
		if (p.stack < 0) p.stack = 0
	}
	p.on('collision', hit)
	p.on('finish', function(event){
		var s = new Projectile(p.dx,p.dy,p.x,p.y, p.caster)
		s.stack = p.stack;
		s.on('collision', hit)
	})
	return true;
})

SPELLS['Sivir'][2] = new Spell ("Spell Shield", [CREST_MAGIC, 2], "self")
SPELLS['Sivir'][2].on('effect', function(event){
	event.trigger.addBuff(event.trigger, BUFFS['Spell Shield']())
	return true;
})



SPELLS['Yasuo'] = []
SPELLS['Yasuo'][0] = new Spell ("Way of the Wanderer", [CREST_MAGIC, 2], "passive")
SPELLS['Yasuo'][0].on('learn', function(event){
	event.trigger.addBuff(event.trigger, BUFFS['Way of the Wanderer']())
})

SPELLS['Yasuo'][1] = new Spell ('Steel Tempest', [CREST_ATTACK, 1], "target")
SPELLS['Yasuo'][1].on('effect',function(event){
	//var index = event.trigger.hasBuff('Steel Tempest')
	//if (index == EMPTY){
	var buff = BUFFS['Steel Tempest']()
		event.trigger.addBuff(event.trigger, buff)
	//}
	//event.trigger.buff[index].stack += 1;
	if (buff.stack == 3){
		buff.stack = 0;
		var p = new Projectile(event.trigger.x,event.trigger.y,event.location[0],event.location[1], event.trigger)
		p.range = 3;
		p.on('collision', function(event){
			event.trigger.addBuff(p.caster, BUFFS['Stunned']())
			console.log()
			DamageUnit(p.caster.id, event.trigger.id, 10)
		})
	} else {
		var p = new Projectile(event.trigger.x,event.trigger.y,event.location[0],event.location[1], event.trigger)
		p.target = true;
		p.on('collision', function(event){
			DamageUnit(p.caster.id, event.trigger.id, 10)
		})
	}
	return true;
})

SPELLS['Yasuo'][2] = new Spell ('Windwall', [CREST_ATTACK, 1], "target")
SPELLS['Yasuo'][2].on('effect',function(event){
	var p = new Prop('Windwall', event.location, event.trigger)
	p.on('spell hit', function(event){
		event.proj.destroy();
	})
	return true;
})

SPELLS['Kogmaw'] = []
SPELLS['Kogmaw'][0] = new Spell ('Icathian Surprise', [CREST_ATTACK,0], "passive")
SPELLS['Kogmaw'][0].on('learn', function(event){
	event.trigger.addBuff(event.trigger, BUFFS['Icathian Surprise']())
})

SPELLS['Kogmaw'][1] = new Spell('Bio Arcane Barrage', [CREST_MAGIC,2], "self")
SPELLS['Kogmaw'][1].on('effect', function(event){
	event.trigger.addBuff(event.trigger, BUFFS['Bio Arcane Barrage']())
})

SPELLS['Kogmaw'][2] = new Spell ('Living Artillery', [CREST_MAGIC, 1], 'target')
SPELLS['Kogmaw'][2].on('cast',function(event){

	var index = event.trigger.hasBuff('Living Artillery')
	if (index == EMPTY) return true;
	//variable spell cost
	if (event.trigger.player.pool[CREST_MAGIC] < event.trigger.buff[index].stack+1){
		console.log('Not enough', CREST_TEXT[CREST_MAGIC], 'to cast Living Artillery')
		return false;
	}
	console.log('cost is MAGIC ', event.trigger.buff[index].stack+1)
	//event.trigger.spells[2].cost = [CREST_MAGIC, event.trigger.buff[index].stack]
	return true;
})
SPELLS['Kogmaw'][2].on('effect',function(event){
	if (!isOrthogonal([event.trigger.x,event.trigger.y],event.location)) return false
	var index = event.trigger.hasBuff('Living Artillery')
	console.log(index)
	if (index == EMPTY){
		index = event.trigger.buff.length;
		event.trigger.addBuff(event.trigger, BUFFS['Living Artillery']())
	}
	event.trigger.buff[index].stack += 1;
	event.trigger.buff[index].duration = 4;
	if (event.trigger.buff[index].stack > 3) event.trigger.buff[index].stack = 3

	var p = new Projectile(event.trigger.x,event.trigger.y,event.location[0],event.location[1],event.trigger )
	p.target = true;
	p.on('collision',function(event){
		//console.log(p)
		var index = p.caster.hasBuff('Living Artillery')
		if (index == EMPTY) {
			console.log('Living Artillery p.caster does not have buff!')
			return;
		}
		var stack = p.caster.buff[index].stack;
		console.log('stack is',stack)
		DamageUnit(p.caster.id, event.trigger.id, 10*stack)
	})
	event.trigger.player.updatePool(CREST_MAGIC,-event.trigger.buff[index].stack+1)
	return true;
})

SPELLS['Sona']= []
SPELLS['Sona'][0] = new Spell ('Power Chord', [CREST_MAGIC,0], "passive")
SPELLS['Sona'][0].on ('learn', function(event){
	event.trigger.addBuff(event.trigger,BUFFS['Power Chord']())
})

SPELLS['Sona'][1] = new Spell('Hymn of Valor',[CREST_MAGIC,2], "self")
SPELLS['Sona'][1].on('effect', function(event){
	var units = []
	event.trigger.buff[event.trigger.hasBuff('Power Chord')].stack += 1;
	units.push(game.board.getUnitAtLoc(event.trigger.x+1,event.trigger.y))
	units.push(game.board.getUnitAtLoc(event.trigger.x-1,event.trigger.y))
	units.push(game.board.getUnitAtLoc(event.trigger.x,event.trigger.y-1))
	units.push(game.board.getUnitAtLoc(event.trigger.x,event.trigger.y+1))
	units.push(event.trigger.id)
	for (var i=0; i<units.length; i++){
		if (units[i] == EMPTY) continue
		var m = game.monsters[units[i]]
		if (m.player.num == event.trigger.player.num){
			m.addBuff(event.trigger, BUFFS['Hymn of Valor']())
		} else {
			DamageUnit(event.trigger.id,m.id, 10)
		}
	}
})

SPELLS['Sona'][2] = new Spell('Aria of Perseverance',[CREST_MAGIC,2], "self")
SPELLS['Sona'][2].on('effect', function(event){
	var units = []
	units.push(game.board.getUnitAtLoc(event.trigger.x+1,event.trigger.y))
	units.push(game.board.getUnitAtLoc(event.trigger.x-1,event.trigger.y))
	units.push(game.board.getUnitAtLoc(event.trigger.x,event.trigger.y-1))
	units.push(game.board.getUnitAtLoc(event.trigger.x,event.trigger.y+1))
	units.push(event.trigger.id)
	event.trigger.buff[event.trigger.hasBuff('Power Chord')].stack += 1;

	for (var i=0; i<units.length; i++){
		if (units[i] == EMPTY) continue
		var m = game.monsters[units[i]]
		if (m.player.num == event.trigger.player.num){
			m.addBuff(event.trigger, BUFFS['Aria of Perseverance']())
			HealUnit(event.trigger.id,m.id, 10)
		}
	}
})

SPELLS['Sona'][3] = new Spell('Song of Celerity', [CREST_MAGIC,2], "self")
SPELLS['Sona'][3].on('effect', function(event){
	var units = getAdjacentUnits(event.trigger)
	units.push(event.trigger.id)
	event.trigger.buff[event.trigger.hasBuff('Power Chord')].stack += 1;

	for (var i=0; i<units.length; i++){
		if (units[i] == EMPTY) continue
		var m = game.monsters[units[i]]
		if (m.player.num == event.trigger.player.num){
			m.addBuff(event.trigger, BUFFS['Song of Celerity']())
		}
	}
})

SPELLS['Sona'][4] = new Spell('Crescendo', [CREST_MAGIC,4], "target")
SPELLS['Sona'][4].on('effect', function(event){
	if (!isOrthogonal([event.trigger.x, event.trigger.y], event.location))	return false
	var p = new Projectile(event.trigger.x,event.trigger.y,event.location[0],event.location[1],event.trigger )
	p.range = 3;
	p.on('collision', function(event){
		if (isAlly(event.trigger,p.caster)) return
		event.trigger.addBuff(p.caster, BUFFS['Stunned']())
	})
	return true;
})


SPELLS['Janna'] = []
SPELLS['Janna'][0] = new Spell('Tailwind', [CREST_MAGIC,0], "passive")
SPELLS['Janna'][0].on('learn', function(event){
	event.trigger.addBuff(event.trigger, BUFFS['Tailwind Passive'](),0)
})

SPELLS['Janna'][1] = new Spell('Eye of the Storm', [CREST_MAGIC,0], "target")
SPELLS['Janna'][1].on('effect',function(event){
	if (!isAlly(event.trigger, event.target)) return false
	if (!isOrthogonal([event.trigger.x, event.trigger.y], event.location))	return false
	event.target.addBuff(event.trigger,BUFFS['Eye of the Storm'](),2)
	return true;
})

SPELLS['Vayne'] = []
SPELLS['Vayne'][0] = new Spell('Night Hunter', [CREST_MAGIC,0], "passive")
SPELLS['Vayne'][0].on('learn', function(event){
	event.trigger.addBuff(event.trigger, BUFFS['Night Hunter Passive']())
})

SPELLS['Vayne'][1] = new Spell('Final Hour', [CREST_ATTACK,5], "self")
SPELLS['Vayne'][1].on('effect', function(event){
	event.trigger.addBuff(event.trigger, BUFFS['Final Hour']())
})


SPELLS['Annie'] = []
SPELLS['Annie'][0] = new Spell('Pyromania', [CREST_ATTACK,0], "passive")
SPELLS['Annie'][0].on('learn', function(event){
	event.trigger.addBuff(event.trigger, BUFFS['Pyromania']())
})

SPELLS['Annie'][1] = new Spell ('Disintegrate', [CREST_MAGIC, 1], "target")
SPELLS['Annie'][1].on('effect', function(event){
	event.trigger.buff[	event.trigger.hasBuff('Pyromania')].stack += 1;
	if (!event.target) return false;
	var p = new Projectile(event.trigger.x,event.trigger.y,event.location[0],event.location[1],event.trigger )
	p.target = true;
	p.on('collision',function(event){
		console.log('colision')
		DamageUnit(p.caster.id, event.trigger.id, 20)
		if (p.caster.buff[p.caster.hasBuff('Pyromania')].stack == 3){
			p.caster.buff[p.caster.hasBuff('Pyromania')].stack = 0;
			event.trigger.addBuff(p.caster, BUFFS['Stunned']())
		}
	})
	return true;
})

SPELLS['Annie'][2] = new Spell('Molten Shield', [CREST_MAGIC,0], "self")
SPELLS['Annie'][2].on('effect', function(event){
	event.trigger.addBuff(event.trigger, BUFFS['Molten Shield']())
	event.trigger.buff[	event.trigger.hasBuff('Pyromania')].stack += 1;
	if (event.trigger.buff[	event.trigger.hasBuff('Pyromania')].stack > 3)
		event.trigger.buff[	event.trigger.hasBuff('Pyromania')].stack = 3;
})

SPELLS['Nunu'] = []
SPELLS['Nunu'][0] = new Spell('Visionary', ['CREST_MAGIC',1], "passive")
SPELLS['Nunu'][0].on('learn', function(event){
	event.trigger.addBuff(event.trigger,BUFFS['Visionary']())
})

SPELLS['Nunu'][1] = new Spell('Ice Blast', [CREST_MAGIC,2],"target")
SPELLS['Nunu'][1].on('effect', function(event){
	if (!event.target) return false;
	var p = new Projectile(event.trigger.x,event.trigger.y,event.location[0],event.location[1],event.trigger )
	p.target = true;
	console.log(event.trigger.spells[1].cost())
	p.on('collision',function(event){
			DamageUnit(p.caster.id, event.trigger.id, 10)
			event.trigger.addBuff(p.caster, BUFFS['Ice Blast']())
			var buff = p.caster.buff[p.caster.hasBuff('Visionary')]
			if (buff.stack == 3){
				p.caster.spells[1].discount = 0;
				buff.stack = 0
			}

	})

	return true;
})

SPELLS['Bard'] = []
SPELLS['Bard'][0] = new Spell ('Magical Journey', [CREST_MOVEMENT,2], "target")
SPELLS['Bard'][0].on('effect', function(event){
	if (game.board.getUnitAtLoc(event.location[0],event.location[1]) != EMPTY) return false;

})
