function drawPlanarZonogon(numGenerators) {
  var n = numGenerators || 7;
  var d = 2;
  var generators = randomGenerators(d, n, -100, 100);
  var offset = { x: 600, y: 200 };
  var svg = d3.select("#zonogon-svg-container")
        .append("svg")
        .attr("id", "zonogon-svg");
  var zonogonSvgWrapper = new ZonogonSVG(svg, generators, offset);
  zonogonSvgWrapper.polygonFill = "green";
  zonogonSvgWrapper.draw();
  var k;
  for ( k = 0; k < n; ++k ) {
    zonogonSvgWrapper.initGeneratorArrow(offset, k);
  }
}

function drawPlanarThresholdRegions(numGenerators) {
  var n = numGenerators || 30; // number of generators
  var d = 2;                    // output dimension (always planar)
  var opacity = 1.5 / (n+1);    // opacity of individual zonogons in [0, 1]
  var fillColor = "#eee";       // fill color of --
  var strokeColors = ["darkred", "blue", "green", "yellow", "orange", "purple", "pink"];
  var generators = randomGenerators(d, n, -40, 40);
  var svg = d3.select("#threshold-regions-svg-container")
        .append("svg")
        .attr("id", "threshold-regions-svg");
  var thresholdSVGWrapper = [];

  var htmlElement = document.getElementById('threshold-regions-svg-container');
  
  var offset = { x: htmlElement.offsetWidth/2, y: htmlElement.offsetHeight/2 };

  
  generators_arr = function () {
    var k;
    arr = [];
    for ( k = 0; k < n; ++k ) {
      arr[2*k]   = thresholdSVGWrapper[n].generators[k].x;
      arr[2*k+1] = thresholdSVGWrapper[n].generators[k].y;
    }
    return arr;
  };


  thresholdSVGWrapper[n] = new ZonogonSVG(svg, generators, offset, "threshold-"+String(n));
  thresholdSVGWrapper[n].polygonFill = "none";
  thresholdSVGWrapper[n].polygonFillOpacity = opacity;
  thresholdSVGWrapper[n].polygonStrokeColor = "black";

  function initInternal() {
    var j, k;
    var subGenerators;
    for ( k = 0; k < n; ++k ) {
      subGenerators = [];
      for ( j = 0; j < n; ++j ) {
        if ( j < k ) {
          subGenerators[j] = generators[j];
        }
        if ( j > k ) {
          subGenerators[j-1] = generators[j];
        }
      }
      thresholdSVGWrapper[k] = new ZonogonSVG(svg, subGenerators, offset, "threshold-"+String(k));
      thresholdSVGWrapper[k].polygonFill = fillColor;
      thresholdSVGWrapper[k].polygonFillOpacity = opacity;
      thresholdSVGWrapper[k].polygonStrokeColor = "black"; /* strokeColors[k]; */
      thresholdSVGWrapper[k].polygonStrokeWidth = 0.8; /* strokeColors[k]; */
      thresholdSVGWrapper[k].draw();
    }
  }

  initInternal();
  thresholdSVGWrapper[n].draw();

  function redrawInternal() {
    var j, k;
    
    for ( k = 0; k < n; ++k ) {
      for ( j = 0; j < n; ++j ) {
        if ( j < k ) {
          thresholdSVGWrapper[k].generators[j] = thresholdSVGWrapper[n].generators[j];
        }
        if ( j > k ) {
          thresholdSVGWrapper[k].generators[j-1] = thresholdSVGWrapper[n].generators[j];
        }
      }
      thresholdSVGWrapper[k].zonogon = zonogon(thresholdSVGWrapper[k].generators);
      thresholdSVGWrapper[k].redraw();
    }
  }
  
  for ( k = 0; k < n; ++k ) {
    thresholdSVGWrapper[n].initGeneratorArrow(offset, k, redrawInternal);
  }
}
