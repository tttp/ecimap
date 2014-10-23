var active= null,
    width = 960,
    height = 700;

  //equirectangular fits better on a screen (more width than height) than mercator()
  var projection = d3.geo.equirectangular()
    .center([13,52]) //theorically, 50°7′2.23″N 9°14′51.97″E
    .scale(width*1.11)
    .translate([width / 2, height / 2]);
//    .translate([width / 2 - 320, height / 2 + 700]);


var svg = d3.select("body").append("svg")
    .attr("class", "map")
    .attr("width", width)
    .attr("height", height);

svg.append("rect")
    .attr("class", "ocean")
    .attr("width", width)
    .attr("height", height)
    .on("click", reset);

var g = svg.append("g");


  //Countries paths
var path = d3.geo.path().projection(projection);

var feature=null;

var div = d3.select("body").append("div")   
    .attr("class", "tooltip")               
    .style("opacity", 0);

// color based on how many signatures as a % of the quota. Anything above 150% is the same color
var color = d3.scale.linear()
        .clamp(true)
        .domain([0, 0.9,1,1.5])
        .range(["red","#e8eab8","lightgreen","#3a6033"])
        .interpolate(d3.interpolateHcl);

//Let's load the data that will be user for the choropleth
var dataset,europe,places;

queue()
  .defer (function (callback) {
    d3.json("signatures.json", function(error, json) {
      if (error) {console.warn(error);callback();}
dataset = {
"paper":{
"at":0,
"be":0,
"bg":0,
"cy":0,
"cz":0,
"de":0,
"dk":0,
"ee":0,
"el":0,
"es":0,
"fi":0,
"fr":0,
"hu":0,
"ie":0,
"it":0,
"lt":0,
"lu":0,
"lv":0,
"mt":0,
"nl":0,
"pl":0,
"pt":0,
"ro":0,
"se":0,
"si":0,
"sk":0,
"uk":0,
"hr":0},

    "quota": {
        "at": 14250,
        "be": 16500,
        "bg": 13500,
        "cy": 4500,
        "cz": 16500,
        "de": 74250,
        "dk": 9750,
        "ee": 4500,
        "el": 16500,
        "es": 40500,
        "fi": 9750,
        "fr": 55500,
        "hu": 16500,
        "ie": 9000,
        "it": 54750,
        "lt": 9000,
        "lu": 4500,
        "lv": 6750,
        "mt": 4500,
        "nl": 19500,
        "pl": 38250,
        "pt": 16500,
        "ro": 24750,
        "se": 15000,
        "si": 6000,
        "sk": 9750,
        "uk": 54750,
        "hr": 9000
}};
      dataset.online = {};
      d3.map(json.signings_via_policat).forEach(function(k,v){
        if (k == "GB") {dataset.online["uk"]=v;return};
        if (k == "GR") {dataset.online["el"]=v;return};
        dataset.online[k.toLowerCase()] = v;
      });
      d3.map(json.signings_via_api).forEach(function(k,v){
        if (k == "") return; // cleaning mess on policat data
        if (k == "GB") {dataset.online["uk"] +=v;return};
        if (k == "GR") {dataset.online["el"] +=v;return};
        dataset.online[k.toLowerCase()] += v;
      });
      callback();
    });
  })
  .defer (function(callback) {
    d3.json("europe50b.json", function(error, json) {
      europe=json;
      callback();
    });
  })
  .defer (function(callback) {
    d3.json("places.json", function(error, json) {
      places=json;
      callback();
    });
  })
  .await(function (){
     map(europe);
  });


