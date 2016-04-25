var PROPS = {}
PROPS['Spirit Fire'] = function (point, unit){
	var prop = new Prop("Spirit File", point,unit);
	prop.duration = 3;
	prop.on('collision', function(event){
		if (event.trigger.hasBuff('Spirit Fire') != util.EMPTY) return;
		ApplyBuff(prop.unit, event.trigger, BUFFS['Spirit Fire']())
	})

	prop.on('dies', function(event){
		console.log('prop removed')
	})

	prop.on('turn', function(event){
		var m = game.board.getUnitAtLoc(prop.x, prop.y)
		if (m == util.EMPTY) return;
		if (game.monsters[m].hasBuff('Spirit Fire') != util.EMPTY) return;
		console.log('reapply')
		ApplyBuff(prop.unit, game.monsters[m], BUFFS['Spirit Fire']())
	})
	return prop;
}


PROPS['Toxic Mushroom'] = function (point, unit){
	var prop = new Prop("Toxic Mushroom", point,unit);
	prop.on('collision', function(event){
		DamageUnit(prop.unit.id,event.trigger.id, 10)
		event.trigger.impairment += 1;
		animation.push({type:'text', text:'Toxic Shroom!', color:white, x:prop.x*squareSize,y:(prop.y-1)*squareSize+boardYPadding, dy:-25,
		duration:0.75, onfinish: function(a,b){console.log(a,b)}, args:[1,'ab']})
		prop.destroy();
	})
	return prop;
}

function Prop(name,point,unit) {
	this.id = 0
	//console.log(point)
	this.x = point[0];
	this.y = point[1];
	this.name = name;
	this.unit = unit ? unit : util.EMPTY;
	this.clear = false;
	this.exist = true;
	this.callbacks = {}
	this.duration = 0;

	this.on = function(event, callback){

		this.callbacks[event] = callback;
	}

	this.fire = function(event){
		if (this.exist == false) return;
		if (!this.callbacks.hasOwnProperty(event)){
			console.log(event, 'not implemented', this.name)
			return;
		}
		var args = Array.prototype.slice.call( arguments );
		var topic = args.shift();
		this.callbacks[event].apply(undefined, args)
	}

	this.destroy = function(){
		//games[this.player.id].props.splice(games[this.player.id].props.indexOf(this),1)
		//games[this.player.id].update('destroy prop', util.EMPTY, this)
		this.exist = false;
		this.fire('dies', {})
		console.log('destroy')
	}

	this.id = game.props.length;
	game.props.push(this)
	if (player.num == game.turn%2){
		//conn.send({id:'new prop', name:name, point:point,unit:unit.id})
	}

	return this;
}
