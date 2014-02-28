Math.sign = function(x) {
  if ( x == 0 ) {
    return 0;
  }
  if ( x > 0 ) {
    return 1;
  }
  return -1;
};

//
// A module for functional 2-dimensional geometry
//
var Geom2 = {
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
// zonogon
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

  orthogonalComplement3: function(u) {
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
      // u == {x:0, y:0, z:0}
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

function unique(arr) {
  var out = [];
  var i = 0;
  var j = 0;
  while ( i < arr.length ) {
    out[j] = arr[i];
    while ( ( i < arr.length ) && ( arr[i] == out[j] ) ) {
      ++i;
    }
    ++j;
  }
  return out;
}

//
// zonotope3
//
function zonotope3(generators) {
  var facetList = [];
  var facetMap = {};
  /*
  var facet = {
    normal: {x, y, z},
    offset: {x, y, z},
    vertices: [{x, y, z}..]
    generators: [i..];
  }
   */
  var i, j;
  var u, v, w;

  var f;
  var normal;

  //
  // intermediate facet list (normals, offsets and generators)
  //
  var n = generators.length;
  for ( i = 0; i < n; ++i ) {
    u = generators[i];

    // sort the generators by angle in the plane orthogonal to u
    var c = Geom3.orthogonalComplement3(u);
    var events = [];

    for ( j = i+1; j < n; ++j ) {
      v = generators[j];
      var fneg = {};
      var fpos = {};
      var fgen = [i, j];
      fpos.normal = Geom3.crossProduct(u, v);
      fneg.normal = Geom3.antipode(fpos.normal);

      if ( facetMap[normal] == undefined ) {
        facetList.push(fpos);
        facetList.push(fneg);
        
        facetMap[fpos.normal] = fpos;
        facetMap[fneg.normal] = fneg;

        fpos.offset = {x: 0, y: 0, z: 0};
        fneg.offset = {x: 0, y: 0, z: 0};

        for ( var k = 0; k < n; ++k ) {
          if ( k != i && k != j ) {
            w = generators[k];
            var cmp = Geom3.dot(fpos.normal, w);
            if ( cmp > 0 ) {
              fpos.offset = Geom3.add(fpos.offset, w);
            }
            if ( cmp == 0 ) {
              fgen.push(k);
            }
            if ( cmp < 0 ) {
              fneg.offset = Geom3.add(fneg.offset, w);
            }
          }
        }
        fpos.generators = fgen;
        fneg.generators = fgen;
      }
    }
  }

  //
  // finialize facet list (compute the vertices)
  //
  for ( i = 0; i < facetList.length; ++i ) {
    f = facetList[i];
    f.vertices = [];

    // the first two generators of f are always linearly independent (before sorting)
    c[0] = generators[f.generators[0]];
    c[1] = generators[f.generators[1]];
    // NOTE: c[0] and c[1] might need to be orthogonal

    // project the edges into the plane with basis (c[0], c[1])
    var projectedEdges = [];
    var internalOffset = f.offset;
    for ( j = 0; j < f.generators.length; ++j ) {
      u = generators[f.generators[j]];
      v = {
        x: Geom3.dot(c[0], u),
        y: Geom3.dot(c[1], u),
        preimage: {x: u.x, y: u.y, z: u.z}
      };
      projectedEdges.push(v);

      if ( v.y < 0 || (v.y == 0 && v.x < 0 ) ) {
        internalOffset = Geom3.add(internalOffset, u);
      }

      v = {
        x: -v.x,
        y: -v.y,
        preimage: {x:-u.x, y:-u.y, z: -u.z}
      };
      projectedEdges.push(v);
    }
    projectedEdges.sort(Geom2.compareByAngle);
    
    for ( j = 0; j < projectedEdges.length; ++j ) {
      internalOffset.hash = Geom3.str(internalOffset);
      f.vertices.push(internalOffset);
      internalOffset = Geom3.add(internalOffset, projectedEdges[j].preimage);
    }
    // project the generators into 2d
  }
  
  return facetList;
}

/**
 * Construct a THREE.Geometry for a zonotope from its facet list
 */
function zonotopeGeometry3(zonotopeFacetList) {
  var i, j, f, v;
  
  var geometry = new THREE.Geometry();
  var vertexMap = {};
  var vertexList = [];
  var currentVertexIndex = 0;
  
  for ( i = 0; i < zonotopeFacetList.length; ++i ) {
    f = zonotopeFacetList[i];
    for ( j = 0; j < f.vertices.length; ++j ) {
      v = f.vertices[j];
      v.vertexListIndex = currentVertexIndex;
      geometry.vertices.push( new THREE.Vector3(v.x, v.y, v.z) );
      if ( j >= 2 ) {
        // add a new triangle
        geometry.faces.push( new THREE.Face3(f.vertices[0].vertexListIndex, // reference point
                                             f.vertices[j-1].vertexListIndex, // neighbor
                                             f.vertices[j].vertexListIndex,
                                             new THREE.Vector3(f.normal.x, f.normal.y, f.normal.z))); 
      }
      ++currentVertexIndex;
    }
  }
  
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
    pointsStrArr.push("" + p.x + "," + p.y);
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
function ZonogonSvg(svg, generators, offset) {
  this.svg = svg;
  this.generators = generators;
  this.offset = offset;
  this.zonogon = zonogon(generators);
  this.zonogonId = "zonogon";


  // Arrowhead config
  this.arrowheadIdDefault = 'arrowhead-default';
  this.arrowheadIdActive = 'arrowhead-active';
  this.arrowheadMarkerSize = 3;
  this.arrowheadLength = 3*this.arrowheadMarkerSize;

  this.arrowheadUrlDefault = 'url(#' + this.arrowheadIdDefault + ')';
  this.arrowheadUrlActive = 'url(#' + this.arrowheadIdActive + ')';

  // Arrow colors
  this.arrowColorDefault = 'steelblue';
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
        .attr("id", polygonId);
  return polygonSvg;
};

ZonogonSvg.prototype.drawArrow = function(arrowId, arrowOrigin, arrowEndpoint) {
  return this.drawPath(arrowId, [arrowOrigin, arrowEndpoint], {x:0, y:0})
    .attr("marker-end", this.arrowheadUrlDefault)
    .attr("class", "arrow")
    .attr("stroke", this.arrowColorDefault);
};

ZonogonSvg.prototype.initGeneratorArrow = function(origin, k) {
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

  arrow.tr = d3.select("#generator-tr-"+k);
  arrow.trDefaultColor = arrow.tr.style("color");

  var setActiveColor = function() {
    arrow.selection
      .attr("stroke", _this.arrowColorActive)
      .attr("marker-end", _this.arrowheadUrlActive);
    
    arrow.tr.style("color", _this.arrowColorActive);
  };

  var setDefaultColor = function() {
    if (arrow.dragging) {
      return;
    }
    arrow.selection
      .attr("stroke", _this.arrowColorDefault)
      .attr("marker-end", _this.arrowheadUrlDefault);

    arrow.tr.style("color", arrow.trDefaultColor);
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
 
    dataTable.update();
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
  if ( d == 2 ) {
    lo = lo || -100;
    hi = hi || 100;
  } else {
    lo = lo || -1;
    hi = hi || 1;
  }
    
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
  console.log(generators);
  return generators;
}


function main() {
  var d = 3;
  var n = 100;
  generators = randomGenerators(d, n);
  dataTable = new GeneratorsDataTable(generators);
  dataTable.init();

  if ( d == 2 ) {
    main_2d();
  }
  if ( d == 3 ) {
    main_3d();
  }
}

function main_2d() {
  var n = generators.length;
  var offset = {x:200, y:200};
  var svg = d3.select("svg#svg-canvas");
  var zSvg = new ZonogonSvg(svg, generators, offset);
  zSvg.draw();
  for ( k = 0; k < n; ++k ) {
    zSvg.initGeneratorArrow(offset, k);
  }
}

function main_3d () {
  var n = generators.length;

  var parentElement = document.getElementById("canvas-container");
  var svgElement = document.getElementById("svg-canvas");
  svgElement.style.display = 'none';

  var camera, scene, renderer;
  
  var sideLength = 1;

  z = zonotope3(generators);

//var  geometry;
  var material, mesh;
  
  init();
  animate();

  function init() {

    camera = new THREE.PerspectiveCamera( 75, parentElement.offsetWidth / parentElement.offsetHeight, 1, 1000 );
    camera.position.z = 1.1*n;

    scene = new THREE.Scene();

    box_geometry = new THREE.BoxGeometry(sideLength, sideLength, sideLength);
    geometry = zonotopeGeometry3(z);
//    geometry = box_geometry;
    material = new THREE.MeshNormalMaterial({side: THREE.DoubleSide});

    mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( parentElement.offsetWidth, parentElement.offsetHeight );

    parentElement.appendChild( renderer.domElement );
  }

  function animate() {

    // note: three.js includes requestAnimationFrame shim
    window.requestAnimationFrame( animate );

    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.01;

    renderer.render( scene, camera );
  }

  
}

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
    .data(this.generatrosDataFn)
    .text(this.numberFormatFn);
};
