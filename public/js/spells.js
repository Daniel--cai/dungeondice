var SPELLS = {};
SPELLS['Nasus'] = []
SPELLS['Nasus'][0] = new Spell('Siphoning Strike', [CREST_ATTACK, 2], "self")
SPELLS['Nasus'][0].on ('learn', function(event){
	ApplyBuff(event.trigger, event.trigger,BUFFS['Siphoning Strike']())
})
SPELLS['Nasus'][0].on ('effect', function(event){
	if (event.trigger.hasAttacked){
		console.log('unit already attacked')
		return;
	}
	spellButton[0].disabled = true;
	for (var i = 0; i < event.trigger.buff.length; i++){
		if (event.trigger.buff[i].name == 'Siphoning Strike'){
			event.trigger.buff[i].active = true;
		}
	}
})

SPELLS['Nasus'][1] = new Spell('Spirit Fire', [CREST_MAGIC, 2], "target")
SPELLS['Nasus'][1].on ('effect',function(event){
	PROPS['Spirit Fire'](event.location, event.trigger)
})

SPELLS['Nasus'][2] = new Spell ('Soul Eater', [CREST_MAGIC, 0], "passive")
SPELLS['Nasus'][0].on ('learn', function(event){
	ApplyBuff(event.trigger, event.trigger,BUFFS['Soul Eater']())
})


SPELLS['Lucian'] = []
SPELLS['Lucian'][0] = new Spell("Piercing Light", [CREST_ATTACK, 2],"target")
SPELLS['Lucian'][0].on('effect', function(event){
	if (game.board.getUnitAtLoc(event.location[0],event.location[1]) == util.EMPTY) return "No unit targeted"

	if (event.location[0] == event.trigger.x || event.location[1] == event.trigger.y){
		//var path = util.findPath(game.board,[event.trigger.x,event.trigger.y],event.location);
		var dx = (event.location[0] - event.trigger.x)
		var dy = (event.location[1] - event.trigger.y)
		if (dx < 0) dx = -1;
		if (dx > 0) dx = 1;
		if (dy < 0) dy = -1;
		if (dy > 0) dy = 1;

		console.log(dx,dy)
		var path = [];
		for (var i = 1; i<4; i++){
			path.push([event.trigger.x+dx*i,event.trigger.y+dy*i])
		}
		console.log(path)
		for (var i=0; i<path.length; i++){
			console.log(path[i])
			var m = game.board.getUnitAtLoc(path[i][0],path[i][1])
			if (m != util.EMPTY){
				DamageUnit(event.trigger.id, m, 20)
				//ApplyBuff(event.trigger, game.monsters[m],BUFFS['Ardent Blazer']() )
			}
		}

		//SPELLS['Lucian'][0].fire('finish', {trigger:event.trigger})

	}

})

SPELLS['Lucian'][1] = new Spell("Ardent Blaze", [CREST_MAGIC, 2],"target")
SPELLS['Lucian'][1].on('effect',function(event){
	if (game.board.getUnitAtLoc(event.location[0],event.location[1]) == util.EMPTY) return "No unit targeted"
	if (event.location[0] == event.trigger.x || event.location[1] == event.trigger.y){
		//var path = util.findPath(game.board,[event.trigger.x,event.trigger.y],event.location);
		var dx = (event.location[0] - event.trigger.x)
		var dy = (event.location[1] - event.trigger.y)
		if (dx < 0) dx = -1;
		if (dx > 0) dx = 1;
		if (dy < 0) dy = -1;
		if (dy > 0) dy = 1;

		//console.log(dx,dy)
		var path = [];
		for (var i = 1; i<3; i++){
			path.push([event.trigger.x+dx*i,event.trigger.y+dy*i])
		}
		//console.log(path)
		for (var i=0; i<path.length; i++){
			console.log(path[i])
			var m = game.board.getUnitAtLoc(path[i][0],path[i][1])
			if (m != util.EMPTY){
				DamageUnit(event.trigger.id, m, 10)
				ApplyBuff(event.trigger, game.monsters[m],BUFFS['Ardent Blaze']() )
				break;
			}
		}
	//SPELLS['Lucian'][1].fire('finish', {trigger:event.trigger})
	}
})
SPELLS['Lucian'][2] = new Spell("Relentless Pursuit", [CREST_MOVEMENT, 2],"target")
SPELLS['Lucian'][2].on('learn', function(event){
	//console.log('learnt relentless')
	//console.log(event)
	ApplyBuff(event.trigger, 	event.trigger, BUFFS['Relentless Pursuit']())

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
	if (game.board.getUnitAtLoc(event.location[0],event.location[1]) != util.EMPTY) {console.log('Location not empty'); return}
	var buff = util.EMPTY;
	for (var i=0; i< event.trigger.buff.length; i++){
		if (event.trigger.buff[i].name == 'Relentless Pursuit'){
			buff = event.trigger.buff[i];
			break;
		}
	}
	if (buff == util.EMPTY){console.log('Unit has not learnt Relentless Pursuit'); return}
	var path = findStraightPath([event.trigger.x,event.trigger.y],event.location)
	if (path.length> Math.min(buff.stack+1, 4)) return

	player.updatePool(CREST_MOVEMENT, -2)
	buff.stack = 0;
	console.log('casting relentless pursuit', event.location[0],event.trigger.x ,event.location[1] , event.trigger.y)
	if (!(event.location[0] == event.trigger.x || event.location[1] == event.trigger.y))  {console.log('Must target in a line'); return}

	var path = util.findPath(game.board,[event.trigger.x,event.trigger.y],event.location);
	console.log(path)
	event.trigger.movement(path)
	//SPELLS['Lucian'][2].fire('finish', {trigger:event.trigger})
})

