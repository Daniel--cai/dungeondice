var IMAGES = {}
function ImageLoader(key, src){
	IMAGES[key] = new Image();
	IMAGES[key].src = src;
}

IMAGES['New Crest'] = [];
for (var i=0; i<6;i++){
	var image = new Image()
	image.src = 'assets/img/crest/'+ CREST_TEXT[i].toLowerCase() +'.png'
	IMAGES['New Crest'].push(image)
}
ImageLoader('Heart', 'assets/img/Health_Potion_item.png')
ImageLoader('Sword', 'assets/img/Long_Sword.png')
ImageLoader('Heart Grey',  'assets/img/Health_Potion_item_grey.png')
ImageLoader('Shield','assets/img/dshield.png')

ImageLoader('Crest', 'assets/img/championstats_icons.jpg')
ImageLoader('Lucian', 'assets/img/lucian.jpg')
ImageLoader('Lightslinger', 'assets/img/Lightslinger.png')
ImageLoader('LucianSquare', 'assets/img/LucianSquare.png')
ImageLoader('TeemoSquare', 'assets/img/TeemoSquare.png')
ImageLoader('Teemo', 'assets/img/teemo.jpg')
ImageLoader('Soraka', 'assets/img/soraka.jpg')
ImageLoader('SorakaSquare', 'assets/img/SorakaSquare.png')
ImageLoader('Garen', 'assets/img/garen.jpg')
ImageLoader('GarenSquare', 'assets/img/GarenSquare.png')
ImageLoader('Texture','assets/img/texture.jpg')
ImageLoader('Texture2','assets/img/texture2.jpg')
ImageLoader('UI', 'assets/img/border.png')
ImageLoader('UITEXTURE', 'assets/img/bgtexture.png')
ImageLoader('Runeterra', 'assets/img/runeterra.png')
ImageLoader('ButtonFrame', 'assets/img/buttonframe.png')
ImageLoader('Guard', 'assets/img/armor.png')
ImageLoader('Relentless Pursuit', 'assets/img/Relentless_Pursuit.png')
ImageLoader('Ardent Blaze', 'assets/img/Ardent_Blaze.png')
ImageLoader('Blinding Dart', 'assets/img/Blinding_Dart.png')
ImageLoader('Starcall', 'assets/img/Starcall.png')
ImageLoader('Piercing Light', 'assets/img/Piercing_Light.png')

ImageLoader('NasusSquare', 'assets/img/NasusSquare.png')
ImageLoader('Nasus', 'assets/img/Nasus.jpg')
ImageLoader('Siphoning Strike', 'assets/img/Siphoning_Strike.png')
ImageLoader('Spirit Fire', 'assets/img/Spirit_Fire.png')
ImageLoader('Soul Eater', 'assets/img/Soul_Eater.png')
