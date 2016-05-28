if(typeof exports == 'undefined'){
    var exports = this['util'] = {};
}
shapes = [
  //t
  [[0,0],[0,-1],[-1,0],[1,0], [0,1],[0,2]],

  //T
  [[0,0],[0,3],[-1,0],[1,0], [0,1],[0,2]],
  //long s
  [[0,0],[0,-1],[0,-2],[1,0], [1,1],[1,2]],
  [[0,0],[1,-1],[1,-2],[1,0], [0,1],[0,2]],

  //short s
  [[0,0],[0,-1],[0,-2],[-1,-2], [0,1],[1,1]],
  [[0,0],[0,-1],[0,-2],[1,-2], [0,1],[-1,1]],

  //stairs
  [[0,0],[0,-1],[-1,-1],[1,0], [1,1],[2,1]],
  [[0,0],[0,-1],[1,-1],[-1,0], [-1,1],[-2,1]],

  //inverted stairs
  [[0,0],[-1,0],[0,-1],[0,1], [1,1],[0,2]],
  [[0,0],[1,0],[0,-1],[0,1], [-1,1],[0,2]],

  //duck
  [[0,0],[-1,0],[0,-1],[0,1], [1,2],[0,2]],
  [[0,0],[1,0],[0,-1],[0,1], [-1,2],[0,2]],

  //m
  [[0,0],[0,-1],[-1,-1],[1,0], [2,0],[2,1]],
  [[0,0],[0,-1],[1,-1],[-1,0], [-2,0],[-2,1]],
]

blue    = "#000099";
red = "#990000";
green  = "#009900";
white = "#ffffff";
black = "#000000"

//boardSizeX = 13;
//boardSizeY= 19;

const boardSizeX = 13;
const boardSizeY = 19;

GAME_STATE_ROLL = 0;
GAME_STATE_SUMMON = 1;
GAME_STATE_UNIT = 2;
GAME_STATE_COMBAT = 3;
GAME_STATE_SELECT = 4;
GAME_STATE_END = 5;
GAME_STATE_NEUTRAL = 6;

ACTION_STATE_NEUTRAL = 0;
ACTION_STATE_ATTACK = 1;
ACTION_STATE_MOVE = 2;
ACTION_STATE_SPELL = 3;
ACTION_STATE_ROLL = 4;
ACTION_STATE_SUMMON = 5;
ACTION_STATE_RESPONSE = 6;
ACTION_STATE_AWAITING = 7;
ACTION_STATE_END = 8

PLAYER_1 = 0;
PLAYER_2 = 1;

const CREST_MOVEMENT = 0;
const CREST_ATTACK = 1;
const CREST_DEFENSE = 2;
const CREST_MAGIC = 3;
const CREST_TRAP = 4;
const CREST_SUMMON = 5;

const CREST_TEXT = ["MOVEMENT", "ATTACK","DEFENSE", "MAGIC", "TRAP", "SUMMON" ]

const STAT_HP =0
const STAT_ATTACK = 1
const STAT_DEFENSE = 2

const EMPTY = -1;

const squareSize = 30;
const boardXPadding = 0;
const boardYPadding = 50;


const GAME_STATE_TEXT = ['Roll', 'Summon', 'Unit', 'Combat', 'Select', 'End','Neutral']

Node = function (parent, point){
  this.x = point.x;
  this.y = point.y;
      this.parent = parent;
  this.value = point.x + point.y * boardSizeY;
  this.f = 0;
  this.g = 0;
  return this;
}

boundCursor = function(x, y){
  //console.log(x,y)
  if (x>= boardSizeX || y >= boardSizeY ||x < 0 || y < 0 ){
      return false
    }
  return true;
}

getTileState = function (x,y){
  if (boundCursor(x,y)){
    return game.board.tiles[y][x];
  } else {
    return EMPTY;
  }
}

//function setBoardState(game, state, point){
//  game.board.tiles[point[1]][point[0]] = state;
//}

getUnitById = function(id){
  if (id == EMPTY) return null
  return game.monsters[id]
}


validWalk = function(x, y){
  //console.log(x,y)
  if (!boundCursor(x,y)) return false;

  if (game.board.getUnitAtLoc(x,y) != EMPTY) return false;
  if (getTileState(x,y) == EMPTY) return false;

  return true
}

neighbours = function (x,y){
  var N = y-1;
  var S = y+1;
  var E = x+1;
  var W = x-1;
  result = [];

  if (validWalk(x,N)) result.push({x:x, y:N});

  if (validWalk(x,S)) result.push({x:x, y:S});

  if (validWalk(E,y)) result.push({x:E, y:y});

  if (validWalk(W,y)) result.push({x:W, y:y});

  return result;
};

findPossiblePath = function(pathStart, squares){
  var result = [];
  //console.log("findPossiblePath()")
  for (var i=0; i<boardSizeX;i++){
    for (var j=0; j<boardSizeY;j++){

      if (!validWalk(i,j)) continue;
      //console.log(i,j)
      var possible = findPath(pathStart,[i,j])
      //console.log(possible)
      if (possible.length > 0 && possible.length <= squares+1){
        result.push([i,j]);

        //console.log([i,j] + " " + possible.length)
      }

    }
  }
  //console.log(p1.movePath)
  //console.log(result)
  return result;
}

