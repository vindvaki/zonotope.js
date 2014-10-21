function Zonotope3SVG(canvasId, generators, options ) {
  var self = this;
  self.canvasId = canvasId;
  self.generators = generators;

  var defaultOptions = {
    degenerate: false,
    alpha: 0.8
  };
  options = options || defaultOptions;

  self.degenerate = !!options.degenerate || defaultOptions.degenerate;
  self.alpha = options.alpha || defaultOptions.alpha;

  self.canvas = document.getElementById(canvasId);
  
  self.width = 100;
  self.height = 100;
  
  self.scene = scene = new seen.Scene({
	fractionalPoints: true,
	model: seen.Models.default(),
	viewport: seen.Viewports.center(self.width, self.height)
  });
  self.context = seen.Context(self.canvasId, self.scene).render();

  this.redraw = function() {
    var canvasComputedStyle = window.getComputedStyle(self.canvas);
    self.width = canvasComputedStyle.width;
    self.height = canvasComputedStyle.height;
    self.width = self.width.substr(0, self.width.length-2);
    self.height = self.height.substr(0, self.height.length-2);
    self.scene.viewport = seen.Viewports.center(self.width, self.height);
    self.context.render();
  };

  if ( window.onresize ) {
    window.onresize = function() {
      window.onresize();
      this.redraw();
    };
  } else {
    window.onresize = this.redraw;
  }
  
  if ( self.degenerate ) {
    self.facetList = zonotope3(generators);
  } else {
    self.facetList = zonotope3_GeneralPosition(generators);
  }
  
  self.shape = new seen.Shape('zonotope', self.facetList.map(function(f) {
    var points = f.vertices.map(function(v) {
      return new seen.Point(v.x, v.y, v.z);
    });
    var surface = new seen.Surface(points);
    Geom3.scale(1/Geom3.norm(f.normal), f);
    surface.normal = f.normal;
    return surface;
  }));

  self.shape.surfaces.forEach(function(surface) {
	var minBrightness = 0.5;
	var alpha = 0.8;
	var brightnessFn = function(c) {
	  return (1 - minBrightness) * c + minBrightness;
	};
	surface.fill = new seen.Material(seen.Colors.rgb(
	  255 * brightnessFn(surface.normal.x),
	  255 * brightnessFn(surface.normal.y),
	  255 * brightnessFn(surface.normal.z),
	  255 * alpha
	));
	surface.fill.metallic = false;
	surface.fill.specularExponent = 8;
  });

  self.scene.model.add(self.shape);
  
  this.redraw();
}
