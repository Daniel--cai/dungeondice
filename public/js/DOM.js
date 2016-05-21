
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
var spellButton = [0,1,2,3,4].map(function (i){
	return document.getElementById('button'+i);
})

var statPanel = document.getElementById("stat");
var crestPanel = document.getElementById("crest");
var dicePanel = document.getElementById("diceroll");
var playerPanel = document.getElementById("players")
var content = document.getElementById("uipanel")

var moveButton = document.getElementById("move");
var attackButton = document.getElementById("attack");


for (let i = 1; i < spellButton.length; i++){
	spellButton[i].addEventListener("click", function(){
		spellButtonEffect(i)
	})
}

function disableAction(move,attack,cancel){
	moveButton.style.visibility = move == true ? 'hidden': 'visible'
	attackButton.style.visibility = attack == true ? 'hidden': 'visible'
	cancelButton.style.visibility = cancel == true ? 'hidden': 'visible'
}


function disableSpell(d){
		var hidden = d == true ? 'hidden': 'visible'
		for (var i = 0; i<5; i++){
			spellButton[i].disabled = d;
			spellButton[i].style.visibility = hidden;
		}
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
