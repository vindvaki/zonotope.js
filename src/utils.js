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
