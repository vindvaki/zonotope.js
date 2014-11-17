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
// 3D rendering utils
//


/**
 * Based on tutorial: http://soledadpenades.com/articles/three-js-tutorials/drawing-the-coordinate-axes/
 */
function buildSingleAxis( src, dst, colorHex, dashed, dashSize, gapSize ) {
  var geom = new THREE.Geometry();
  var mat;

  dashSize = dashSize || 1;
  gapSize  = gapSize  || dashSize;

  if(dashed) {
	mat = new THREE.LineDashedMaterial({ linewidth: 3, color: colorHex, dashSize: dashSize, gapSize: gapSize });
  } else {
	mat = new THREE.LineBasicMaterial({ linewidth: 3, color: colorHex });
  }

  geom.vertices.push( src.clone() );
  geom.vertices.push( dst.clone() );
  geom.computeLineDistances(); // This one is SUPER important, otherwise dashed lines will appear as simple plain lines

  var axis = new THREE.Line( geom, mat, THREE.LinePieces );

  return axis;

}
/**
 * Based on tutorial: http://soledadpenades.com/articles/three-js-tutorials/drawing-the-coordinate-axes/
 * X axis: Red
 * Y axis: Blue
 * Z axis: Green

 */
function buildAxesXYZ( axisLength, colorX, colorY, colorZ ) {

  var axes = new THREE.Object3D();
  colorX = colorX || 0xFF0000; // red
  colorY = colorY || 0x00FF00; // green
  colorZ = colorZ || 0x0000FF; // blue


  axes.add( buildSingleAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( axisLength, 0,  0 ), colorX, false ) ); // +X
  axes.add( buildSingleAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( -axisLength, 0, 0 ), colorX, true  ) ); // -X

  axes.add( buildSingleAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, axisLength,  0 ), colorY, false ) ); // +Y
  axes.add( buildSingleAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, -axisLength, 0 ), colorY, true  ) ); // -Y

  axes.add( buildSingleAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, axisLength  ), colorZ, false ) ); // +Z
  axes.add( buildSingleAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, -axisLength ), colorZ, true  ) ); // -Z

  return axes;
}

function renderGeneratorArrows3D(scene) {
  var origin = new THREE.Vector3(0,0,0);
  var n = generators.length;

  for ( var k = 0; k < n; ++k ) {
	var v = generators[k];
	var len = Geom3.norm(v);
	v = Geom3.scale(1/len, v);
	var dir = new THREE.Vector3(v.x, v.y, v.z);
	var hex = 0x0;
	var arrowHelper = new THREE.ArrowHelper(dir, origin, len, hex);

	scene.add(arrowHelper);
  }
}

function getSvgSaveUrl(svg) {
  var serializer = new XMLSerializer();
  var source = serializer.serializeToString(svg);
  if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
    source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }
  source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
  var url = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);
  return url;
}

function makeSeenAxisArrow(axisLen, x, y, z) {
  var arrow = seen.Shapes.arrow(0.5, axisLen, 0.5, 0.5, 0);

  arrow.rotz(Math.PI);
  arrow.translate(axisLen);
  if ( x == 0 ) {
    arrow.rotz(Math.PI/2);
  }
  if ( z == 1 ) {
    arrow.rotx(Math.PI/2);
  }

  arrow.surfaces.forEach(function(surface) {
    surface.fill = new seen.Material(seen.Colors.rgb(x*255, y*255, z*255));
  });
  return arrow;
}
