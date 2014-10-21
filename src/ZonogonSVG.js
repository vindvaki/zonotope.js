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
// ZonogonSVG wrapper
//
function ZonogonSVG(svg, generators, offset, zonogonId) {
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

ZonogonSVG.prototype.drawPath = function(pathId, pathArr, offset) {
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

ZonogonSVG.prototype.drawPolygon = function(polygonId, polygonArr, offset) {
  var polygonSvg = this.svg.append("polygon")
        .attr("points", svgPolygonData(polygonArr, offset))
        .style("stroke-width", this.polygonStrokeWidth)
        .style("stroke", this.polygonStrokeColor)
        .attr("fill", this.polygonFill)
        .attr("fill-opacity", this.polygonFillOpacity)
        .attr("id", polygonId);
  return polygonSvg;
};

ZonogonSVG.prototype.drawArrow = function(arrowId, arrowOrigin, arrowEndpoint) {
  return this.drawPath(arrowId, [arrowOrigin, arrowEndpoint], {x:0, y:0})
    .attr("marker-end", this.arrowheadUrlDefault)
    .attr("class", "arrow")
    .attr("stroke", this.arrowColorDefault);
};

ZonogonSVG.prototype.initGeneratorArrow = function(origin, k, callback) {
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

ZonogonSVG.prototype.draw = function() {
  this.drawPolygon(this.zonogonId, this.zonogon, this.offset);
  this.zonogonSelection = d3.select('#'+this.zonogonId);
};

ZonogonSVG.prototype.redraw = function() {
  this.zonogonSelection.attr("points", svgPolygonData(this.zonogon, this.offset));
};
