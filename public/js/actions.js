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

ActionClass[ACTION_STATE_NEUTRAL].on('click', function(){
  var x = cursorX;
  var y = cursorY;
  var u = game.board.getUnitAtLoc(x,y)
  //console.log(u, EMPTY)
  console.log('ActionClassNetural')
  if (player.state == GAME_STATE_UNIT){
    if (u == EMPTY) return;
    //console.log('unit select')
      //socket.send(JSON.stringify({id:'mouse click', data:{state: 'select', loc:[x, y]}}))
    player.selectUnit(x, y)
  }
})

ActionClass[ACTION_STATE_MOVE].on('click', function(){
  console.log('moving!')
  if (player.unitSelected == EMPTY) return
  var m = game.monsters[player.unitSelected]
  if (m.player.num != player.num) return
  var x = cursorX;
  var y = cursorY;
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
    player.changeState(GAME_STATE_UNIT)
  }
})


ActionClass[ACTION_STATE_SPELL] = new Action('spell')
