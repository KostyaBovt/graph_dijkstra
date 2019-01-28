const MAX_PATHS = 10;

class Graph {
	constructor(file) {
		d3.json(file, (error, input) => {
			if (error) throw error;
			this.input = this.copyInput(input);
			this.rawInput = input;
			this.initEnvironment();
			this.initLinks();
			this.initNodes();
			this.initSimulation();
			this.graphMap = null;
		});

	}

	copyInput(input) {
		var newInput = {};
		newInput.nodes = [];
		newInput.links = [];
		for (var i = input.nodes.length - 1; i >= 0; i--) {
			newInput.nodes.push(Object.assign({}, input.nodes[i]));
		}
		for (var i = input.links.length - 1; i >= 0; i--) {
			newInput.links.push(Object.assign({}, input.links[i]));
		}
		return newInput;
	}

	printGraph(nodes, links) {
		console.log('nodes: ');
		console.log(nodes);
		console.log('links: ');
		console.log(links);
	}

	initEnvironment() {
		this.svg = d3.select("svg");
		this.width = +this.svg.attr("width");
		this.height = +this.svg.attr("height");
		this.firstSelectedNode = null;
		this.lastSelectedNode = null;
	}

	initLinks() {
		this.links = this.svg.append("g")
			.attr("class", "links")
			.selectAll("line")
			.data(this.input.links)
			.enter().append("line")
			.attr("stroke-width", function(d) { return Math.sqrt(d.value); })
			.attr("id", function(d) { return "n" + Math.min(d.source, d.target) + "-n" + Math.max(d.source, d.target); })
	}

	initNodes() {
		var that = this;
		this.nodes = this.svg.append("g")
			.attr("class", "nodes")
			.selectAll("g")
			.data(this.input.nodes)
			.enter().append("g")
			.attr("id", (d) => "n" + d.id)
			.on("click", function(d) {
				that.selectNode(d, this);
				that.hideLinks();
				if (that.firstSelectedNode !== null && that.lastSelectedNode !== null) {
					that.graphMap = new GraphMap(
						that.rawInput.nodes,
						that.rawInput.links,
						that.firstSelectedNode,
						that.lastSelectedNode
					);
					that.graphMap.findPaths();
					that.showLinks(that.graphMap.getFoundPaths());
				}

			});

		this.circles = this.nodes.append("circle")
			.attr("r", 5)
			.attr("fill", "#6ba3ff")
			.call(d3.drag()
				.on("start", (d) => this.dragstarted(d))
				.on("drag", (d) => this.dragged(d))
				.on("end", (d) => this.dragended(d)));

		this.lables = this.nodes.append("text")
			.text(function(d) {
				return d.id;
			})
			.attr('x', 6)
			.attr('y', 3);

		this.nodes.append("title")
			.text(function(d) { return d.id; });

	}

	dragstarted(d) {
		if (!d3.event.active) this.simulation.alphaTarget(0.3).restart();
		d.fx = d.x;
		d.fy = d.y;
	}

	dragged(d) {
		d.fx = d3.event.x;
		d.fy = d3.event.y;
	}

	dragended(d) {
		if (!d3.event.active) this.simulation.alphaTarget(0);
		d.fx = null;
		d.fy = null;
	}

	generateSelectorArray() {
		var arr = [];
		for (var i = 1; i <= MAX_PATHS; i++) {
			arr.push(i);
		}
		if (MAX_PATHS > 5) {
			arr.push('n');
		}
		return arr;
	}

	showLinks(foundPaths) {
		foundPaths.forEach((foundPath, num) => {
			for (var i = 0; i < foundPath.length - 1; i++) {
				// color links
				var min = Math.min(foundPath[i], foundPath[i + 1]);
				var max = Math.max(foundPath[i], foundPath[i + 1]);
				var id = "#n" + min + "-n" + max;
				var sclass = "selected-" + ((num >= 5) ? "n" : (num + 1));
				this.svg.select(id).classed(sclass, true);

				//color nodes
				if (i) {
					var id = "#n" + foundPath[i];
					var sclass = "selected-" + ((num >= 5) ? "n" : (num + 1));
					this.svg.select(id).classed(sclass, true);
				}
			}
		})
	}

	hideLinks() {
		var selectorArray = this.generateSelectorArray();
		// uncolor links
		selectorArray.forEach((selector) => {
			var sclass = "selected-" + selector;
			this.svg.selectAll("line." + sclass).classed(sclass, false);		
		})

		// uncolor nodes
		selectorArray.forEach((selector) => {
			var sclass = "selected-" + selector;
			this.svg.selectAll(".nodes ." + sclass).classed(sclass, false);
		})
	}

	selectNode(d, node) {
		if (d3.select(node).classed("end-node")) {
			return;
		}

		d3.selectAll(".nodes .start-node").classed("start-node", false);
		d3.selectAll(".nodes .end-node").classed("end-node", false).classed("start-node", true);
		d3.select(node).classed("end-node", true);

		this.firstSelectedNode = this.lastSelectedNode;
		this.lastSelectedNode = d.id;

		console.log("firstSelectedNode: " + this.firstSelectedNode);
		console.log("lastSelectedNode: " + this.lastSelectedNode);
	}

	initSimulation() {
		this.simulation = d3.forceSimulation()
			.force("link", d3.forceLink().id(function(d) { return d.id; }))
			.force("charge", d3.forceManyBody())
			.force("center", d3.forceCenter(this.width / 2, this.height / 2));

		this.simulation
			.nodes(this.input.nodes)
			.on("tick", () => { this.ticked() });

		this.simulation.force("link")
			.links(this.input.links);
	}

	ticked() {
		this.links
			.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });

		this.nodes
			.attr("transform", function(d) {
				return "translate(" + d.x + "," + d.y + ")";
			})
	}
}


class GraphMap {
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