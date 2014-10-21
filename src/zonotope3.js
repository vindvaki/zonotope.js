
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


//
// An alternative implementation of the 3-zonotope construction.
//
// Complexity: \Theta(n^2\log(n))
//
function zonotope3_GeneralPosition(generators) {
  var facetList = [];

  var i, j, k;
  var u, v, w, c;
  var n = generators.length;
  var f, events, offset;

  //
  // intermediate facet list (normals, offsets and generators)
  //
  for ( i = 0; i < n; ++i ) {
    u = generators[i];
    var firstParallelGeneratorIndex = i;
    var parallelGeneratorIndexes = []; // the list of generators parallel to u

    // sort the generators by angle in the plane orthogonal to u
    c = Geom3.kernelBasis(u);
    events = [];
    offset = {x: 0, y: 0, z: 0};
    for ( j = 0; j < n; ++j ) {
      v = generators[j];
      w = {
        x: Geom3.dot(c[0], v),
        y: Geom3.dot(c[1], v),
        label: j,
        sign: 1
      };

      if ( w.x === 0 && w.y === 0 ) {
        // offset = Geom3.add(offset, v);
        parallelGeneratorIndexes.push( j );
        if ( j < firstParallelGeneratorIndex ) {
          firstParallelGeneratorIndex = j;
          break;
        }
        continue;
      }

      if ( w.y < 0 || ( w.y === 0 && w.x < 0 ) ) {
        offset = Geom3.add(offset, v);
      }

      events.push(w);
      w = {
        x: -w.x,
        y: -w.y,
        label: j,
        sign: -1
      };
      events.push(w);
    }

    if ( firstParallelGeneratorIndex < i ) {
      // a batch for a generator parallel to generators[i] has already been handled
      continue;
    }

    events.sort(Geom2.compareByAngle);

    var eventIndex = 0;
    while ( eventIndex < events.length ) {
      w = events[eventIndex];
      j = w.label;
      v = Geom3.scale(w.sign, generators[j]);

      var j_min = j; // smallest j s.t. [i, j] spans the facet
      var js = [j];  // the list of all j s.t. [i, j] spans the facet

      var offsetDeltaPositive = {x:0,y:0,z:0};
      var offsetDeltaNegative = {x:0,y:0,z:0};

      if ( w.sign == 1 ) {
        offsetDeltaPositive = Geom3.add(offsetDeltaPositive, v);
      }

      if ( w.sign == -1 ) {
        offsetDeltaNegative = Geom3.add(offsetDeltaNegative, v);
      }

      // aggregate the generators of the current hyperplane that are not parallel to u
      while ( ( eventIndex+1 < events.length ) && ( Geom2.parallel(events[eventIndex], events[eventIndex+1]) ) ) {
        w = events[++eventIndex];
        j = w.label;

        if ( j < j_min ) {
          j_min = j;
        }

        v = Geom3.scale(w.sign, generators[j]);

        if ( w.sign == 1 ) {
          offsetDeltaPositive = Geom3.add(offsetDeltaPositive, v);
        }

        if ( w.sign == -1 ) {
          offsetDeltaNegative = Geom3.add(offsetDeltaNegative, v);
        }

        js.push(j);
      }

      offset = Geom3.add(offset, offsetDeltaNegative);

      if ( i < j_min ) {
        v = generators[j_min];
        // the facet has not been seen before
        f = {
          normal: Geom3.crossProduct(u, v),
          offset: offset,
          generators: parallelGeneratorIndexes.concat(js),
          basis: [u, v]
        };
        finalizeFacet3(f, generators);
        facetList.push(f);
      }

      offset = Geom3.add(offset, offsetDeltaPositive);

      ++eventIndex;
    }
  }

  return facetList;
}

/**
 * Compute the vertices of the facet f from its intermediate state
 *
 * Complexity: O(n\log(n)) where n = f.generators.length
 */
function finalizeFacet3(f, generators) {
  f.vertices = [];

  var j, u, v;
  var c = f.basis;
  var projectedEdges = [];
  var currentVertex = f.offset;
  for ( j = 0; j < f.generators.length; ++j ) {
    u = generators[f.generators[j]];
    v = {
      x: Geom3.dot(c[0], u),
      y: Geom3.dot(c[1], u),
      preimage: u
    };
    projectedEdges.push(v);

    if ( v.y < 0 || (v.y === 0 && v.x < 0 ) ) {
      currentVertex = Geom3.add(currentVertex, u);
    }

    v = {
      x: -v.x,
      y: -v.y,
      preimage: Geom3.antipode(u)
    };
    projectedEdges.push(v);
  }
  projectedEdges.sort(Geom2.compareByAngle);

  for ( j = 0; j < projectedEdges.length; ++j ) {
    f.vertices.push(currentVertex);
    currentVertex = Geom3.add(currentVertex, projectedEdges[j].preimage);
  }

  f.normal = Geom3.scale((1.0 / Geom3.norm(f.normal)), f.normal);
  if ( Geom3.dot(f.vertices[0], f.normal) < 0 ) {
    // ensure normal points out of the interior and vertices are counterclockwise
    f.normal = Geom3.antipode(f.normal);
    f.vertices.reverse();
  }
}

/**
 * Construct a THREE.Geometry for a zonotope from its facet list
 */
function zonotopeGeometry3(zonotopeFacetList) {
  var f, v;

  var geometry = new THREE.Geometry();
  var vertexMap = {};
  var vertexList = [];
  var currentVertexIndex = 0;

  var facetIndex, facetVertexIndex;
  for ( facetIndex = 0; facetIndex < zonotopeFacetList.length; ++facetIndex ) {
    f = zonotopeFacetList[facetIndex];
    for ( facetVertexIndex = 0; facetVertexIndex < f.vertices.length; ++facetVertexIndex ) {
      v = f.vertices[facetVertexIndex];
      v.vertexListIndex = currentVertexIndex;
      geometry.vertices.push( new THREE.Vector3(v.x, v.y, v.z) );
      if ( facetVertexIndex >= 2 ) {
        // add a new triangle
        geometry.faces.push( new THREE.Face3(f.vertices[0].vertexListIndex, // reference point
                                             f.vertices[facetVertexIndex-1].vertexListIndex, // neighbor
                                             f.vertices[facetVertexIndex].vertexListIndex,
                                             new THREE.Vector3(f.normal.x, f.normal.y, f.normal.z)));
      }
      ++currentVertexIndex;
    }
  }
  geometry.mergeVertices();
  return geometry;
}

function zonotopeVertices3(facetList) {
  var vertices = [];
  facetList.forEach(function(f) {
    f.vertices.forEach(function(v) {
      vertices.push(v);
    });
  });
  vertices.sort(function(u, v) {
    if ( u.x < v.x ) {
      return -1;
    }
    if ( u.x == v.x ) {
      if ( u.y < v.y ) {
        return -1;
      }
      if ( u.y == v.y ) {
        if ( u.z < v.z ) {
          return -1;
        }
        if ( u.z == v.z ) {
          return 0;
        }
      }
    }
    return 1;
  });
  var i,j;
  var verticesOut = [];
  
  i = 0;
  j = 0;
  while ( i < vertices.length ) {
    while ( j < vertices.length && Geom3.equals(vertices[i], vertices[j]) ) {
      ++j;
    }
    verticesOut.push(vertices[i]);
    i = j;
  }
  
  return verticesOut;
}

function strFromVertexList3(vertexList) {
  return "[" + vertexList.map(Geom3.str).join(';\n') + "]";
}
