
function Player(id){
	this.id = id;
	this.num;
	this.pool = [5,5,5,5,5]

	this.state = util.GAME_STATE_END;
	//this.actionstate = util.PLAYER_STATE_NEUTRAL;
	this.summon = [];
	this.summonlevel = 0;
	this.summonchoice = util.EMPTY;

	this.shape = 0;
	this.rotate = 0;

	this.cursorX;
	this.cursorY;

	this.tileSelected = []
	this.unitSelected = util.EMPTY;
	this.movePath = []
	this.rolled = false;
	this.spell = util.EMPTY;

	this.valid = false;
	this.dices = [DICES['Lucian'],DICES['Lucian'],DICES['Teemo'],DICES['Teemo'],DICES['Teemo'],
								DICES['Soraka'],DICES['Soraka'],DICES['Soraka'],DICES['Soraka'],DICES['Soraka'],
								DICES['Garen'],DICES['Garen'],DICES['Garen'],DICES['Garen'],DICES['Garen']];

	this.diceButtonFocus = -1;

	this.spell = util.EMPTY;

	this.animateDice = function(crest,delay){
		var size = 25
		var gap = 10
		var x = 500
		var y = this.num == player.num ? 50 : 400;
		y+i*(size+gap)
		animation.push({
			effect:'grow', image:IMAGES['New Crest'][crest],
			x:x,y:y+(crest)*(size+gap)+boardYPadding, dx:20,dy:20, sx:size, sy:size,
			duration:0.75, fade:true,delay:delay
		})
	}

	this.updatePool = function(crest, point){

		this.pool[crest] += point;


		//console.log('update pool')
		//if (sendSwitch)
			//conn.send({id:'update pool', crest:crest, point:point})
		//games[this.id].update('pool', this.num, {crest:crest, point:point})
	}

	this.updateShape = function(x,y){
		if (this.summonchoice == util.EMPTY) return;

		var shape = [];
		var cshape = rotateShape(this.shape,this.rotate);
		for (var i=0; i<cshape.length; i++){
			shape.push([cshape[i][0]+x, cshape[i][1]+y])
		}
		return shape;

	}

	this.updateTile = function(shape){
		this.tileSelected = shape;
		if (this.tileSelected == null) this.tileSelected = []
		//console.log('update tile')
		this.valid = game.board.validPlacement(this)
		//console.log(shape)
		//console.log('setting', this.num, this.valid)
		if (sendSwitch && shape){
			conn.send({id:'update tile', shape:shape})
		}
	}

	this.getCrestPool = function(crest){
  		return this.pool[crest]
	}





	this.changeState = function(state){
		//var game = games[this.id]
		//console.log('change state')
		//console.log(game.combat)
		this.state = state;
		if (state != util.GAME_STATE_COMBAT){
			this.unitSelected = util.EMPTY;
		}
		this.movePath = []
		this.tileSelected = []
		this.spell = -1;


		changeUIState(state)

	}

	this.changeActionState = function(state){
		this.actionstate = state;
	}

	this.startTurn = function(){

		for (var i=0;i<game.monsters.length; i++){
			for (var j=0; j<game.monsters[i].buff.length;j++){
				var buff = game.monsters[i].buff[j]
				//console.log(game.monsters[i].type.name)
				//console.log(game.monsters[buff.owner].type.name, this.num)
				if (game.monsters[buff.owner].player.num != this.num) continue;
				if (buff.duration == 0) continue
				buff.duration--;
				buff.fire('turn',{trigger:game.monsters[i]})
				if (buff.duration == 0){
					console.log('removing', buff.name,'from',game.monsters[i].type.name)
					game.monsters[i].removeBuff(buff.name)
				}
			}
		}
		for (var i=0; i<game.props.length; i++){
			var p = game.props[i];
			if (p.unit != util.EMPTY && p.unit.player.num != player.num) return;
			p.fire('turn',{trigger:p})
		}

		for (var i=0;i<projectiles.length;i++){
			var p = projectiles[i]
			console.log(p.delay)
			p.delay--
		}
	}

	this.endTurn = function (){
		//sockets[this.id].send(JSON.stringify({data:'alert', data:"End Phase"}));
		console.log('end turn')
		this.changeState(util.GAME_STATE_END);
		this.rolled = false;
		this.summon = [];
		this.summonchoice = util.EMPTY;
		this.summonlevel = 0;
		this.shape = 0;
		this.rotate = 0;
		this.valid = false;
		this.spell = util.EMPTY
		this.unitSelected = util.EMPTY

		for (var i=0; i<game.monsters.length;i++){
			if (!game.monsters[i].exist) continue;
			if (game.monsters[i].player.num == this.num){
				game.monsters[i].hasAttacked = false;
				game.monsters[i].canAttacked = true;
			}
		}
		//this.changeState(util.GAME_STATE_ROLL);
	}

	this.onRoll = function(data){
		console.log(this.dices[2])
		var summonlevel = 0;
		var summon = [[],[],[],[],[]];
		var result = [];
		//var dicechoice= [];

		for (var i=0;i<data.length; i++){
			var dices = this.dices[data[i]]
			var r = dices.roll();
			result.push(r)


			if (r[0] != CREST_SUMMON){
				//console.log(this.pool);
				//this.updatePool(r[0],r[1])
				//console.log(this.pool);
				console.log(CREST_TEXT[r[0]] + " " + r[1]);
			} else {
				summon[r[1]].push(data[i]);
				console.log("SUMMON " + r[1]);
				if (summon[r[1]].length > 1){
					summonlevel = r[1]
				}
			}
		}

		if (summonlevel){
			//string += "Summoning level: " + summonlevel + "<br\>";
			this.summon = summon[summonlevel];
			//result = summon[summonlevel]
			//console.log('hello',this.summon)
			//this.summonlevel = summonlevel
		}
		return result;
	}

	this.alert = function(data){
		//send(this.id, {id:'alert', data:data})
	}

	this.selectUnit = function(x,y){
		//var game = games[this.id]
		var m = game.board.getUnitAtLoc(x,y)

		if (game.monsters[m].hasBuff('Stunned') != util.EMPTY) return;

		if (this.unitSelected == m) {
			this.changeState(util.GAME_STATE_UNIT);
			conn.send({id:'select unit', unit:util.EMPTY})

		} else if (game.monsters[m].player.num==this.num){
			this.changeState(util.GAME_STATE_SELECT);
			this.unitSelected = m;
			conn.send({id:'select unit', unit:m})
			//animation.push({type:'message', text:'End Phase', color:red,x:-200,y:250,speed:1000,  duration:2})
			disableSpell(true)
			if (player.num == this.num){
				for (var i = 0; i<4;i++){
					if (game.monsters[m].spells[i]){
						spellButton[i].innerHTML = game.monsters[m].spells[i].name
						spellButton[i].hidden = false;
						if (game.monsters[m].spells[i].type != "passive")
						spellButton[i].disabled = false;
					}
				}
				if (game.monsters[m].spells[4]){
					passiveButton.innerHTML = game.monsters[m].spells[4].name
					passiveButton.disabled = true
				}

			}
			return true
		}
		return false;
	}

	return this;
}
