var PROPS = {}
PROPS['Spirit Fire'] = function (point, unit){
	var prop = new Prop("Spirit File", point,unit);
	prop.duration = 3;
	prop.on('collision', function(event){
		if (event.trigger.hasBuff('Spirit Fire') != EMPTY) return;
		ApplyBuff(prop.unit, event.trigger, BUFFS['Spirit Fire']())
	})

	prop.on('dies', function(event){
		console.log('prop removed')
	})

	prop.on('turn', function(event){
		var m = game.board.getUnitAtLoc(prop.x, prop.y)
		if (m == EMPTY) return;
		if (game.monsters[m].hasBuff('Spirit Fire') != EMPTY) return;
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

PROPS['Magical Journey'] = function(point, unit){
	var prop = new Prop("Magical Journey", point, unit)
	prop.on('collision', function(event){
		if (game.board.getUnitAtLoc(prop.final[0],prop.final[1]) != EMPTY) return false

	})
	return prop
}

class Prop {
	constructor(name,point,unit){
	//	this.id = 0
		//console.log(point)

		this.x = point[0];
		this.y = point[1];
		this.name = name;
		this.unit = unit ? unit : EMPTY;
		this.clear = false;
		this.exist = true;
		this.callbacks = {}
		this.duration = 0;

		this.id = game.props.length;
		game.props.push(this)
	}
	on(event, callback){
		this.callbacks[event] = callback;
	}

	fire (event){
		if (this.exist == false) return;
		if (!this.callbacks.hasOwnProperty(event)){
			console.log(event, 'not implemented', this.name)
			return;
		}
		var args = Array.prototype.slice.call( arguments );
		var topic = args.shift();
		this.callbacks[event].apply(undefined, args)
	}

	destroy (){
		//games[this.player.id].props.splice(games[this.player.id].props.indexOf(this),1)
		//games[this.player.id].update('destroy prop', EMPTY, this)
		this.exist = false;
		this.fire('dies', {})
		console.log('destroy')
	}


	render (){
		ctx.beginPath();
		ctx.arc(p.x*squareSize+ squareSize/2, p.y*squareSize+ squareSize/2, squareSize/4, 0, 2 * Math.PI, false);
		if (p.unit.player.num == 0){
			ctx.fillStyle = "#008080";
		} else {
			ctx.fillStyle = "#808000";
		}
		ctx.fill();
		ctx.lineWidth = 1;
		ctx.strokeStyle = '#000000';
		ctx.stroke();
	}

}

function propsCollisionCheck(unit, x, y){
	for (var j=0; j<game.props.length; j++){
		if (game.props[j] && game.props[j].x == x && game.props[j].y == y){
			game.props[j].fire('collision',event);
		}
	}
}
