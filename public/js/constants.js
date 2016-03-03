if(typeof exports == 'undefined'){
    var exports = this['util'] = {};
}
exports.shapes = [
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


exports.CREST_MOVEMENT = 0
exports.CREST_ATTACK = 1;
exports.CREST_DEFENSE = 2;
exports.CREST_MAGIC = 3;
exports.CREST_TRAP = 4;
exports.CREST_SUMMON = 5;

exports.blue    = "#000099";
exports.red = "#990000";
exports.green  = "#009900"; 
exports.white = "#ffffff";
exports.black = "#000000"

exports.UNIT_STATUS_STUNNED = 0;
exports.UNIT_STATUS_KNOCKED_UP = 1;
exports.UNIT_STATUS_SILENCED = 2

exports.boardSizeX = 13;
exports.boardSizeY= 19;


exports.GAME_STATE_ROLL = 0;
exports.GAME_STATE_SUMMON = 1;
exports.GAME_STATE_UNIT = 2;
exports.GAME_STATE_COMBAT = 3;
exports.GAME_STATE_SELECT = 4;
exports.GAME_STATE_END = 5;
exports.GAME_STATE_NEUTRAL = 6;

exports.EMPTY = -1;
exports.PLAYER_1 = 0;
exports.PLAYER_2 = 1;


exports.Node = function (parent, point){
  this.x = point.x;
  this.y = point.y;
      this.parent = parent;
  this.value = point.x + point.y * exports.boardSizeY;
  this.f = 0;
  this.g = 0;
  return this;
}

exports.boundCursor = function(x, y){
  //console.log(x,y)
  if (x>= exports.boardSizeX || y >= exports.boardSizeY ||x < 0 || y < 0 ){
      return false
    }
  return true;
}

exports.getTileState = function (board,x,y){
  if (exports.boundCursor(x,y)){
    return board.tiles[y][x];
  } else {
    return exports.EMPTY;
  }
}

//function setBoardState(game, state, point){
//  game.board.tiles[point[1]][point[0]] = state;
//}

exports.getUnitAtLocation = function (board,x,y){

  if (!exports.boundCursor(x,y)) return exports.EMPTY
  if (!board) {console.log('getUnitAtLocation: Empty board'); return exports.EMPTY} 
  return board.units[y][x];
}

exports.validWalk = function(board, x, y){
  if (!exports.boundCursor(x,y)) return false;
  if (exports.getUnitAtLocation(board,x,y) != exports.EMPTY) return false;
  if (exports.getTileState(board,x,y) == exports.EMPTY) return false;
  return true
}

exports.neighbours = function (board,x,y){
  var N = y-1;
  var S = y+1;
  var E = x+1;
  var W = x-1;
  result = [];

  if (exports.validWalk(board,x,N)) result.push({x:x, y:N});

  if (exports.validWalk(board,x,S)) result.push({x:x, y:S});    
 
  if (exports.validWalk(board,E,y)) result.push({x:E, y:y});

  if (exports.validWalk(board,W,y)) result.push({x:W, y:y});

  return result;
};

exports.findPossiblePath = function(board,pathStart, squares){
  var result = [];
  console.log("findPossiblePath()")
  for (var i=0; i<exports.boardSizeX;i++){
    for (var j=0; j<exports.boardSizeY;j++){
      if (!exports.validWalk(board,i,j)) continue;
      var possible = exports.findPath(board,pathStart,[i,j])
      //console.log(possible)
      if (possible.length > 0 && possible.length <= squares+1){
        result.push([i,j]);
        //console.log([i,j] + " " + possible.length)
      } 

    }
  }
  //console.log(p1.movePath)
  return result;
}

exports.findPath = function(board,pathStart,pathEnd){
  //console.log(pathStart,pathEnd)
  var pathstart = new exports.Node(null, {x:pathStart[0], y:pathStart[1]});
  var pathend = new exports.Node(null, {x:pathEnd[0], y:pathEnd[1]});
  var astar = new Array(exports.boardSizeX*exports.boardSizeY);
  var open = [pathstart];
  var closed = [];
  var result = [];
  var neighcurr;
  var nodecurr;
  var path;
  var length, max, min, i, j;

  while (length = open.length){

    max = exports.boardSizeX*exports.boardSizeY;
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
      neighcurr = exports.neighbours(board,nodecurr.x, nodecurr.y);
      for (var i=0, j=neighcurr.length; i<j; i++){
        path = new exports.Node(nodecurr, neighcurr[i]);
        if (!astar[path.value]){
          path.g = nodecurr.g + exports.manhattanDistance(neighcurr[i], nodecurr);
          path.f = path.g + exports.manhattanDistance(neighcurr[i], pathend);   
          open.push(path);
          astar[path.value] = true;
        }
      }
      closed.push(nodecurr);
    }
  }
  return result;
}

exports.manhattanDistance = function(point, goal){
  return Math.abs(point.x - goal.x) + Math.abs(point.y- goal.y);
}

exports.getCrestPool = function(player, crest){
  return player.pool[crest]
}

exports.validPlacement = function(player,selection){
  //var cshape;
  //if (!selection){
  //  cshape = rotateShape(shape,rotate)
  //} else {
  //  cshape = selection;
  //  console.log("known selection")
  //}
    //var selection = player.tileSelected;
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
      if (!boundCursor(x,y) || util.getTileState(this,x,y) != util.EMPTY){
        return false;
      }
      //adjacent
      if (util.getTileState(this,x+1,y) == player.num || 
        util.getTileState(this,x-1,y) == player.num ||
        util.getTileState(this,x,y-1) == player.num ||
        util.getTileState(this,x,y+1) == player.num ){
        valid = true;
      }
    }

    return valid;
  }

