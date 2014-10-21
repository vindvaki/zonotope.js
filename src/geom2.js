//
// A module for functional 2-dimensional geometry
//

var Geom2 = {
  parallel: function(p, q) {
    return p.x * q.y == p.y * q.x;
  },

  str: function(p) {
    return p.x + ',' + p.y;
  },

  equals: function(p, q) {
    return p.x == q.x && p.y == q.y;
  },
  norm: function(p) {
    return Math.sqrt(p.x*p.x + p.y*p.y);
  },

  dist: function(p, q) {
    return Geom2.norm(Geom2.sub(p, q));
  },

  sub: function(p, q) {
    return {x: p.x - q.x, y: p.y - q.y};
  },

  add: function(p, q) {
    return {x: p.x + q.x, y: p.y + q.y};
  },

  scale: function(alpha, p) {
    return {x: alpha*p.x, y: alpha*p.y};
  },

  antipode: function(p) {
    return {x: -p.x, y: -p.y };
  },

  compareByAngle: function(p, q) {
    if ( p.x == q.x && p.y == q.y ) {
      return 0;
    }
    // p != q

    if ( p.y === 0 ) {
      if ( p.x >= 0 ) {
        return -1;
      }
      // p.x < 0
      if ( q.y >= 0 ) {
        return 1;
      }
      // q.y < 0
      return -1;
    }
    // p.y != 0

    if ( q.y === 0 ) {
      if ( q.x >= 0 ) {
        return 1;
      }
      if ( p.y > 0 ) {
        return -1;
      }
      // p.y < 0
      return 1;
    }
    // q.y != 0

    if ( p.y > 0 && q.y < 0 ) {
      return -1;
    }
    if ( p.y < 0 && q.y > 0 ) {
      return 1;
    }
    // both vectors point to the same side of the x-axis

    if ( (p.y * q.x) < (p.x * q.y) ) {
      return -1;
    }
    return 1;
  }
};