function map( json ) {	
  var countries = topojson.feature(json, json.objects.countries);

  feature = g.selectAll(".country")
    .data(countries.features)
    .enter().append("path")
    .attr("class", function(d) {
 return "country " + d.id; })
    .attr("d", path)
  	.on("mouseover", function(d) { 
    	d3.select(this)
      .classed("over",true)
	    //comment the following line to disable tooltip on mouseover 
     	tooltipin(d);
	})
	.on("mouseout", function(d) { 
  	d3.select(this).style("opacity","1")
      .classed("over",false)
  	tooltipout(d);
	})
	.on("click", click)
	.attr("fill", function (d) {
    if (getquota(getiso(d)) >0) // if EU country
      return color(1);
    return "#ccc";
  })
	.transition()        
  .duration(3000) 
	.attr("fill", function(d) {
	  var country = getiso (d);
	
  	var quota =getquota (country);
	  var signatures =getsignatures(country);

  	if(signatures == 0){
	    return "#ccc";	
	  }
	  var diff = signatures/quota;
	  return color(diff);
	})
  .attr("d", path)

drawTotal();
drawCities();

function drawTotal () {
      var total = 0;
      d3.map(dataset.paper).forEach(function(k,v){total += v;});
      d3.map(dataset.online).forEach(function(k,v){total += v;});
      var title = g.append("text")
        .attr("class", "title")
        .attr("transform", "scale(2)")
        .attr("x", 80)
        .attr("y", 200)
  	    .transition()        
          .attr("x", 50)
          .attr("y", 100)
          .text(total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'"))
          .duration(2000) 
          .attr("transform", "scale(1)")
      	  .style("fill", "#666");
}

function getiso (feature) {
  var id=feature.id.toLowerCase();
  if (id == "gb") return "uk";
  if (id == "gr") return "el";
  return id;
}

//Some functions to recover data about each country for the tooltips
function getquota(id){
		if(dataset.quota[id] != null){
	  	return dataset.quota[id];
		} else {
	    return "0";
    }
}


function getsignatures(id, type){
  if(dataset.online[id] == null)
	   return "0";

	  var online = dataset.online[id];
    if (type == "online") 
      return online;
	  var paper = dataset.paper[id];
    if (type == "paper") 
      return paper;
    // by default returns both
    return online + paper;
}


//Function for showing the tooltip. It can be used for onmouseover actions or for click actions	
function tooltipin(d){
  var id=getiso(d);
  var quota = getquota(id);
  if (quota>0) {
    var online = getsignatures(id,"online");
    var paper = getsignatures(id,"paper");
    var percentage = Math.floor(((online + paper) / quota) * 100);
    var title = d.properties.name + " "+ percentage+ "%";
    var body= 
"<ul><li>Online: " + online +
"</li><li>Paper: " + paper +
"</li><li>Threshold: "  + quota + "</li><ul>";
  } else {
    var title = d.properties.name;
    var body = "Not in EU";
  } 
  
	div.transition()        
                .duration(200)      
                .style("opacity", .9);      
            div .html("<h2>"+ title + "</h2><div class='body'>" +body +"</div>")  
                .style("left", (d3.event.pageX + 20) + "px")     
                .style("top", (d3.event.pageY - 28) + "px"); 	
}

//Function for hiding the tooltip.	
function tooltipout(d){
	div.transition()        
                .duration(500)      
                .style("opacity", 0);	
}

function click(d) {
  if (active === d) return reset();
  
  if (getquota(getiso(d)) == 0)  return reset ();

  g.selectAll(".active").classed("active", false);
  d3.select(this).classed("active", active = d);

  var b = path.bounds(d);
  g.transition().duration(750).attr("transform",
      "translate(" + projection.translate() + ")"
      + "scale(" + 0.75 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height) + ")"
      + "translate(" + -(b[1][0] + b[0][0]) / 2 + "," + -(b[1][1] + b[0][1]) / 2 + ")");
   //.classed("active", true)
  g.selectAll(".city."+d.id)
   .classed("active", true)
   .style("opacity",0)
   .transition().duration(750)
	    .attr("r", function(d) {return (7-d.properties.rank)})
     .style("opacity","0.5")

  g.selectAll(".city-label."+d.id)
   .classed("active", true)
   .style("opacity",0)
   .transition().duration(750)
     .style("opacity","0.5")

}

function drawCities() {
//Cities dots
/*
g.append("path")
    .datum(topojson.feature(places, places.objects.places))
    .attr("d", path)
	.attr("r", "0.3px")
    .attr("class", "cities")
*/
g.selectAll(".city")
    .data(topojson.feature(places, places.objects.places).features)
  .enter().append("circle")
	  .attr("r",function(d){return (8-d.properties.rank)/4})
    .attr("cx", function(d) {  return projection(d.geometry.coordinates)[0];})
    .attr("cy", function(d) {  return projection(d.geometry.coordinates)[1];})
    .attr("class", function (d) {return "city "+d.properties.iso+" "+d.properties.type})
//    .attr("transform", function(d) { return "translate(" + projection(d.geometry.coordinates) + ")"; })

//Cities labels
g.selectAll(".city-label")
    .data(topojson.feature(places, places.objects.places).features)
  .enter().append("text")
    .attr("class", function (d) {return "city-label "+d.properties.iso+" "+d.properties.type})
    .attr("transform", function(d) { return "translate(" + projection(d.geometry.coordinates) + ")"; })
    .attr("dy", "-.8em")
    .text(function(d) { return d.properties.name; });
}

function drawCountriesLabel() {	
  svg.selectAll(".place-label")
    .attr("x", function(d) { return d.geometry.coordinates[0] > -1 ? 6 : -6; })
    .style("text-anchor", function(d) { return d.geometry.coordinates[0] > -1 ? "start" : "end"; });

//country label	
  svg.selectAll(".country-label")
    .data(topojson.feature(europe50b, europe50b.objects.countries).features)
  .enter().append("text")
    .attr("class", function(d) { return "country-label " + d.id; })
    .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
    .attr("dy", ".35em")
    .text(function(d) { return d.properties.name; });
}	


};

function reset() {
  g.selectAll(".active").classed("active", active = false);
  g.transition().duration(750).attr("transform", "");
}
