var file = require('./input.json');

var object = {nodes:[], links: []}

var map = {};

for (var i = file.nodes.length - 1; i >= 0; i--) {
	map[file.nodes[i]['id']] = i;
	object.nodes.push({'id': i});
}

for (var i = file.links.length - 1; i >= 0; i--) {
	object.links.push({id: i, source: map[file.links[i]['source']], target: map[file.links[i]['target']], value: 1});
}

// console.log(map);
// console.log('\n\n');
console.log(JSON.stringify(object));