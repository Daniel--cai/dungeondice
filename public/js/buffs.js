
var BUFFS = {}

BUFFS['Stunned'] = function(){
	var buff = new Buff('Stunned', 2);
	return buff;
}

BUFFS['Starcall'] =  function(){
	var buff = new Buff("Starcall", 1);
	buff.on('apply', function(event){
		event.trigger.impairment += 1;
	})

	buff.on('expire', function(event){
		event.trigger.impairment += 1;
	})

	return buff;
}

BUFFS['Relentless Pursuit'] = function(){
	var buff = new Buff("Relentless Pursuit", 0);
	buff.stack = 0;
	buff.on('attack', function(event){
		buff.stack++;
	})
	return buff
}


BUFFS['Ardent Blaze'] =  function(){
	var buff = new Buff("Ardent Blaze", 1, true);
	buff.on('attacked', function(event){
		//console.log(event)
		var m = game.monsters[buff.owner]
		if (m.player.num == event.attacker.player.num){
			m.player.updatePool(CREST_MOVEMENT, 1)
		}
	})
	return buff;
}

BUFFS['Siphoning Strike'] = function(){
	var buff = new Buff("Siphoning Strike", 0);
	buff.stack = 3;
	buff.active = false;
	buff.on('attack', function(event){
		if (!buff.active) return
		var m = game.monsters[buff.owner]
		game.combat.atkmodifier += buff.stack*10;
		buff.active = false;
		console.log('Siphon')
	})
	buff.on('kill', function(event){
		console.log('kill',event)
		buff.stack++
	})
	return buff
}


BUFFS['Spirit Fire'] = function(){
	var buff = new Buff("Spirit Fire",1);
	buff.on('apply', function(event){
			console.log('Spirit fire applied on', event.trigger.name)
			event.trigger.statmod[STAT_DEFENSE] -= 10;
	})
	buff.on('expire', function(event){
			console.log('Spirit Fire expired!')
			var m = game.monsters[buff.owner]
			m.statmod[STAT_DEFENSE] += 10
	})
	return buff;
}

BUFFS['Soul Eater'] = function(){
	var buff = new Buff('Soul Eater', 0);
	buff.on('attack', function(event){
		console.log('Soul eater +hp!')
		game.monsters[buff.owner].hp += 10;
		if (game.monsters[buff.owner].hp > game.monsters[buff.owner].maxhp)
		game.monsters[buff.owner].hp = game.monsters[buff.owner].maxhp

	})
	return buff;
}


BUFFS['Lightslinger'] = function(){
	var buff = new Buff('Lightslinger', 0)
	//buff.active = false;
	buff.on('spell', function(event){
		//buff.active = true;
		event.trigger.hasAttacked = false;
	})

	//buff.on('attack',function(event){
	//	if (!buff.active) return;
	//})
	return buff;
}

BUFFS['Blinding Dart'] = function(){
	var buff = new Buff("Blinding Dart", 1);
	buff.on('apply', function(event){
		DamageUnit(buff.owner, event.trigger.id, 10)
	})
	buff.on('attack', function(event){
		//console.log(event)
		event.combat.atkmodifier = 0;
		event.combat.status = 'miss'
		console.log('missed!')
	})
	return buff;
}

BUFFS['Concussive Blows'] = function(){
	var buff = new Buff('Concussive Blows', 2)
	buff.on('attacked', function(event){
		console.log(buff)
		if (event.attacker.id == buff.owner) return;
		event.trigger.addBuff(game.monsters[buff.owner], BUFFS['Stunned']())
		event.trigger.removeBuff('Concussive Blows')
	})
	return buff;
}

BUFFS['Concussive Blows Passive'] = function(){
	var buff = new Buff('Concussive Blows Passive', 0);
	buff.on('attack', function(event){

		event.target.addBuff(event.trigger, BUFFS['Concussive Blows']())
	})
	return buff
}

BUFFS['Stand Behind Me'] = function(){
	var buff = new Buff('Stand Behind Me', 1)
	buff.on('apply', function(event){
		event.trigger.statmod[STAT_DEFENSE] += 10;
		console.log(event.trigger.statmod)
	})
	buff.on('expire', function(event){
		event.trigger.statmod[STAT_DEFENSE] -= 10;
		console.log(event.trigger.statmod)
	})
	return buff;
}

