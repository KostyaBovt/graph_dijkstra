var nodeDistances = {
	"1": 12,
	"2": 34,
	"7": 2,
	"31": 8
} 

this.nodeVisited = {
	"2": true,
	"7": true,
}

for (var key in nodeDistances) {
	if (this.nodeVisited[key]) {
		continue;
	}
	console.log('we will process unvisited node wit id: ' + key);
}
