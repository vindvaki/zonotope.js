function draw_planar_zonogon(num_generators) {
  var n = num_generators || 7;
  var d = 2;
  var generators = randomGenerators(d, n, -100, 100);
  var offset = { x: 600, y: 200 };
  var svg = d3.select("#zonogon-svg-container")
		.append("svg")
		.attr("id", "zonogon-svg");
  var zonogonSvgWrapper = new ZonogonSvg(svg, generators, offset);
  zonogonSvgWrapper.polygonFill = "green";
  zonogonSvgWrapper.draw();
  var k;
  for ( k = 0; k < n; ++k ) {
	zonogonSvgWrapper.initGeneratorArrow(offset, k);
  }
}

function draw_planar_threshold_regions(num_generators) {
  var n = num_generators || 30; // number of generators
  var d = 2;                    // output dimension (always planar)
  var opacity = 1.5 / (n+1);    // opacity of individual zonogons in [0, 1]
  var fillColor = "#eee";       // fill color of --
  var strokeColors = ["darkred", "blue", "green", "yellow", "orange", "purple", "pink"];
  var generators = randomGenerators(d, n, -40, 40);
  var svg = d3.select("#threshold-regions-svg-container")
              .append("svg")
		      .attr("id", "threshold-regions-svg");
  var thresholdSvgWrapper = [];

  var htmlElement = document.getElementById('threshold-regions-svg-container');
  
  var offset = { x: htmlElement.offsetWidth/2, y: htmlElement.offsetHeight/2 };

  console.log(svg);

  thresholdSvgWrapper[n] = new ZonogonSvg(svg, generators, offset, "threshold-"+String(n));
  thresholdSvgWrapper[n].polygonFill = "none";
  thresholdSvgWrapper[n].polygonFillOpacity = opacity;
  thresholdSvgWrapper[n].polygonStrokeColor = "black";

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
	  thresholdSvgWrapper[k] = new ZonogonSvg(svg, subGenerators, offset, "threshold-"+String(k));
	  thresholdSvgWrapper[k].polygonFill = fillColor;
	  thresholdSvgWrapper[k].polygonFillOpacity = opacity;
	  thresholdSvgWrapper[k].polygonStrokeColor = "black"; /* strokeColors[k]; */
	  thresholdSvgWrapper[k].polygonStrokeWidth = 0.8; /* strokeColors[k]; */
	  thresholdSvgWrapper[k].draw();
	}
  }

  initInternal();
  thresholdSvgWrapper[n].draw();

  function redrawInternal() {
	var j, k;
	
	for ( k = 0; k < n; ++k ) {
	  for ( j = 0; j < n; ++j ) {
		if ( j < k ) {
		  thresholdSvgWrapper[k].generators[j] = thresholdSvgWrapper[n].generators[j];
		}
		if ( j > k ) {
		  thresholdSvgWrapper[k].generators[j-1] = thresholdSvgWrapper[n].generators[j];
		}
	  }
	  thresholdSvgWrapper[k].zonogon = zonogon(thresholdSvgWrapper[k].generators);
	  thresholdSvgWrapper[k].redraw();
	}
  }
  
  for ( k = 0; k < n; ++k ) {
	thresholdSvgWrapper[n].initGeneratorArrow(offset, k, redrawInternal);
  }
}
