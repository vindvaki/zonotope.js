
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
    
    if ( p.y == 0 ) {
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

    if ( q.y == 0 ) {
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


//
// zonogon (2d-zonotope) implementation
//

function zonogon(generators) {
  var edges, vertices, offset, i, v;
  
  edges = [];
  offset = {x: 0, y: 0};
  for ( i = 0; i < generators.length; ++i ) {
    v = generators[i];
    if ( ( v.y < 0 ) || ( v.y == 0 && v.x < 0 ) ) {
      offset = Geom2.add(offset, v);
    }
    edges.push(v);
    edges.push(Geom2.antipode(v));
  }
  edges.sort(Geom2.compareByAngle);

  vertices = [];
  for ( i = 0; i < edges.length; ++i ) {
    vertices.push(offset);
    offset = Geom2.add(offset, edges[i]);
  }
  vertices.push(vertices[0]);

  return vertices;
}



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
        if ( fpos.normal.x == 0
             && fpos.normal.y == 0
             && fpos.normal.z == 0 )
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
            if ( cmp == 0 ) {
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

      if ( w.x == 0 && w.y == 0 ) {
        // offset = Geom3.add(offset, v);
        parallelGeneratorIndexes.push( j );
        if ( j < firstParallelGeneratorIndex ) {
          firstParallelGeneratorIndex = j;
          break;
        }
        continue;
      }
      
      if ( w.y < 0 || ( w.y == 0 && w.x < 0 ) ) {
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

    if ( v.y < 0 || (v.y == 0 && v.x < 0 ) ) {
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
  
  if ( Geom3.dot(f.vertices[1], f.normal) < 0 ) {
    f.normal = Geom3.antipode(f.normal);
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


//
// SVG utilities
//

function svgPolygonData(polygonArr, offset) {
  var pointsStrArr = [];
  var k, p;
  for ( k = 0; k < polygonArr.length; ++k ) {
    p = Geom2.add(polygonArr[k], offset);
    pointsStrArr.push(Geom2.str(p));
  }
  var pointsStr = pointsStrArr.join(" ");
  return pointsStr;
}


function d3DefineArrowhead(svg, id, marker) {
  var stroke = 1;
  var box = 2 * stroke;
  return svg.append("defs")
    .append("marker")
      .attr("id", id)
      .attr("viewBox", "0 0 " + box + " " + box)
      .attr("refX", 0)
      .attr("refY", stroke)
      .attr("markerUnits", "strokeWidth")
      .attr("markerWidth", marker)
      .attr("markerHeight", marker)
      .attr("orient", "auto")
      .append("path")
        .attr("d", "M 0 0 L " + box + " " + stroke + " L 0 " + box + " z");
}


//
// ZonogonSvg wrapper
//
function ZonogonSvg(svg, generators, offset, zonogonId) {
  this.svg = svg;
  this.generators = generators;
  this.offset = offset;
  this.zonogon = zonogon(generators);
  this.zonogonId = zonogonId || "zonogon";


  // Arrowhead config
  this.arrowheadIdDefault = zonogonId + 'arrowhead-default';
  this.arrowheadIdActive = zonogonId + 'arrowhead-active';
  this.arrowheadMarkerSize = 3;
  this.arrowheadLength = 3*this.arrowheadMarkerSize;

  this.arrowheadUrlDefault = 'url(#' + this.arrowheadIdDefault + ')';
  this.arrowheadUrlActive = 'url(#' + this.arrowheadIdActive + ')';

  // Arrow colors
  this.arrowColorDefault = 'black';
  this.arrowColorActive = 'red';

  // Set up svg defs
  d3DefineArrowhead(this.svg, this.arrowheadIdDefault, this.arrowheadMarkerSize)
    .attr("fill", this.arrowColorDefault);
  d3DefineArrowhead(this.svg, this.arrowheadIdActive, this.arrowheadMarkerSize)
    .attr("fill", this.arrowColorActive);

  // Poloygon config
  this.polygonStrokeColor = "black";
  this.polygonStrokeWidth = 2;
  this.polygonFill = "none";
  this.polygonFillOpacity = 1;
}

ZonogonSvg.prototype.drawPath = function(pathId, pathArr, offset) {
  var line = d3.svg.line()
        .x(function(d){return d.x + offset.x;})
        .y(function(d){return d.y + offset.y;})
        .interpolate("linear");

  var pathSvg = this.svg.append("path")
    .attr("d", line(pathArr))
    .style("stroke-width", 3)
    .attr("stroke", "black")
    .attr("fill", "none")
    .attr("id", pathId);

  return pathSvg;
};

ZonogonSvg.prototype.drawPolygon = function(polygonId, polygonArr, offset) {
  var polygonSvg = this.svg.append("polygon")
        .attr("points", svgPolygonData(polygonArr, offset))
        .style("stroke-width", this.polygonStrokeWidth)
        .style("stroke", this.polygonStrokeColor)
        .attr("fill", this.polygonFill)
        .attr("fill-opacity", this.polygonFillOpacity)
        .attr("id", polygonId);
  return polygonSvg;
};

ZonogonSvg.prototype.drawArrow = function(arrowId, arrowOrigin, arrowEndpoint) {
  return this.drawPath(arrowId, [arrowOrigin, arrowEndpoint], {x:0, y:0})
    .attr("marker-end", this.arrowheadUrlDefault)
    .attr("class", "arrow")
    .attr("stroke", this.arrowColorDefault);
};

ZonogonSvg.prototype.initGeneratorArrow = function(origin, k, callback) {
  callback = callback || (function() {});
  
  var _this = this;
  var generators = _this.generators;

  var updateEndpoint = function() {
    var lenArrow = _this.arrowheadLength;
    var lenDesired = Geom2.norm(generators[k]);
    var lenTotal = lenArrow + lenDesired;
    var vScaled = Geom2.scale(lenDesired/lenTotal, generators[k]);
    return Geom2.add(origin, vScaled);
  };

  var arrow = {};
  arrow.id = "generator-" + k;
  arrow.origin = origin;
  arrow.endpoint = updateEndpoint();
  arrow.selection = this.drawArrow(arrow.id, origin, arrow.endpoint);
  arrow.clickPadding = 10;

  arrow.clickTargetId = arrow.id + "-target";
  arrow.clickTargetEndpoint = function() {
    var a = Geom2.dist(arrow.endpoint, arrow.origin);
    var scale = (a + arrow.clickPadding) / a;
    return {
      x: (arrow.endpoint.x-origin.x) * scale + origin.x,
      y: (arrow.endpoint.y-origin.y) * scale + origin.y
    };
  };
  
  arrow.clickTargetSelection = 
        this.drawPath( arrow.clickTargetId, [origin, arrow.clickTargetEndpoint()], {x:0,y:0} )
        .style("opacity", 0)
        .style("stroke-width", 10);

//  arrow.tr = d3.select("#generator-tr-"+k);
//  arrow.trDefaultColor = arrow.tr.style("color");

  var setActiveColor = function() {
    arrow.selection
      .attr("stroke", _this.arrowColorActive)
      .attr("marker-end", _this.arrowheadUrlActive);
    
//    arrow.tr.style("color", _this.arrowColorActive);
  };

  var setDefaultColor = function() {
    if (arrow.dragging) {
      return;
    }
    arrow.selection
      .attr("stroke", _this.arrowColorDefault)
      .attr("marker-end", _this.arrowheadUrlDefault);

//    arrow.tr.style("color", arrow.trDefaultColor);
  };
  

  //
  // Drag behavior
  //
  arrow.clickTargetSelection.on("mouseover", setActiveColor);
  arrow.clickTargetSelection.on("mouseout", setDefaultColor);

  arrow.dragging = false;
  arrow.dragBehavior = d3.behavior.drag();

  arrow.dragBehavior.on('drag', function() {
    generators[k].x += d3.event.dx;
    generators[k].y += d3.event.dy;

    var line = d3.svg.line()
          .x(function(d) { return d.x; } )
          .y(function(d) { return d.y; } )
          .interpolate("linear");

    arrow.endpoint = updateEndpoint();

    arrow.selection
      .attr("d", line([origin, arrow.endpoint]));

    arrow.clickTargetSelection
      .attr("d", line([origin, arrow.clickTargetEndpoint()]));

    _this.zonogon = zonogon(generators);
    _this.redraw();
    
    callback();
 
//    dataTable.update();
  });

  arrow.dragBehavior.on('dragstart', function() {
    arrow.dragging = true;
    setActiveColor();
  });

  arrow.dragBehavior.on('dragend', function() {
    arrow.dragging = false;
    setDefaultColor();
  });
  
  arrow.clickTargetSelection.call(arrow.dragBehavior);
  
  return arrow;
};

ZonogonSvg.prototype.draw = function() {
  this.drawPolygon(this.zonogonId, this.zonogon, this.offset);
  this.zonogonSelection = d3.select('#'+this.zonogonId);
};

ZonogonSvg.prototype.redraw = function() {
  this.zonogonSelection.attr("points", svgPolygonData(this.zonogon, this.offset));
};

function randomGenerators(d, n, lo, hi) {

  lo = lo || -1;
  hi = hi || 1;
    
  var randomNumber = function() {
    return lo + Math.random()*(hi - lo) ;
  };
  var randomVector = function() {
    var v = {
      x: randomNumber(),
      y: randomNumber()
    };
    if ( d == 3 ) {
      v.z = randomNumber();
    }
    return v;
  };
  
  var generators = [];  
  for ( var k = 0; k < n; ++k ) {
    generators[k] = randomVector();
    generators[k].k = k;
  }
  return generators;
}


//
// 3D zonotope canvas wrapper
//

function ZonotopeCanvas3(generators, drawFacetOutlines, degenerate, canvasId) {
  this.canvasId = canvasId || "canvas-container";
  this.drawFacetOutlines = drawFacetOutlines || false;
  this.parentElement = document.getElementById(this.canvasId);
  
  this.generators = generators;
  this.degenerate = degenerate || false;

  this.linewidth = 1;
  
  if ( degenerate ) {
    this.zonotope = zonotope3(this.generators);
  } else {
    this.zonotope = zonotope3_GeneralPosition(this.generators);
  }
  
  this.sideLength = 1;
}

ZonotopeCanvas3.prototype.width = function() {
    return this.parentElement.offsetWidth;
};

ZonotopeCanvas3.prototype.height = function() {
    return this.parentElement.offsetHeight;
};

ZonotopeCanvas3.prototype.aspect = function() {
  return this.width() / this.height();
};

ZonotopeCanvas3.prototype.init = function() {
  var maxElementAbs = this.generators[0].x;
  var i, j, k;
  
  for ( k = 0; k < this.generators.length; ++k ) {
    maxElementAbs = Math.max(maxElementAbs, Math.abs(this.generators[k].x));
    maxElementAbs = Math.max(maxElementAbs, Math.abs(this.generators[k].y));
    maxElementAbs = Math.max(maxElementAbs, Math.abs(this.generators[k].z));
  }
    
  this.camera = new THREE.PerspectiveCamera( 75, this.aspect(), 1, 1000 );
  this.camera.position.z = this.generators.length * maxElementAbs;
  this.scene = new THREE.Scene();


  if ( this.drawFacetOutlines ) {
    // var edgeVisited = [];
    // for ( i = 0; i < this.zonotope.length; ++i ) {
    //   edgeVisited[i] = [];
    //   for ( j = 0; i < this.zonotope.length; ++j ) {
    //     edgeVisited[i][j] = false;
    //   }
    // }
    
    this.lineMaterial = new THREE.LineBasicMaterial({
      color:0x000000,
      linewidth: this.linewidth
    });
    this.lineObject3D = new THREE.Object3D;
    
    for ( i = 0; i < this.zonotope.length; ++i ) {
      var f = this.zonotope[i];
      f.lineGeometry = new THREE.Geometry();
      for ( j = 0; j <= f.vertices.length; ++j ) {
        var v = f.vertices[j % (f.vertices.length)];
        f.lineGeometry.vertices.push(new THREE.Vector3(v.x, v.y, v.z));
      }
      f.lineMesh = new THREE.Line(f.lineGeometry, this.lineMaterial);
      this.lineObject3D.add(f.lineMesh);
    }
  }
  
  this.geometry = zonotopeGeometry3(this.zonotope);
  this.meshNormalMaterial = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide, transparent: false, opacity: 0.7 });
  this.mesh = new THREE.Mesh(this.geometry, this.meshNormalMaterial);
  this.scene.add( this.mesh );
  this.scene.add(this.lineObject3D);

  this.renderer = new THREE.WebGLRenderer({antialias: true});
  this.renderer.setSize(this.width(), this.height());
  this.renderer.setClearColor( 0xffffff, 1 ); // white background

  this.parentElement.appendChild( this.renderer.domElement );

  window.addEventListener('resize', this.onWindowResize.bind(this), false);
};

ZonotopeCanvas3.prototype.animate = function() {
  window.requestAnimationFrame( this.animate.bind(this) );
  var xRotation = 0.01;
  var yRotation = 0.01;
  
  this.mesh.rotation.x += xRotation;
  this.mesh.rotation.y += yRotation;
  if ( this.drawFacetOutlines ) {
    this.lineObject3D.rotation.x += xRotation;
    this.lineObject3D.rotation.y += yRotation;
  }
  
  this.renderer.render( this.scene, this.camera );
};

ZonotopeCanvas3.prototype.onWindowResize = function() {
  this.camera.aspect = this.aspect();
  this.camera.updateProjectionMatrix();
  this.renderer.setSize(this.width(), this.height());
};



//
// A wrapper for the table listing of generators
//

function GeneratorsDataTable(generators) {
  this.generators = generators;
  this.selection = d3.select("#generators").select("table");
  this.numberFormatFn = function(d){return (new Number(d).toPrecision(4));};

  if ( generators[0].z == undefined ) {
    this.tableHeaderData = ["x", "y", "length"];
    this.generatorsDataFn = function(d) { return [d.x, d.y, Geom2.norm(d)]; };
  } else {
    this.tableHeaderData = ["x", "y", "z", "length"];
    this.generatorsDataFn = function(d) { return [d.x, d.y, d.z, Geom3.norm(d)]; };
  }

}

GeneratorsDataTable.prototype.init = function() {
  this.selection
    .append("tr")
    .attr("class", "header")
    .selectAll("th")
    .data(this.tableHeaderData)
    .enter()
    .append("th")
    .text(function(d) {return d;});
    
  this.selection
    .selectAll("tr.data")
    .data(this.generators)
    .enter()
    .append("tr")
    .attr("class", "data")
    .attr("id", function(d) {return "generator-tr-"+d.k;})
    .selectAll("td")
    .data(this.generatorsDataFn)
    .enter()
    .append("td")
    .text(this.numberFormatFn);
};

GeneratorsDataTable.prototype.update = function() {
  this.selection
    .selectAll("tr.data")
    .data(this.generators)
    .selectAll("td")
    .data(this.generatorsDataFn)
    .text(this.numberFormatFn);
};
