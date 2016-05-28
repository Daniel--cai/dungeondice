ActionClass = []
class Action {
  constructor(name){
    this._name = name
    this._callbacks = {}
  }
  on(event, callback) {
      this._callbacks[event] = callback
  }
  fire(event){

    if (!this._callbacks.hasOwnProperty(event)){
      return;
    }
    var args = Array.prototype.slice.call( arguments );
    var topic = args.shift();
    this._callbacks[event].apply(undefined, args)
  }
}

ActionClass[ACTION_STATE_NEUTRAL] = new Action('neutral')
ActionClass[ACTION_STATE_ATTACK]  = new Action('attack')
ActionClass[ACTION_STATE_MOVE] = new Action('move')
ActionClass[ACTION_STATE_SPELL]  = new Action('spell')
ActionClass[ACTION_STATE_SUMMON] = new Action('summon')
ActionClass[ACTION_STATE_RESPONSE] = new Action('response')
ActionClass[ACTION_STATE_AWAITING] = new Action('awaiting')
ActionClass[ACTION_STATE_END] = new Action('end')

ActionClass[ACTION_STATE_NEUTRAL].on('enter',function(event){
  disableButtons(true,false)
})

ActionClass[ACTION_STATE_NEUTRAL].on('click', function(event){
  var x = event.location[0];
  var y = event.location[1];
  if (event.unit == null) return
  if (player.selectUnit(x, y) && event.unit.player.num == player.num){
    showUnitSpells(event.unit)
    disableSpell(false)
    disableAction(false,false,false)
  }


})


ActionClass[ACTION_STATE_MOVE].on('button', function(){

  var m = game.monsters[player.unitSelected]
  player.changeActionState(ACTION_STATE_MOVE)
  player.movePath = findPossiblePath([m.x, m.y],player.getCrestPool(CREST_MOVEMENT)-m.impairment)
  console.log('impairment cost',player.getCrestPool(CREST_MOVEMENT)-m.impairment)
  disableAction(true,true,false)

})

ActionClass[ACTION_STATE_MOVE].on('click', function(event){
  console.log('moving!')
  if (player.unitSelected == EMPTY) return
  var m = game.monsters[player.unitSelected]
  if (m.player.num != player.num) return
  var x = event.location[0];
  var y = event.location[1];
  if (game.board.getTileState(x, y) == EMPTY) return
    //console.log('moving')
    console.log('tile state')
  var path = findPath([m.x,m.y],[x,y]);
  var plen = path.length
  if (plen > 1 && plen-1 <= player.getCrestPool(CREST_MOVEMENT) - m.impairment) {
    m.movement(path)
    conn.send({id:'move unit', unit:m.id, path:path})
    //console.log(m.impairment)
    player.updatePool(CREST_MOVEMENT,-Math.max(plen-1+m.impairment,1))
    player.animateDice(CREST_MOVEMENT)
    player.changeActionState(ACTION_STATE_NEUTRAL)
  }
})

ActionClass[ACTION_STATE_ATTACK].on('button', function(){
  player.changeActionState(ACTION_STATE_ATTACK)
  disableAction(true,true,false)
  var m = game.monsters[player.unitSelected]
  player.movePath = getAdjacentTiles(m.x,m.y)
  for (let i = player.movePath.length-1; i>=0; i--){
    var x = player.movePath[i][0]
    var y = player.movePath[i][1]
    if (game.board.getTileState(x,y) == EMPTY || game.board.getUnitAtLoc(x,y) != EMPTY){
      player.movePath.splice(i,1)
    }
  }



})

ActionClass[ACTION_STATE_ATTACK].on('click', function(event){
  if (player.unitSelected == EMPTY) return
  if (event.unit == null) return
  if (event.unit.player.num == player.num) return
  console.log('atacking')
  game.monsters[player.unitSelected].attack(event.unit)

})


ActionClass[ACTION_STATE_SPELL].on('click',function(event){
  console.log('cast',player.spell)
  var spell = game.monsters[player.unitSelected].spells[player.spell]
  var m = game.board.getUnitAtLoc(x,y)
  var target = m != EMPTY ? game.monsters[m] : null
  //console.log(target.name)
  var event = {trigger: game.monsters[player.unitSelected], location: [x,y], target:target};
  conn.send({id:'spell effect', spell:player.spell, location:[x,y], target:m})
  spell.fire('effect',event);
})

