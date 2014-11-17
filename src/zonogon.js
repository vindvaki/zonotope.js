


//
// zonogon (2d-zonotope) implementation
//

function zonogonVertexArray(generators) {
  var edges, vertices, offset, i, v;

  edges = [];
  offset = {x: 0, y: 0};
  for ( i = 0; i < generators.length; ++i ) {
    v = generators[i];
    if ( ( v.y < 0 ) || ( v.y === 0 && v.x < 0 ) ) {
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