BUFFS['Essence Theft'] = function(){
	var buff = new Buff('Essence Theft', 0)
	buff.stack = 0;
	buff.effect = function(event){
		buff.stack++;
		if (buff.stack > 3 ){
			buff.stack = 0;
			event.trigger.hp = Math.min(event.trigger.hp+20, event.trigger.maxhp);
		}
	}



	buff.on('attack', function(event){
		buff.effect(event)
	})
	buff.on('spell', function(event){
		buff.effect(event)
	})
	return buff
}

BUFFS['Hemorrhage'] = function(){
	var buff = new Buff('Hemorrhage',2);
	buff.stack = 1;
	buff.on('apply',function(event){
		buff.duration = 2;
	})

	buff.on('turn',function(event){
		DamageUnit(	buff.owner, event.trigger.id, 5*buff.stack)
	})

	return buff;
}

BUFFS['Hemorrhage Passive'] = function(){
	var buff = new Buff('Hemorrhage Passive',0);
	buff.effect = function(event){
		var b = event.target.hasBuff('Hemorrhage');
		console.log('test')
		if (b == util.EMPTY){
			event.target.addBuff(event.trigger,BUFFS['Hemorrhage']())
		} else {
			event.target.buff[b].stack++;
			event.target.buff[b].duration = 2;
		}
	}
	buff.on('spell',function(event){
		buff.effect(event)
	})

	buff.on('attack', function(event){
		buff.effect(event)
	})
	return buff;
}

BUFFS['Fleet of Foot'] = function(){
	var buff = new Buff('Fleet of Foot', 1);
	buff.on('apply',function(event){
		event.trigger.impairment -= 1;
	})

	buff.on('move', function(event){
		event.trigger.removeBuff(buff.name);
	})

	buff.on('expire',function(event){
		event.trigger.impairment += 1;
	})

	return buff;
}

BUFFS['Fleet of Foot Passive'] = function(){
	var buff = new Buff('Fleet of Foot Passive', 0);
	buff.on('attack', function(event){
		event.trigger.addBuff(event.trigger, BUFFS['Fleet of Foot']())
	})
	return buff;
}

BUFFS['Spell Shield'] = function(){
	var buff = new Buff('Spell Shield',2);
	buff.on('spell hit', function(event){
			event.proj.destroy();
			var owner = game.monsters[buff.owner]
			animation.push({type:'text', text:'Blocked!', color:white, x:owner.x*squareSize,y:owner.y*squareSize+50, dy:-25, duration:0.75})
			owner.removeBuff(buff.name)
			owner.player.updatePool('CREST_MAGIC', 1);
	})
	return buff;
}

BUFFS['Way of the Wanderer'] = function(){
	var buff = new Buff('Way of the Wanderer',0);
	buff.stack = 0;
	buff.on('move', function(event){
		buff.stack += 1;
		console.log('way =',buff.stack)
		if (buff.stack == 3){
			event.trigger.shield += 20;
			buff.stack = 0;
		}
	})
	return buff;
}

BUFFS['Steel Tempest'] = function(){
	var buff = new Buff('Steel Tempest',0)
	buff.stack = 1;
	return buff;
}

BUFFS['Icathian Surprise'] = function(){
	var buff = new Buff('Icathian Surprise',0);
	buff.on('dies',function(event){
		var units = []
		units.push(game.board.getUnitAtLoc(event.trigger.x+1, event.trigger.y))
		units.push(game.board.getUnitAtLoc(event.trigger.x-1, event.trigger.y))
		units.push(game.board.getUnitAtLoc(event.trigger.x, event.trigger.y+1))
		units.push(game.board.getUnitAtLoc(event.trigger.x, event.trigger.y-1))
				console.log(units)
		for (var i=0; i<units.length; i++){
			if (units[i] != util.EMPTY)
				DamageUnit(event.trigger.id, units[i], 20)
		}

	})
	return buff;
}

BUFFS['Bio Arcane Barrage'] = function(){
	var buff = new Buff('Bio Arcane Barrage',0)
	buff.on ('attack',function(event){
		event.combat.atkunguardable += 10;
	})
	return buff;
}

BUFFS['Living Artillery'] = function(){
	var buff = new Buff('Living Artillery',4)
	buff.stack = 0;
	return buff;
}

