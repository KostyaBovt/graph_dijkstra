class PathFinder {
	constructor(nodes, links, startId, endId) {
		this.initNodes = nodes;
		this.initLinks = links;

		this.nodes = {};
		this.initMap();

		this.startNode = this.nodes[startId];
		this.endNote = this.nodes[endId];
		this.currentNode = this.startNode;
		this.refreshEnvironment();

		this.foundPaths = [];
		this.directPathAdded = false;
		this.nodeInPath = {};
		this.stopFindPaths = false;
	}


	refreshEnvironment() {
		this.currentNode = this.startNode;
		this.nodeDistances = {};
		this.nodeDistances[this.startNode.id] = 0;
		this.nodeVisited = {};
		this.nodePaths = {};
		this.nodePaths[this.currentNode.id] = [this.startNode.id];
		this.stopFindPath = false;
	}

	initMap() {
		this.initNodes.forEach( (element) => {  this.addNode(element)});
		this.initLinks.forEach( (element) => {  this.addLink(element)});
	}

	addNode(node) {
		this.nodes[node.id] = {
			id: node.id,
			links: {},
			visited: false,
			distance: 4503599627370496,
			path: []
		};
	}

	addLink(link) {
		this.nodes[link.source]["links"][link.target] = link.value;
		this.nodes[link.target]["links"][link.source] = link.value;
	}

	updateStartEndNodes(startId, endId) {
		this.startNode = this.nodes[startId];
		this.endNote = this.nodes[endId];
	}

	findPaths() {
		while (!this.stopFindPaths && this.foundPaths.length < MAX_PATHS) {
			this.findPath();
		}
		console.log(this.foundPaths);
	}

	findPath() {
		this.refreshEnvironment();
		while (!this.stopFindPath) {
			this.visitCurrentNode();
			this.currentNode = this.getNearestNode();
		}
		if (this.nodeVisited[this.endNote.id]) {
			var foundPath = this.nodePaths[this.endNote.id].slice();
			if (foundPath.length == 2) {
				this.directPathAdded = true;
			}
			this.foundPaths.push(foundPath);
			this.updatedNodeInPath(foundPath);
		} else {
			this.stopFindPaths = true;
		}

	}

	updatedNodeInPath(foundPath) {
		for (var i = foundPath.length - 2; i >= 1; i--) {
			this.nodeInPath[foundPath[i]] = true;
		}
	}

	visitCurrentNode() {
		for (var key in this.currentNode.links) {
			if (this.nodeVisited[key] || this.nodeInPath[key]) {
				continue;
			}

			if ((this.currentNode.id == this.startNode.id) && (this.nodes[key]["id"] == this.endNote.id)) {
				if (this.directPathAdded) {
					continue;
				}
			}
			this.updateNodeDistance(key);
		}
		this.nodeVisited[this.currentNode.id] = true;
		delete this.nodeDistances[this.currentNode.id];
		if (this.currentNode.id == this.endNote.id) {
			this.stopFindPath = true;
			return;
		}	
	}

	getNearestNode() {
		if (Object.keys(this.nodeDistances).length === 0) {
			this.stopFindPath = true;
			return null;
		}
		var nearestNodeId = Object.keys(this.nodeDistances)[0];
		var nearestNodeDistance = this.nodeDistances[nearestNodeId];
		for (var key in this.nodeDistances) {
			if (this.nodeDistances[key] < nearestNodeDistance) {
				nearestNodeId = key;
				nearestNodeDistance = this.nodeDistances[key];
			}
		}
		return this.nodes[nearestNodeId];
	}

	updateNodeDistance(linkedNodeId) {
		var currentDistance = this.nodeDistances[linkedNodeId] ? this.nodeDistances[linkedNodeId] : 4503599627370496;
		var newDistance = this.nodeDistances[this.currentNode.id] + this.currentNode.links[linkedNodeId];
		if (newDistance < currentDistance) {
			this.nodeDistances[linkedNodeId] = newDistance;
			this.updateNodePath(linkedNodeId);
		}
	}

	updateNodePath(linkedNodeId) {
		var newPath = this.nodePaths[this.currentNode.id].slice();
		newPath.push(linkedNodeId);
		this.nodePaths[linkedNodeId] = newPath;
	}

	getFoundPaths() {
		return this.foundPaths;
	}
}