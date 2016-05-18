
var canvas = document.getElementById("games");
//var switchButton = document.getElementById("switch");
//var summonButton = document.getElementById("summon");

var rollButton = document.getElementById("roll");
var endturnButton = document.getElementById("endturn");
var yesButton = document.getElementById('yesguard');
var noButton = document.getElementById('noguard');
//var moveButton = document.getElementById('move');
//var attackButton = document.getElementById('attack');
//var abilityButton = document.getElementById('ability');
var cancelButton = document.getElementById('cancel');
var pButton = document.getElementById('button1');
var qButton = document.getElementById('button2');
var wButton = document.getElementById('button3');
var eButton = document.getElementById('button4');
var rButton = document.getElementById('button5');

var attackButton = document.getElementById('attack');
var attackButton = document.getElementById('move');

var spellButton = [pButton, qButton, wButton, eButton, rButton]

var statPanel = document.getElementById("stat");
var crestPanel = document.getElementById("crest");
var dicePanel = document.getElementById("diceroll");
var playerPanel = document.getElementById("players")
var content = document.getElementById("uipanel")

var moveButton = document.getElementById("move");
var attackButton = document.getElementById("attack");


function disableAction(boolean){
	d = boolean == false ? 'hidden': 'visible'
	moveButton.style.visibility = d
	attackButton.style.visibility = d
	d = boolean == true ? 'hidden': 'visible'
	cancelButton.style.visibility = d
}

function disableSpell(d){
		pButton.disabled = d;
		qButton.disabled = d;
		wButton.disabled = d;
		eButton.disabled = d;
		rButton.disabled = d;
		d = d == true ? 'hidden': 'visible'
		pButton.style.visibility = d;
		qButton.style.visibility = d;
		wButton.style.visibility = d;
		eButton.style.visibility = d;
		rButton.style.visibility = d;

		//player.spell = util.EMPTY
}

function showUnitSpells(m){
	for (var i = 0; i<5;i++){
		if (m.spells[i]){
			spellButton[i].innerHTML = m.spells[i].name
			spellButton[i].style.visibility = 'visible';
			if (m.spells[i].type != "passive")
			spellButton[i].disabled = false;
		}
	}
	/*
	if (m.spells[4]){
		passiveButton.innerHTML = game.monsters[m].spells[4].name
		passiveButton.disabled = true
	}
	*/
}

function disableButtons(a,b){
	a = a == true ? 'hidden' : 'visible'
	b = b == true ? 'hidden' : 'visible'
	rollButton.style.visibility = a;
	endturnButton.style.visibility = b;
}

function disableConfirmButtons(a){
	a = a == true ? 'hidden' : 'visible'
	yesButton.style.visibility = a
	noButton.style.visibility = a
}
