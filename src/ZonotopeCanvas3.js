//
// 3D zonotope canvas wrapper
//

function ZonotopeCanvas3(generators, drawFacetOutlines, degenerate, canvasId, opacity, resolution, interactive) {
  this.canvasId = canvasId || "canvas-container";
  this.drawFacetOutlines = drawFacetOutlines || false;
  this.parentElement = document.getElementById(this.canvasId);
  this.renderWidth = 1920 || resolution.width;
  this.renderHeight = 1200 || resolution.height;
  this.interactive = false || interactive;

  this.generators = generators;
  this.degenerate = degenerate || false;
  this.opacity = opacity || 0.75 ;
  this.transparent = ( this.opacity <= 0.99 );

  this.linewidth = 1;

  if ( degenerate ) {
    this.zonotope = zonotope3(this.generators);
  } else {
    this.zonotope = zonotope3_GeneralPosition(this.generators);
  }

  this.sideLength = 1;
}

ZonotopeCanvas3.prototype.canvasWidth = function() {
    return  this.parentElement.offsetWidth;
};

ZonotopeCanvas3.prototype.canvasHeight = function() {
    return this.parentElement.offsetHeight;
};

ZonotopeCanvas3.prototype.aspect = function() {
  return this.canvasWidth() / this.canvasHeight();
};

ZonotopeCanvas3.prototype.init = function() {
  var f, v, i, j, k;

  var boundingBox = {
    x: {min: 0, max: 0},
    y: {min: 0, max: 0},
    z: {min: 0, max: 0}
  };

  for ( i = 0; i < this.zonotope.length; ++i ) {
    f = this.zonotope[i];
    for ( j = 0; j < f.vertices.length; ++j ) {
      v = f.vertices[j];
      boundingBox.x.min = Math.min(boundingBox.x.min, v.x);
      boundingBox.x.max = Math.max(boundingBox.x.max, v.x);
      boundingBox.y.min = Math.min(boundingBox.y.min, v.y);
      boundingBox.y.max = Math.max(boundingBox.y.max, v.y);
      boundingBox.z.min = Math.min(boundingBox.z.min, v.z);
      boundingBox.z.max = Math.max(boundingBox.z.max, v.z);
    }
  }
  var boundingBoxAbs = [
    boundingBox.x.min,
    boundingBox.x.max,
    boundingBox.y.min,
    boundingBox.y.max,
    boundingBox.z.min,
    boundingBox.z.max
  ].map(Math.abs);

  var boundingBoxAbsMax = boundingBoxAbs.reduce(function(x,y) { return (x>=y)?x:y; });
  var cameraCoordinate = boundingBoxAbsMax;

  this.camera = new THREE.PerspectiveCamera( 75, this.aspect(), 1, 1000 );
  
  this.camera.position.set(cameraCoordinate, -cameraCoordinate, cameraCoordinate);
  this.camera.up = new THREE.Vector3(0,0,1);
  this.camera.lookAt(new THREE.Vector3(0,0,0));
  this.scene = new THREE.Scene();

  if ( this.drawFacetOutlines ) {
    
    this.lineMaterial = new THREE.LineBasicMaterial({
      color:0x000000,
      linewidth: this.linewidth
    });
    this.lineObject3D = new THREE.Object3D();

    for ( i = 0; i < this.zonotope.length; ++i ) {
      f = this.zonotope[i];
      f.lineGeometry = new THREE.Geometry();
      for ( j = 0; j <= f.vertices.length; ++j ) {
        v = f.vertices[j % (f.vertices.length)];
        f.lineGeometry.vertices.push(new THREE.Vector3(v.x, v.y, v.z));
      }
      f.lineMesh = new THREE.Line(f.lineGeometry, this.lineMaterial);
      this.lineObject3D.add(f.lineMesh);
    }
    this.scene.add(this.lineObject3D);
  }

  this.geometry = zonotopeGeometry3(this.zonotope);

  this.meshFrontNormalMaterial = new THREE.MeshNormalMaterial({
    side: THREE.FrontSide,
    transparent: this.transparent,
    opacity: this.opacity
  });

  this.meshBackNormalMaterial = new THREE.MeshNormalMaterial({
    side: THREE.BackSide,
    transparent: this.transparent,
    opacity: this.opacity
  });

  this.frontMesh = new THREE.Mesh(this.geometry, this.meshFrontNormalMaterial);
  this.backMesh = new THREE.Mesh(this.geometry, this.meshBackNormalMaterial);

  this.scene.add(this.frontMesh);
  this.scene.add(this.backMesh);


  this.renderer = new THREE.WebGLRenderer({antialias: true });
//  this.renderer = new THREE.CanvasRenderer({antialias: true, alpha: true});
  this.renderer.setSize(this.canvasWidth(), this.canvasHeight());
  this.renderer.setClearColor( 0xffffff, 0 ); // white background

  this.parentElement.appendChild( this.renderer.domElement );

  window.addEventListener('resize', this.onWindowResize.bind(this), false);

  if ( this.interactive ) {
    this.controls = new THREE.TrackballControls( this.camera, this.parentElement );
    this.controls.rotateSpeed = 1.0;
    this.controls.zoomSpeed = 1.0;
    this.controls.panSpeed = 0.8;

    this.controls.noZoom = false;
    this.controls.noPan = false;

    this.controls.staticMoving = true;
    this.controls.dynamicDampingFactor = 0.3;
  }


};


ZonotopeCanvas3.prototype.animate = function() {
  window.requestAnimationFrame( this.animate.bind(this) );
  if ( this.interactive ) {
    this.controls.update();
  }
  this.renderer.render(this.scene, this.camera);
};

ZonotopeCanvas3.prototype.onWindowResize = function() {
  this.camera.aspect = this.aspect();
  this.camera.updateProjectionMatrix();
  this.renderer.setSize(this.canvasWidth(), this.canvasHeight());
};

