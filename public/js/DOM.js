
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
var spellButton = [pButton, qButton, wButton, eButton, rButton]

var statPanel = document.getElementById("stat");
var crestPanel = document.getElementById("crest");
var dicePanel = document.getElementById("diceroll");
var playerPanel = document.getElementById("players")
var content = document.getElementById("content")


function disableSpell(d){
		pButton.hidden = d;
		qButton.hidden = d;
		wButton.hidden = d;
		eButton.hidden = d;
		rButton.hidden = d;
		pButton.disabled = d;
		qButton.disabled = d;
		wButton.disabled = d;
		eButton.disabled = d;
		rButton.disabled = d;
		//player.spell = util.EMPTY
}

function showUnitSpells(m){
	for (var i = 0; i<5;i++){
		if (m.spells[i]){
			spellButton[i].innerHTML = m.spells[i].name
			spellButton[i].hidden = false;
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
		rollButton.disabled = a;
		endturnButton.disabled = b;
}
