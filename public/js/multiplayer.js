var peerjskey = '07h03d92my96yldi'
//peer = new Peer('one',{key: peerjskey});
var peer;
peer = new Peer ('one', {host:'localhost',port:9000, path: '/'})
var conn;

var player;
var opponent;

function openConnection(c,num){
	conn = c;
	conn.on('open', function() {
		console.log('connected to', c.peer)

		game = new Game()

 		player = new Player(num==0 ? 'one' : 'two')
		player.num = num;
		opponent = new Player(num==0 ? 'one' : 'two')
		opponent.num = num == 0 ? 1 : 0
		game.players = [player,opponent]
    console.log(player.num, opponent.num)
		game.init()

		if(num == 0){
			player.changeState(util.GAME_STATE_UNIT)
		} else {
			player.state = util.GAME_STATE_END
			changeUIState(util.GAME_STATE_END)
		}
		if (num == 1){
			//sendSwitch = false
			game.createUnit(opponent,UNITS['Darius'],[6,18])
			game.createUnit(opponent,UNITS['Ahri'],[6,17])
			game.createUnit(player,UNITS['Teemo'],[4,17])
			//sendSwitch = true
		}


		//console.log(window.player)
	});

	conn.on('data', function(data) {
		sendSwitch = false;
		console.log('Received', data);
		if (data.id == 'move unit'){
			//game.monsters[data.unit].moveUnit([data.x, data.y])
			game.monsters[data.unit].movement(data.path)
			opponent.updatePool(CREST_MOVEMENT,-data.path.length+1)
			opponent.animateDice(CREST_MOVEMENT)
			opponent.changeState(util.GAME_STATE_UNIT)
		} else if (data.id == 'select unit'){
			opponent.unitSelected = data.unit
		} else if (data.id == 'change state'){
			opponent.changeState(data.state)
			if (data.state == util.GAME_STATE_END){
				player.changeState(util.GAME_STATE_ROLL)
				changeUIState(util.GAME_STATE_ROLL)
			}
		} else if (data.id == 'update pool'){
			opponent.updatePool(data.crest, data.point)
		} else if (data.id == 'update tile'){
			opponent.updateTile(data.shape)
		} else if (data.id == 'make selection'){
			game.makeSelection(opponent);
		} else if(data.id == 'create unit'){
			var p1 = player;
			if (data.player != player.num) p1 = opponent
			game.createUnit(p1,UNITS[data.unitid],data.point)
			//conn.send({id:, player:player,id:id,point:point})
		} else if (data.id == 'attack'){
			game.monsters[data.trigger].attack(game.monsters[data.target])
			if (data.guard){
				console.log('block damage?')
				yesButton.hidden = false;
				noButton.hidden = false;
			}
		} else if (data.id == 'spell effect'){
			console.log(opponent.unitSelected)
			var spell = game.monsters[opponent.unitSelected].spells[data.spell]
			var target = data.target != util.EMPTY ? game.monsters[data.target]: null
			var event = {trigger: game.monsters[opponent.unitSelected], location: data.location, target:game.monsters[data.target]};
			spell.fire('effect',event);
			//conn.send({id:'spell effect', spell:player.spell, location:[x,y]})
		} else if (data.id == 'guard response'){
			game.combat.guard(data.data)
			game.combat.postattack()
			changeUIState(util.GAME_STATE_UNIT)
		} else if (data.id == 'damage unit'){
			DamageUnit(data.trigger,data.target,data.damage)
		} else if (data.id == 'apply buff'){
			ApplyBuff(game.monsters[data.caster],game.monsters[data.target], BUFFS[data.buff]())
		} else if (data.id == 'new prop'){
			//console.log(PROPS[data.name])
			PROPS[data.name](data.point,game.monsters[data.unit]);
		} else if(data.id == 'end turn'){
			opponent.endTurn();
			game.turn++;
      player.startTurn()
      player.changeState(util.GAME_STATE_UNIT)
		}
		sendSwitch = true;


	 });
	//setTimeout(function(){ conn.send('Hello!'); }, 3000);
  // Send messagess

}

peer.on('error',function(err){
	if (err.type == 'unavailable-id'){
		console.log('key already taken')
		peer = new Peer ('two', {host:'localhost',port:9000, path: '/'})
		peer.on('open', function(id) {
			console.log('Player 2 id is: ' + id);
			openConnection(peer.connect('one'),0)
		});


	}
})

peer.on('connection', function(conn) {
	console.log('received connection')
	openConnection(conn,1)

 });

peer.on('open', function(id){
	console.log('received id', id)
});
