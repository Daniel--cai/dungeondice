
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
	buff.on('attack', function(event){
		//console.log(event)
		game.combat.atkmodifier = 0;
		event.status = 'miss'
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
