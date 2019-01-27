var input = require("./input.json");

function buildMap(input) {
	var nodes = input.nodes;
	var links = input.links;

	var graphMap = new Map();

	nodes.forEach(function(element) {
		graphMap.set(element.id, []);
	})

	links.forEach(function(element) {
		var obj = {};
		obj[element.target] = element.value;
		graphMap.get(element.source).push(element.target);

		var obj = {};
		obj[element.source] = element.value;
		graphMap.get(element.target).push(element.source);


	})

	return graphMap;
}

var map = buildMap(input);
map.delete(7); 


console.log(map); 