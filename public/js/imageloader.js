FILE_DIR = 'assets/img/'

var IMAGES = {}
function ImageLoader(key, src){
	IMAGES[key] = new Image();
	IMAGES[key].src = FILE_DIR+src;
}

IMAGES['New Crest'] = [];
for (var i=0; i<6;i++){
	var image = new Image()
	image.src = 'assets/img/crest/'+ CREST_TEXT[i].toLowerCase() +'.png'
	IMAGES['New Crest'].push(image)
}


ImageLoader('HUD', 'buttons/rollhud.png')


ImageLoader('Heart', 'Health_Potion_item.png')
ImageLoader('Sword', 'Long_Sword.png')
ImageLoader('Heart Grey',  'Health_Potion_item_grey.png')
ImageLoader('Shield','dshield.png')
ImageLoader('ButtonHUD','buttons/button.png')
ImageLoader('ButtonHover','buttons/button-corner.png')
ImageLoader('Crest', 'championstats_icons.jpg')
ImageLoader('Lucian', 'lucian.jpg')
ImageLoader('Lightslinger', 'Lightslinger.png')
ImageLoader('LucianSquare', 'LucianSquare.png')
ImageLoader('TeemoSquare', 'TeemoSquare.png')
ImageLoader('Teemo', 'teemo.jpg')
ImageLoader('Soraka', 'soraka.jpg')
ImageLoader('SorakaSquare', 'SorakaSquare.png')
ImageLoader('Garen', 'garen.jpg')
ImageLoader('GarenSquare', 'GarenSquare.png')
ImageLoader('Texture','texture.jpg')
ImageLoader('Texture2','texture2.jpg')
ImageLoader('UI', 'border.png')
ImageLoader('UITEXTURE', 'bgtexture.png')
ImageLoader('Runeterra', 'runeterra.png')
ImageLoader('ButtonFrame', 'buttons/button-corner.png')
ImageLoader('Guard', 'armor.png')
ImageLoader('Relentless Pursuit', 'Relentless_Pursuit.png')
ImageLoader('Ardent Blaze', 'Ardent_Blaze.png')
ImageLoader('Blinding Dart', 'Blinding_Dart.png')
ImageLoader('Starcall', 'Starcall.png')
ImageLoader('Piercing Light', 'Piercing_Light.png')

ImageLoader('NasusSquare', 'NasusSquare.png')
ImageLoader('Nasus', 'Nasus.jpg')
ImageLoader('Siphoning Strike', 'Siphoning_Strike.png')
ImageLoader('Spirit Fire', 'Spirit_Fire.png')
ImageLoader('Soul Eater', 'Soul_Eater.png')

ImageLoader('Braum', 'Braum.jpg')
ImageLoader('BraumSquare', 'braumsquare.jpg')
ImageLoader('Concussive Blows', 'Concussive_Blows.png')
ImageLoader('Stand Behind Me','Stand_Behind_Me.png')
ImageLoader('Stunned', 'Stun_icon.png')

ImageLoader('Ahri', 'Ahri.jpg')
ImageLoader('Orb of Deception Sprite', 'orbofdeceptionsprite.png')
ImageLoader('Orb of Deception', 'Orb_of_Deception.png')
ImageLoader('AhriSquare', 'AhriSquare.png')
ImageLoader('Essence Theft', 'Essence_Theft.png')
ImageLoader('Charm', 'Charm.png')

ImageLoader('Darius', 'Darius.jpg')
ImageLoader('DariusSquare', 'DariusSquare.png')
ImageLoader('Hemorrhage', 'Hemorrhage.png')
ImageLoader('Noxian Guillotine', 'Noxian_Guillotine.png')
ImageLoader('Decimate', 'Decimate.png')

ImageLoader('SivirSquare', 'SivirSquare.jpg')
ImageLoader('Sivir', 'Sivir.jpg')
ImageLoader('Fleet of Foot', 'Fleet_of_Foot.png')
ImageLoader('Spell Shield', 'Spell_Shield.png')
ImageLoader('Boomerang Blade', 'Boomerang_Blade.png')

ImageLoader('Yasuo', 'Yasuo.jpg')
ImageLoader('YasuoSquare', 'YasuoSquare.jpg')
ImageLoader('Way of the Wanderer', 'Way_of_the_Wanderer.png')
ImageLoader('Steel Tempest','Steel_Tempest.png')

ImageLoader('Kogmaw', 'Kog_Maw.jpg')
ImageLoader('KogmawSquare','KogmawSquare.png')
ImageLoader('Icathian Surprise', 'Icathian_Surprise.png')
ImageLoader('Bio Arcane Barrage','Bio-Arcane_Barrage.png')
ImageLoader('Living Artillery','Living_Artillery.png')

ImageLoader('Sona', 'Sona.jpg')
ImageLoader('SonaSquare', 'sona.png')
ImageLoader('Power Chord', 'Power_Chord.png')
ImageLoader('Song of Celerity', 'Song_of_Celerity.png')
ImageLoader('Hymn of Valor', 'Hymn_of_Valor.png')
ImageLoader('Aria of Perseverance','Aria_of_Perseverance.png')
ImageLoader('Crescendo','Crescendo.png')

ImageLoader('Janna','Janna.jpg')
ImageLoader('JannaSquare','jannasquare.jpg')
ImageLoader('Tailwind','Tailwind.png')
ImageLoader('Eye of the Storm','Eye_of_the_Storm.png')

ImageLoader('VayneSquare', 'VayneSquare.png')
ImageLoader('Vayne', 'Vayne.jpg')
ImageLoader('Night Hunter', 'Night_Hunter.png')
ImageLoader('Final Hour', 'Final_Hour.png')

ImageLoader('Annie', 'Annie.jpg')
ImageLoader('AnnieSquare', 'AnnieSquare.png')
ImageLoader('Disintegrate', 'Disintegrate.png')
ImageLoader('Pyromania', 'Pyromania.png')
ImageLoader('Molten Shield', 'Molten_Shield.png')

ImageLoader('Nunu','Nunu.jpg')
ImageLoader('NunuSquare','NunuSquare.png')
ImageLoader('Visionary','Visionary.png')
ImageLoader('Ice Blast', 'Ice_Blast.png')

ImageLoader('Bard', 'Bard.jpg')
ImageLoader('BardSquare', 'Bard.png')
ImageLoader('Magical Journey', 'Magical_Journey.png')