SPELLS['Lucian'][3] = new Spell("Ardent Blaze", [CREST_MAGIC, 2],"target")

SPELLS['Lucian'][4] = new Spell('The Culling', [CREST_ATTACK,0], "target")
SPELLS['Lucian'][4].on('learn', function(event){
	//console.log('Learnt lightslinger')
	//ApplyBuff(event.trigger,event.trigger, BUFFS['Lightslinger']())
})


SPELLS['Teemo'] = []

SPELLS['Teemo'][0] = new Spell("Blinding Dart", [CREST_ATTACK, 2],"target")
SPELLS['Teemo'][1] = new Spell("Noxious Trap", [CREST_MAGIC, 2],"target")

SPELLS['Teemo'][0].on('effect',function(event){

	//var game = games[event.trigger.player.id]
	var id = game.board.getUnitAtLoc(event.location[0],event.location[1]);
	if (id == util.EMPTY) {console.log("Must target unit"); return };

	var target = game.monsters[game.board.getUnitAtLoc(event.location[0],event.location[1])]
	var buff = BUFFS['Blinding Dart']()
	ApplyBuff(event.trigger, target, buff)

	DamageUnit(event.trigger.id, target.id, 10);
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
})

BUFFS['Starcall'] =  function(){
	var buff = new Buff("Starcall", 1);
	return buff;
}

SPELLS['Soraka'] = [];
SPELLS['Soraka'][0] = new Spell("Starcall", [CREST_MAGIC, 2],"target")
SPELLS['Soraka'][0].on('effect',function(event){
	if (!event.target){
		console.log('No units in area')
		return
	}
	DamageUnit(event.trigger.id, event.target.id, 10);
	BUFF_SLOW(event.target, 1)
	ApplyBuff(event.trigger, event.target, BUFFS['Starcall']())
	//SPELLS['Soraka'][0].fire('finish',{trigger:event.trigger})
})

SPELLS['Soraka'][1] = new Spell("Astral Infusion", [CREST_MAGIC, 2],"target")
SPELLS['Soraka'][1].on('effect',function(event){
	if (event.trigger.hp == 10) {
		console.log('Not enough hp to cast');
		return
	}
	console.log(event.target)
	if (!event.target || event.target.id == event.trigger.id){
		console.log('Must target another unit')
		return;
	}

	if (event.target.player.num != event.trigger.player.num){
		console.log('Cannot heal enemy units');
		return;
	}
	event.target.hp = Math.min(event.target.hp + 10,event.target.maxhp);
	event.trigger.hp -= 10;
	//SPELLS['Soraka'][1].fire('finish',{trigger:event.trigger})
})


function Spell(name, cost,type){
	this.name = name;
	this.cost = cost;
	this.type = type
	this.cooldown = 1;
	this.type = type
	this.onEffect = () => console.log(this.name+'onEffect not implemented')

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
			if (event != 'learn')
				console.log(event, 'not implemented for', this.name)
			return;

		}
		var args = Array.prototype.slice.call( arguments );
		var topic = args.shift();
		//console.log('topic is',topic)
		this.callbacks[event].apply(undefined, args)
	}

	this.buff;
	//SpellID++;

	return this;
}
