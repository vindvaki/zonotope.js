
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

//
// zonotope3
//

// We return a list of the facets of the form
//
// var facet = {
//   normal: {x, y, z},       // a nonzero vector
//   basis: [u,v]             // u, v independent vectors spanning ker(normal)
//   offset: {x, y, z},       // The sum of generators mapping to the relative origin of the facet
//   vertices: [{x, y, z}..]  // The list of vertices of the facet
//   generators: [i..];       // An array of indexes in [0..n-1] mapping to the generators of the facet
// };

//
// Complexity: O(mn), where n = generators.length and m = facetList.length (worst case O(n^3))
//
function zonotope3(generators) {

  var facetList = [];
  var facetMap = [];

  var n = generators.length;
  var i, j, k;
  var u, v, w;

  var f, fpos, fneg, fgen;
  var normal;

  for ( i = 0; i < n; ++i ) {
    facetMap[i] = [];
    for ( j = 0; j < n; ++j ) {
      facetMap[i][j] = false;
    }
  }

  //
  // intermediate facet list (normals, offsets and generators)
  //

  for ( i = 0; i < n; ++i ) {
    u = generators[i];

    // sort the generators by angle in the plane orthogonal to u
    var c = Geom3.kernelBasis(u);
    var events = [];

    for ( j = i+1; j < n; ++j ) {
      if ( ! facetMap[i][j] ) {
        facetMap[i][j] = facetMap[j][i] = true;
        fgen = [i, j];
        fpos = {};
        fneg = {};
        v = generators[j];

        fpos.normal = Geom3.crossProduct(u, v);
        if ( fpos.normal.x === 0 &&
             fpos.normal.y === 0 &&
             fpos.normal.z === 0 )
        {
          // u and v are parallel
          continue;
        }
        fneg.normal = Geom3.antipode(fpos.normal);
        fpos.basis = fneg.basis = [u,v];

        fpos.offset = {x: 0, y: 0, z: 0};
        fneg.offset = {x: 0, y: 0, z: 0};

        fpos.generators = fgen;
        fneg.generators = fgen;

        for ( k = 0; k < n; ++k ) {
          if ( k != i && k != j ) {
            w = generators[k];
            var cmp = Geom3.dot(fpos.normal, w);
            if ( cmp > 0 ) {
              fpos.offset = Geom3.add(fpos.offset, w);
            }
            if ( cmp === 0 ) {
              if ( k < i ) {
                // (i, j) is not lexicographically canonical
                break;
              }
              fgen.push(k);
              if ( ! Geom2.parallel(u, w) ) {
                facetMap[i][k] = facetMap[k][i] = true;
              }
              if ( ! Geom2.parallel(v, w) ) {
                facetMap[j][k] = facetMap[k][j] = true;
              }
            }
            if ( cmp < 0 ) {
              fneg.offset = Geom3.add(fneg.offset, w);
            }
          }
        }
        if ( k == n ) {
          // (i, j) is lexicographically canonical
          finalizeFacet3(fpos, generators);
          finalizeFacet3(fneg, generators);
          facetList.push(fpos);
          facetList.push(fneg);
          fneg.vertices.reverse();
        }
      }
    }
  }
  return facetList;
}
