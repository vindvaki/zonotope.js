
//
// 3 dimensional geometry
//

var Geom3 = {
  equals: function(p, q) {
    return p.x == q.x && p.y == q.y && p.z == q.z;
  },
  norm: function(p) {
    return Math.sqrt(p.x*p.x + p.y*p.y + p.z*p.z);
  },

  add: function(p, q) {
    return {
      x: p.x + q.x,
      y: p.y + q.y,
      z: p.z + q.z
    };
  },

  sub: function(p, q) {
    return {
      x: p.x - q.x,
      y: p.y - q.y,
      z: p.z - q.z
    };
  },

  scale: function(alpha, p) {
    return {
      x: alpha * p.x,
      y: alpha * p.y,
      z: alpha * p.z
    };
  },

  antipode: function(p) {
    return this.scale(-1, p);
  },

  crossProduct: function(p, q) {
    return {
      x: p.y * q.z - p.z * q.y,
      y: p.z * q.x - p.x * q.z,
      z: p.x * q.y - p.y * q.x
    };
  },

  dot: function(p ,q) {
    return p.x*q.x + p.y*q.y + p.z*q.z;
  },

  kernelBasis: function(u) {
    var b = [];
    b[0] = {x: 1, y: 0, z: 0};
    b[1] = {x: 0, y: 1, z: 0};
    b[2] = {x: 0, y: 0, z: 1};

    //
    // pivot
    //
    var i;
    var j = -1;
    var x = [];
    for ( i = 0; i < 3; ++i ) {
      x[i] = Geom3.dot(b[i], u);
      if ( x[i] !== 0 ) {
        j = i;
      }
    }
    if ( j == -1 ) {
      // u is orthogonal to all unit vectors, so u == {x:0, y:0, z:0}
      return b;
    }
    var tmp;

    tmp = x[2];
    x[2] = x[j];
    x[j] = tmp;

    tmp = b[2];
    b[2] = b[j];
    b[j] = tmp;
    // x[2] != 0

    //
    // update the basis
    //
    for ( i = 0; i < 2; ++i ) {
      b[i] = Geom3.sub(Geom3.scale(x[2], b[i]), Geom3.scale(x[i], b[2]));
      // dot( b[i], u ) == 0
    }
    b.pop();
    return b;
  },

  str: function(p) {
    return [p.x, p.y, p.z].join(',');
  }
};
