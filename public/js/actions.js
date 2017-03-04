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
ActionClass[ACTION_STATE_ROLL] = new Action('roll')
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
  var m = game.board.getUnitAtLoc(event.location[0],event.location[1])
  var target = m != EMPTY ? game.monsters[m] : null
  //console.log(target.name)
  var event = {trigger: game.monsters[player.unitSelected], location: event.location, target:target};
  conn.send({id:'spell effect', spell:player.spell, location:event.location, target:m})
  spell.fire('effect',event);
})


ActionClass[ACTION_STATE_ROLL].on('enter', function(event){
  disableButtons(false,true)
  SummonPool.resetDicePool()
})


ActionClass[ACTION_STATE_ROLL].on('render',function(event){
  //HUD
  ctx.globalAlpha = 1
	ctx.drawImage(IMAGES['HUD'], 50,175, 400,300)
	ctx.globalAlpha = 1

  //Dice selection
  SummonPool.render()
  for (var i=0;i<Buttons.length;i++){
		ctx.globalAlpha = 1
		if (!Buttons[i].hidden) Buttons[i].render()
	}
  //unit
})


ActionClass[ACTION_STATE_SUMMON].on('click', function(event){
  if (!game.makeSelection(player)) return
  conn.send({id:'make selection'})
  game.createUnit(player,player.dices[player.summonchoice].type,event.location)
  //DicePool[player.summonchoice].hidden = true;
  player.dices[player.summonchoice] = null;
  player.changeActionState(ACTION_STATE_NEUTRAL)
})

ActionClass[ACTION_STATE_SUMMON].on('move',function(event){
  player.updateTile(player.updateShape(event.location[0], event.location[1]))
})

ActionClass[ACTION_STATE_SUMMON].on('enter',function(event){
    disableButtons(true,true)
})

ActionClass[ACTION_STATE_SUMMON].on('render',function(event){
  SummonPool.render()
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
  //DiceSelection = []
})

ActionClass[ACTION_STATE_END].on('click', function(event){
  var x = event.location[0];
  var y = event.location[1];
  if (event.unit == null) return
  player.selectUnit(x, y)
})
