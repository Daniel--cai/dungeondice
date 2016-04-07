
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
var passiveButton = document.getElementById('passive');
var qButton = document.getElementById('q');
var wButton = document.getElementById('w');
var eButton = document.getElementById('e');
var rButton = document.getElementById('r');
var spellButton = [qButton, wButton, eButton, rButton]

var statPanel = document.getElementById("stat");
var crestPanel = document.getElementById("crest");
var dicePanel = document.getElementById("diceroll");
var playerPanel = document.getElementById("players")
var content = document.getElementById("content")


function disableSpell(d){
		passiveButton.hidden = d;
		qButton.hidden = d;
		wButton.hidden = d;
		eButton.hidden = d;
		rButton.hidden = d;
		passiveButton.disabled = d;
		qButton.disabled = d;
		wButton.disabled = d;
		eButton.disabled = d;
		rButton.disabled = d;
		//player.spell = util.EMPTY
}

function disableButtons(a,b){
		rollButton.disabled = a;
		endturnButton.disabled = b;
}
