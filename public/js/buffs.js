
var BUFFS = {}
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
		event.status.push('miss')
		console.log('missed!')
	})
	return buff;
}
