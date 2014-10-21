




//
// A wrapper for the table listing of generators
//

function GeneratorsDataTable(generators) {
  this.generators = generators;
  this.selection = d3.select("#generators").select("table");
  this.numberFormatFn = function(d){return (Number(d).toPrecision(4));};

  if ( generators[0].z === undefined ) {
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