BUFFS['Power Chord'] = function(){
	var buff = new Buff('Power Chord',0)
	buff.stack = 0;
	return buff
}

BUFFS['Hymn of Valor'] = function(){
	var buff = new Buff('Hymn of Valor',1)
	buff.on('attack', function(event){
		event.combat.atkmodifier += 10;
	})
	return buff
}
BUFFS['Aria of Perseverance'] = function(){
	var buff = new Buff('Aria of Perseverance', 2);
	buff.on('apply',function(event){
		console.log('adding shield')
		event.trigger.addShield(buff,10)
	})
	return buff;
}

BUFFS['Song of Celerity'] = function(){
	var buff = new Buff('Song of Celerity',2)
	buff.on('apply', function(event){
		event.trigger.impairment -= 1;
	})
	buff.on('expire', function(event){
		event.trigger.impairment += 1;
	})
	return buff;
}

BUFFS['Tailwind Passive'] = function(){
	var buff = new Buff('Tailwind Passive',0)

	buff.on('turn', function(event){
		var m = game.monsters[buff.owner]
		var units = getUnitsInRange(m.x,m.y,1)

		for (var i=0; i<units.length; i++){
			var u = game.monsters[units[i]]
			if (!isAlly(u,m)) continue
			if (m.id == u.id) continue
			console.log('adding tailwind')
			u.addBuff(m, BUFFS['Tailwind']())
		}

	})
	return buff;
}

BUFFS['Tailwind'] = function(){
	var buff = new Buff('Tailwind',1)
	buff.on('apply',function(event){
		event.trigger.impairment -= 1;
	})

	buff.on('expire', function(event){
		event.trigger.impairment += 1;
	})
	return buff;
}

BUFFS['Eye of the Storm'] = function(){
	var buff = new Buff('Eye of the Storm',2);
	buff.on('apply',function(event){
		event.trigger.addShield(buff,20)
		event.trigger.statmod[STAT_ATTACK] += 10
	})

	buff.on('expire',function(event){
		event.trigger.statmod[STAT_ATTACK] -= 10
	})
	return buff
}


BUFFS['Night Hunter'] = function(){
	var buff = new Buff('Night Hunter', 1);
	buff.on('apply',function(event){

		event.trigger.impairment -= 1
	})
	buff.on('expire',function(event){
		event.trigger.impairment += 1
	})
	return buff;
}

BUFFS['Night Hunter Passive'] = function(){
	var buff = new Buff('Night Hunter Passive',0);
	buff.on('turn', function(event){
		var x = game.monsters[buff.owner].x;
		var y= game.monsters[buff.owner].y;
		var radius = 1;
		var isEnemyInRange = false
		var units = getUnitsInRange(x,y,radius)
		//console.log(units)
		for (var i = 0; i<units.length; i++){
			var u = units[i]
			//console.log(game.monsters[u].type.name)
			if (isAlly(game.monsters[u],game.monsters[buff.owner])) continue
			//console.log('enemy in rnage!')
			game.monsters[buff.owner].addBuff(game.monsters[buff.owner],BUFFS['Night Hunter']())
			break;
		}
	})
	return buff;
}
BUFFS['Final Hour'] = function(){
	var buff = new Buff('Final Hour',4);
	return buff;
}

BUFFS['Pyromania'] = function(){
	var buff = new Buff('Pyromania',0)
	buff.stack = 0
	return buff;
}

BUFFS['Molten Shield'] = function(){
	var buff = new Buff('Molten Shield', 4)
	buff.on('attacked',function(event){
		DamageUnit(event.trigger.id, event.attacker.id, 10)
	})
	return buff;
}

BUFFS['Visionary'] = function(){
	var buff = new Buff('Visionary',0)
	buff.stack = 0;
	buff.on('attack', function(event){
		buff.stack += 1;
		if (buff.stack == 3){
			event.trigger.spells[1].discount = 2;
		}
	})
	return buff;
}

BUFFS['Ice Blast'] = function(){
	var buff = new Buff('Ice Blast', 2)
	buff.on('apply', function(event){
		event.trigger.impairment += 1;
	})

	buff.on('expire', function(event){
		event.trigger.impairment -= 1;
	})
	return buff;
}
