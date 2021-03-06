
class Player {
	constructor(id){
		this.id = id;
		this.num;
		this.pool = [5,5,5,5,5]

		//this.state = GAME_STATE_END;
		//this.actionstate = PLAYER_STATE_NEUTRAL;
		this.summon = [];
		//this.summonlevel = 0;
		this.summonchoice = EMPTY;
		//this.dicePattern
		//this.diceButtonFocus = -1;

		this.shape = 0;
		this.rotate = 0;

		this.cursorX;
		this.cursorY;

		this.tileSelected = []
		this.unitSelected = EMPTY;
		this.movePath = []
		this.rolled = false;
		this.spell = EMPTY;
		this.scrollScale = 1;

		this.actionstate = 0

		this.valid = false;
		this.dices = [DICES['Lucian'],DICES['Braum'],DICES['Teemo'],DICES['Nunu'],DICES['Bard'],
									DICES['Vayne'],DICES['Janna'],DICES['Janna'],DICES['Vayne'],DICES['Bard'],
									DICES['Teemo'],DICES['Nasus'],DICES['Garen'],DICES['Garen'],DICES['Garen']];
		this.spell = EMPTY;
	}


	animateDice(crest,delay){
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

	updatePool(crest, point){

		this.pool[crest] += point;


		//console.log('update pool')
		//if (sendSwitch)
			//conn.send({id:'update pool', crest:crest, point:point})
		//games[this.id].update('pool', this.num, {crest:crest, point:point})
	}

	updateShape(x,y){
		if (this.summonchoice == EMPTY) return;
		var shape = [];
		var cshape = rotateShape(this.shape,this.rotate);
		for (var i=0; i<cshape.length; i++){
			shape.push([cshape[i][0]+x, cshape[i][1]+y])
		}
		return shape;

	}

	updateTile(shape){
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

	getCrestPool(crest){
  		return this.pool[crest]
	}

	resetState(){
		this.movePath = []
		this.tileSelected = []
		this.spell = -1;

		showUnitSpells()
		disableSpell(true)
		disableAction(true,true,true)
		disableConfirmButtons(true)
	}

	changeActionState(state){
		this.actionstate = state;
		this.resetState()
		ActionClass[state].fire('enter')
		console.log('Action:',ActionClass[state]._name)

	}


	/*
	changeState(state){

		this.state = state;
		if (state != GAME_STATE_COMBAT){
			this.unitSelected = EMPTY;
		}
		//changeUIState(state)
		this.changeActionState(state)
	}
*/
	startTurn(){
		for (var i=0;i<game.monsters.length; i++){
			for (var j=0; j<game.monsters[i].buff.length;j++){
				var buff = game.monsters[i].buff[j]
				buff.fire('turn',{trigger:game.monsters[i]})
			}
		}
	}

	endTurn(){

		for (var i=0;i<game.monsters.length; i++){
			for (var j=0; j<game.monsters[i].buff.length;j++){
				var buff = game.monsters[i].buff[j]
				//console.log(game.monsters[i].type.name)
				//console.log(game.monsters[buff.owner].type.name, this.num)
				//if (game.monsters[buff.owner].player.num != this.num) continue;

				if (buff.duration != 0) {
					buff.duration--;
					console.log('buff is now ', buff.duration)
					if (buff.duration == 0){
						console.log('removing', buff.name,'from',game.monsters[i].type.name)
						game.monsters[i].removeBuff(buff.name)
					}
				}
				//buff.fire('turn',{trigger:game.monsters[i]})
			}
		}
		for (var i=0; i<game.props.length; i++){
			var p = game.props[i];
			if (p.duration == 0) continue
			p.duration --;
			if (p.duration <= 0) {
				p.destroy();
			}
			//if (p.unit != EMPTY && p.unit.player.num != player.num) return;
			p.fire('turn',{trigger:p})
		}

		for (var i=0;i<game.projectiles.length;i++){
			var p = game.projectiles[i]
			//console.log(p.delay)
			p.delay--
		}


		this.changeActionState(ACTION_STATE_END);
		this.rolled = false;
		this.summon = [];
		this.summonchoice = EMPTY;
		this.summonlevel = 0;
		this.shape = 0;
		this.rotate = 0;
		this.valid = false;
		this.spell = EMPTY
		this.unitSelected = EMPTY

		for (var i=0; i<game.monsters.length;i++){
			if (!game.monsters[i].exist) continue;
			if (game.monsters[i].player.num == this.num){
				game.monsters[i].hasAttacked = false;
				game.monsters[i].canAttacked = true;
			}
		}
	}




	selectUnit(x,y){
		//var game = games[this.id]

		var m = game.monsters[game.board.getUnitAtLoc(x,y)]
		if (m.hasBuff('Stunned') != EMPTY) return;
		if (this.unitSelected == m.id) {
			this.unitSelected = EMPTY
			this.changeActionState(ACTION_STATE_NEUTRAL);
			conn.send({id:'select unit', unit:EMPTY})

		} else {
			this.unitSelected = m.id;
			conn.send({id:'select unit', unit:m.id})
			console.log('Unit selected:', m.id)
			ActionClass[ACTION_STATE_NEUTRAL].fire('button',{unit:m})
			return true
		}
		return false;
	}

	//return this;
}
