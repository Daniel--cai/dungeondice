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
    //console.log(player.num, opponent.num)
		game.init()

		if(num == 0){

			game.createUnit(player,UNITS['Darius'],[6,18])
			game.createUnit(player,UNITS['Nasus'],[7,18])
			game.createUnit(player,UNITS['Lucian'],[8,18])
			game.createUnit(player,UNITS['Soraka'],[5,17])
			game.createUnit(player,UNITS['Braum'],[5,16])
			game.createUnit(player,UNITS['Sivir'],[4,16])
			game.createUnit(player,UNITS['Ahri'],[6,17])
			game.createUnit(player,UNITS['Yasuo'],[3,17])
			game.createUnit(player,UNITS['Teemo'],[2,17])
			game.createUnit(player,UNITS['Sona'],[1,17])
			game.createUnit(player,UNITS['Janna'],[2,16])
			game.createUnit(player,UNITS['Vayne'],[3,16])
			game.createUnit(player,UNITS['Annie'],[3,15])
			game.createUnit(opponent,UNITS['Garen'],[1,16])
			game.createUnit(opponent,UNITS['Kogmaw'],[4,17])
			game.createUnit(opponent,UNITS['Nunu'],[4,15])
			//var a = new Move(game.monsters[10], [[2,16],[2,15],[2,14],[2,13],[2,12]])
			player.startTurn()


			//player.changeState(GAME_STATE_UNIT)
			player.changeActionState(ACTION_STATE_ROLL)
		} else {
			player.changeActionState(ACTION_STATE_END)
		}

		//console.log(window.player)
	});

	conn.on('data', function(data) {
		sendSwitch = false;
		//console.log('Received', data);
		if (data.id == 'move unit'){
			//game.monsters[data.unit].moveUnit([data.x, data.y])
			game.monsters[data.unit].movement(data.path)
			opponent.updatePool(CREST_MOVEMENT,-Math.max(+data.path.length-1+game.monsters[data.unit].impairment,1))
			opponent.animateDice(CREST_MOVEMENT)
			opponent.changeActionState(GAME_STATE_NEUTRAL)
		} else if (data.id == 'select unit'){
			opponent.unitSelected = data.unit
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
	 			disableConfirmButtons(false)
			}
		} else if (data.id == 'spell effect'){
			console.log(opponent.unitSelected)
			var spell = game.monsters[opponent.unitSelected].spells[data.spell]
			var target = data.target != EMPTY ? game.monsters[data.target]: null
			var event = {trigger: game.monsters[opponent.unitSelected], location: data.location, target:game.monsters[data.target]};
			spell.fire('effect',event);
			//conn.send({id:'spell effect', spell:player.spell, location:[x,y]})
		} else if (data.id == 'guard response'){
			game.combat.guard(data.data)
			game.combat.postattack()
			//changeUIState(GAME_STATE_UNIT)
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
			player.changeActionState(ACTION_STATE_NEUTRAL)
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
