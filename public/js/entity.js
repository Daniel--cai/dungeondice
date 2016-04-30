//component

class Model {
  constructor(properties) {
    this.x = 0
    this.y = 1;
    this.z = 2;
  }

  print() {
    console.log(this.x, this.y, this.z,this.hello)
  }
}

var jack = new Model()

Model.prototype.hello = 1;
jack.print()
jack.hello = 2;
jack.print()



var mary = new Model();
mary.print()