findPath = function(pathStart,pathEnd){
  //console.log(pathStart,pathEnd)
  var pathstart = new Node(null, {x:pathStart[0], y:pathStart[1]});
  var pathend = new Node(null, {x:pathEnd[0], y:pathEnd[1]});
  var astar = new Array(boardSizeX*boardSizeY);
  var open = [pathstart];
  var closed = [];
  var result = [];
  var neighcurr;
  var nodecurr;
  var path;
  var length, max, min, i, j;

  while (length = open.length){

    max = boardSizeX*boardSizeY;
    min = -1;
    for(var i=0;i<length;i++){
      if (open[i].f < max){
        max = open[i].f;
        min = i;
      }
    }

    nodecurr = open.splice(min,1)[0];

    if (nodecurr.value == pathend.value){
      path = closed[closed.push(nodecurr)-1];
      do {
        result.push([path.x, path.y])
      } while (path = path.parent);
      astar = closed = open = [];
      result.reverse();

    } else {
      neighcurr = neighbours(nodecurr.x, nodecurr.y);
      for (var i=0, j=neighcurr.length; i<j; i++){
        path = new Node(nodecurr, neighcurr[i]);
        if (!astar[path.value]){
          path.g = nodecurr.g + manhattanDistance(neighcurr[i], nodecurr);
          path.f = path.g + manhattanDistance(neighcurr[i], pathend);
          open.push(path);
          astar[path.value] = true;
        }
      }
      closed.push(nodecurr);
    }
  }
  return result;
}

manhattanDistance = function(point, goal){
  return Math.abs(point.x - goal.x) + Math.abs(point.y- goal.y);
}

function isOrthogonal(location1,location2){
  var boolean = location1.x == location2.x || location1.y == location2.y
  if (!boolean) console.log('Not orthogonal')
  return boolean
}

function isAlly(unit1, unit2){
  console.assert(unit1 != null && unit1 != EMPTY && unit2 != null && unit2 != EMPTY, "isAlly null parameter")
  var boolean = unit1.player.num == unit2.player.num;
  //if (!boolean ) console.log('Same ally')
  return boolean
}

function getUnitsInRange(x,y,radius){
  var units = []
  for (var i=Math.max(0,x-radius); i<Math.min(boardSizeX,x+radius+1);i++){
    for (var j=Math.max(0,y-radius); j<Math.min(boardSizeY,y+radius+1); j++){

      if (game.board.getUnitAtLoc(i,j) == EMPTY) continue
      units.push(game.board.getUnitAtLoc(i,j))
    }
  }
  return units;

}

function getAdjacentTiles(x,y){
  return [[x+1,y],[x-1,y], [x,y+1],[x,y-1]]
}

function getAdjacentUnits(unit){
  var units = []
  units.push(game.board.getUnitAtLoc(unit.x+1,unit.y))
  units.push(game.board.getUnitAtLoc(unit.x-1,unit.y))
  units.push(game.board.getUnitAtLoc(unit.x,unit.y-1))
  units.push(game.board.getUnitAtLoc(unit.x,unit.y+1))
  return units;
}

function manhattanDistance(point, goal){
	return Math.abs(point.x - goal.x) + Math.abs(point.y- goal.y);
}


function findStraightPath(pathStart, pathEnd){
	var result = []
	var dx = pathEnd[0]-pathStart[0];
	var dy = pathEnd[1]-pathStart[1];
	if (!(dx == 0 || dy == 0)) return [];
	for (var i=1; i<=Math.max(Math.abs(dx),Math.abs(dy)); i++){
		var xi = pathStart[0]
		var yi = pathStart[1]
		if (dx == 0){
			if (dy <0) yi -= i
			else 	yi += i;
		} else if (dy == 0){
			if (dx <0) xi -= i
			else 	xi+=i;
		}
		if (validWalk(xi,yi)){
			result.push([xi,yi])
		} else {
			//console.log('breaking at', xi,yi)
			break;
		}

	}
	return result
}

function drawSquare(x,y){
	ctx.fillRect(x,y,squareSize,squareSize);
	ctx.strokeRect(x,y,squareSize,squareSize);
}

function getPixel(x,y){
  return [x*squareSize, y*squareSize]
}

validPlacement = function(player,selection){
  if (!selection){
    return false;
  }

  if (selection.length <= 0){
    return false;
  }

  var valid = false;
  for (var i=0; i<6; i++){
    //boundaries
    //console.log(selection)
    x = selection[i][0];
    y = selection[i][1];
    //console.log('hello ',x,y,this.tiles[18][6],util.getTileState(this,x,y));
    if (!boundCursor(x,y) || getTileState(x,y) != EMPTY){
      return false;
    }
    //adjacent
    if (getTileState(x+1,y) == player.num ||
      getTileState(x-1,y) == player.num ||
      getTileState(x,y-1) == player.num ||
      getTileState(x,y+1) == player.num ){
      valid = true;
    }
  }

  return valid;
}

function rotateShape(shape,rotate){
	shape = shapes[shape];
	cshape = [[0,0],[0,0],[0,0],[0,0], [0,0],[0,0]]
	if (rotate == 0){
		for (var i=0; i<6; i++){
			cshape[i][0] = shape[i][0];
			cshape[i][1] = shape[i][1];
		}
	} else if (rotate == 1){
		for (var i=0; i<6; i++){
			cshape[i][0] = -shape[i][1];
			cshape[i][1] = -shape[i][0]
		}
	} else if (rotate == 2){
		for (var i=0; i<6; i++){
			cshape[i][0] = -shape[i][0];
			cshape[i][1] = -shape[i][1];
		}
	} else if (rotate == 3){
		for (var i=0; i<6; i++){
			cshape[i][0] = shape[i][1];
			cshape[i][1] = shape[i][0]
		}
	}
	return cshape;
}