ActionClass[ACTION_STATE_ROLL] = new Action('roll')
ActionClass[ACTION_STATE_ROLL].on('enter', function(event){
  disableButtons(false,true)
  for (i=0;i<15;i++) DicePool[i].reset();
  for (i=0; i<15; i++){
    if (player.dices[i]){
      DicePool[i].hidden = false;
    }
  }
})


ActionClass[ACTION_STATE_ROLL].on('render',function(event){
  //HUD
  ctx.globalAlpha = 1
	ctx.drawImage(IMAGES['HUD'], 50,175, 400,300)
	ctx.globalAlpha = 1

  //Dice selection
	for (var i=0; i<DiceSelection.length; i++){
		var l = DiceSelection.length
		//100+boardXPadding + 75*i,150+boardYPadding
		var x = 25+(l-i)*75
		var y = 200
		var s = 50;
		var txgap = 18;
		var tygap = 35;
		ctx.drawImage(IMAGES['New Crest'][CREST_SUMMON],  x ,y, s,s)
		var lvl = player.dices[DiceSelection[i].id].pattern[0][1]
		ctx.fillStyle = white;
		ctx.strokeStyle = black;
		ctx.lineWidth = 2;
		ctx.font = "bolder 30px Arial";

		ctx.strokeText(lvl,x+txgap,y+tygap);
		ctx.fillText(lvl,x+txgap,y+tygap);
  }
  for (var i=0;i<Buttons.length;i++){
		ctx.globalAlpha = 1
		if (!Buttons[i].hidden) Buttons[i].render()
	}

  //dice pattern
  var count = 0
  var xpad = 110;
  var ypad = 260
  var xgap = 30;
  var txgap =9;
  var tygap =20;
  if (player.dicePattern == null) return;
  for (var j=0; j<6; j++){
    var p = player.dicePattern.pattern[j];
    ctx.fillStyle = white
    ctx.strokeStyle = black
    ctx.drawImage(IMAGES['New Crest'][p[0]],xpad +j*xgap, ypad, 25, 25)
    ctx.font = "bolder 20px Arial ";
    ctx.lineWidth = 1;
    ctx.fillText(p[1],xpad + j* xgap+txgap ,ypad+ tygap);
    ctx.strokeText(p[1],xpad + j* xgap+txgap ,ypad + tygap);
  }
})


ActionClass[ACTION_STATE_SUMMON].on('click', function(event){
  if (!game.makeSelection(player)) return
  conn.send({id:'make selection'})
  game.createUnit(player,player.dices[player.summonchoice].type,event.location)
  //DicePool[player.summonchoice].hidden = true;
  player.dices[player.summonchoice] = null;
  //SummonPool = []
  player.changeActionState(ACTION_STATE_NEUTRAL)
})

ActionClass[ACTION_STATE_SUMMON].on('move',function(event){
  player.updateTile(player.updateShape(event.location[0], event.location[1]))
})

ActionClass[ACTION_STATE_SUMMON].on('enter',function(event){
    disableButtons(true,true)
})

ActionClass[ACTION_STATE_SUMMON].on('render',function(event){
  for (var i=0;i<SummonPool.length;i++){
    ctx.globalAlpha = 1
    if (!SummonPool[i].hidden) SummonPool[i].render()
  }
})


ActionClass[ACTION_STATE_RESPONSE].on('enter', function(event){
  disableButtons(true,true)
})

function responseButton(event){
	conn.send({id:'guard response', data:event.response})
	event.combat.guard(event.response)
	event.combat.postattack()

}

ActionClass[ACTION_STATE_RESPONSE].on('response', function(event){
  responseButton(event)
  disableConfirmButtons(true)
  console.log('response!')
})


ActionClass[ACTION_STATE_AWAITING].on('enter', function(event){
  disableButtons(true,true)
  disableConfirmButtons(false)
  console.log('awaiting!')
})

ActionClass[ACTION_STATE_END].on('enter', function(event){
  disableButtons(true,true)
  DiceSelection = []
})

ActionClass[ACTION_STATE_END].on('click', function(event){
  var x = event.location[0];
  var y = event.location[1];
  if (event.unit == null) return
  player.selectUnit(x, y)
})
