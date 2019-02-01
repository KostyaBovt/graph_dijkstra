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
			this.initEventsEnvironment();
			this.pathFinder = null;

			// setTimeout(() => {
			// 	this.deleteNode(30);
			// }, 4000)
			// setTimeout(() => {
			// 	this.deleteNode(16);
			// }, 4000)
			// setTimeout(() => {
			// 	this.deleteNode(23);
			// }, 7000)
			// setTimeout(() => {
			// 	this.deleteLink(55);
			// }, 6000)
			// setTimeout(() => {
			// 	this.addNode(306, 306);
			// }, 4000)
			// setTimeout(() => {
			// 	this.addLink(16, 26);
			// }, 9000)
			console.log(this.input);
			console.log(this.rawInput);
		});

	}

	keydown() {
		if (this.keyDown != -1) {
			return;
		}
		this.keyDown = d3.event.keyCode;
		console.log("KEY DOWN: " + this.keyDown);

		switch (d3.event.keyCode) {
			case 17:
				this.highlightAll();
				break;
		}	
	}

	highlightAll() {
		this.links
			.classed("highlight", true);
		this.nodes
			.classed("highlight", true);
	}

	unHighlightAll() {
		this.links
			.classed("highlight", false)
		this.nodes
			.classed("highlight", false)
	}

	keyup() {
		if (this.keyDown != d3.event.keyCode) {
			return;
		}
		console.log("KEY UP " + this.keyDown);
		this.keyDown = -1;

		switch (d3.event.keyCode) {
			case 17:
				this.unHighlightAll();
				break;
		}

	}

	initEventsEnvironment() {
		this.keyDown = -1;

		d3.select(window)
			.on('keydown', () => {this.keydown()})
			.on('keyup', () => {this.keyup()});

	}

	deleteNode(id) {
		if (this.firstSelectedNode == id || this.lastSelectedNode == id) {
			d3.selectAll(".nodes .start-node").classed("start-node", false);
			d3.selectAll(".nodes .end-node").classed("end-node", false);
			this.firstSelectedNode = null;
			this.lastSelectedNode = null;
		}

		var nodeArrays = [this.rawInput.nodes, this.input.nodes]; 

		nodeArrays.forEach((nodeArray) => {
			var index = nodeArray.map((e)=>{return e.id}).indexOf(id);
			if (index != -1) {
				nodeArray.splice(index, 1);
			}
		})
		this.deleteNodeLinks(id);
		this.initNodes();
		this.initLinks();
		this.updateSimulation();
		this.findPaths();
	}

	deleteNodeLinks(id) {
		var linkArrays = [
			{
				array: this.rawInput.links,
				getSourceId: function(e) { return e.source; },
				getTargetId: function(e) { return e.target;	}
			},
			{
				array: this.input.links,
				getSourceId: function(e) { return e.source.id; },
				getTargetId: function(e) { return e.target.id; }
			}
		]


		linkArrays.forEach((linkArray) => {
			var indexes = [];

			var index = linkArray.array.map((e) => {return linkArray.getTargetId(e)}).indexOf(id);
			while (index != -1) {
				indexes.push(index);
				index = linkArray.array.map((e) => {return linkArray.getTargetId(e)}).indexOf(id, index + 1);
			}

			var index = linkArray.array.map((e) => {return linkArray.getSourceId(e)}).indexOf(id);
			while (index != -1) {
				indexes.push(index);
				index = linkArray.array.map((e) => {return linkArray.getSourceId(e)}).indexOf(id, index + 1);
			}

			indexes.sort((a, b) => {return (b - a)})
			indexes.forEach((index) => {
				linkArray.array.splice(index, 1);
			})

		})

	}

	deleteLink(id) {
		var index = this.rawInput.links.map((e) => {return e.id}).indexOf(id);
		this.rawInput.links.splice(index, 1);

		var index = this.input.links.map((e) => {return e.id}).indexOf(id);
		this.input.links.splice(index, 1);

		this.initLinks();
		this.updateSimulation();
		this.findPaths();
	}

	addLink(sourceId, targetId) {
		this.addLinkToInput(sourceId, targetId);
		this.addLinkToRawInput(sourceId, targetId);
		this.initLinks();
		this.updateSimulation();
		this.findPaths();		
	}

	addLinkToInput(sourceId, targetId) {
		var sourceIndex = this.input.nodes.map((e) => {return e.id}).indexOf(sourceId);
		var targetIndex = this.input.nodes.map((e) => {return e.id}).indexOf(targetId);
		var newLink = {
			id: this.getMaxArrayId(this.input.links) + 1,
			index: this.getMaxArrayIndex(this.input.links) + 1,
			source: this.input.nodes[sourceIndex],
			target: this.input.nodes[targetIndex],
			value: 1
		};
		this.input.links.push(newLink);
	}

	addLinkToRawInput(sourceId, targetId) {
		var newLink = {
			id: this.getMaxArrayId(this.rawInput.links) + 1,
			source: sourceId,
			target: targetId,
			value: 1
		}
		this.rawInput.links.push(newLink);
	}

	addNode(x, y) {
		this.addNodeToInput(x, y);
		this.addNodeToRawInput(x, y);
		this.initNodes();
		this.updateSimulation();		
	}

	addNodeToInput(x, y) {
		var newNode = {
			id: this.getMaxArrayId(this.input.nodes) + 1,
			index: this.getMaxArrayIndex(this.input.nodes) + 1,
			vx: 0,
			vy: 0,
			x: x,
			y: y
		}
		this.input.nodes.push(newNode);
	}

	addNodeToRawInput(x, y) {
		var newNode = {
			id: this.getMaxArrayId(this.rawInput.nodes) + 1,
		}
		this.rawInput.nodes.push(newNode);
	}

	getMaxArrayId(nodeArray) {
		var maxId = nodeArray[0]["id"];
		for (var i = nodeArray.length - 1; i >= 0; i--) {
			if (nodeArray[i]["id"] > maxId ) {
				maxId = nodeArray[i]["id"];
			}
		}
		return maxId;
	}

	getMaxArrayIndex(nodeArray) {
		return nodeArray.length - 1;
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

		this.svg.append("g")
			.attr("class", "links");

		this.svg.append("g")
			.attr("class", "nodes");

		this.firstSelectedNode = null;
		this.lastSelectedNode = null;
		this.selection = {nodes: new Set(), links: new Set()};
	}

	initLinks() {
		var selection = this.svg.select(".links")
			.selectAll("line")
			.data(this.input.links, (d) => d.id)

		var newLinks = selection
			.enter().append("line")
			.attr("stroke-width", function(d) { return Math.sqrt(d.value); })
			.attr("id", function(d) {
				var sourceId = d.source.id ? d.source.id : d.source;
				var targetId = d.target.id ? d.target.id : d.target;
				return "n" + Math.min(sourceId, targetId) + "-n" + Math.max(sourceId, targetId); 
			})

		selection.exit().remove();

		this.links = this.svg.select(".links").selectAll("line");
	}

	findPaths() {
		this.hidePaths();
		if (this.firstSelectedNode !== null && this.lastSelectedNode !== null) {
			this.pathFinder = new PathFinder(
				this.rawInput.nodes,
				this.rawInput.links,
				this.firstSelectedNode,
				this.lastSelectedNode
			);
			this.pathFinder.findPaths();
			this.showPaths(this.pathFinder.getFoundPaths());
		}
	}

	updateSelection(selectionType, d, element) {
		if (this.selection[selectionType].has(d.id)) {
			
		}
	}

	initNodes() {
		var that = this;
		var selection = this.svg.select(".nodes")
			.selectAll("g")
			.data(this.input.nodes, (d) => d.id)

		var newNodes = selection
			.enter().append("g")
			.attr("id", (d) => "n" + d.id)
			.on("click", function(d) {
				if (that.keyDown == 17) {
					console.log(this);
					console.log(d);
					that.updateSelection("nodes", d, this)
				} else {
					that.selectStartEndNode(d, this);
					that.findPaths();
				}
			});

		newNodes.append("circle")
			.attr("r", 7)
			.call(d3.drag()
				.on("start", (d) => this.dragstarted(d))
				.on("drag", (d) => this.dragged(d))
				.on("end", (d) => this.dragended(d)));

		newNodes.append("text")
			.text(function(d) {
				return d.id;
			})
			.attr('x', 6)
			.attr('y', 3);

		newNodes.append("title")
			.text(function(d) { return d.id; });

		selection.exit().remove();

		this.nodes = this.svg.select(".nodes").selectAll("g");
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

	updateSimulation() {
		this.simulation
			.nodes(this.input.nodes)
			.force("link").links(this.input.links);

		this.simulation.alphaTarget(0.3).restart();
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

	showPaths(foundPaths) {
		foundPaths.forEach((foundPath, num) => {
			for (var i = 0; i < foundPath.length - 1; i++) {
				// color links
				var min = Math.min(foundPath[i], foundPath[i + 1]);
				var max = Math.max(foundPath[i], foundPath[i + 1]);
				var id = "#n" + min + "-n" + max;
				var sclass = "path-" + ((num >= 5) ? "n" : (num + 1));
				this.svg.select(id).classed(sclass, true);

				//color nodes
				if (i) {
					var id = "#n" + foundPath[i];
					var sclass = "path-" + ((num >= 5) ? "n" : (num + 1));
					this.svg.select(id).classed(sclass, true);
				}
			}
		})
	}

	hidePaths() {
		var selectorArray = this.generateSelectorArray();
		// uncolor links
		selectorArray.forEach((selector) => {
			var sclass = "path-" + selector;
			this.svg.selectAll("line." + sclass).classed(sclass, false);		
		})

		// uncolor nodes
		selectorArray.forEach((selector) => {
			var sclass = "path-" + selector;
			this.svg.selectAll(".nodes ." + sclass).classed(sclass, false);
		})
	}

	selectStartEndNode(d, node) {
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
}
