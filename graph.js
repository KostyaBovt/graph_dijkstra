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
			this.pathfinderModeOn();
			this.pathFinder = null;
		});

	}

	// ================== Init environment and elements ==================

	initEnvironment() {
		this.svg = d3.select("svg");
		this.width = +this.svg.attr("width");
		this.height = +this.svg.attr("height");

		this.svg.append("g")
			.attr("class", "links");

		this.drawLine = this.svg.append("line")
			.classed("drawline", true)
			.attr("x1", -1)
			.attr("y1", -1)
			.attr("x2", -1)
			.attr("y2", -1);

		this.svg.append("g")
			.attr("class", "nodes");

		this.firstSelectedNode = null;
		this.lastSelectedNode = null;
		this.selection = {nodes: new Set(), links: new Set()};
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

	initLinks() {
		var that = this;
		var selection = this.svg.select(".links")
			.selectAll("line")
			.data(this.input.links, (d) => d.id)

		var newLinks = selection
			.enter().append("line")
			.attr("stroke-width", function(d) { return Math.sqrt(d.value); })
			.attr("id", function(d) {
				// datum differs depending on first enter or link addition (acc. d.source and d.source.id)
				var sourceId = d.source.id != undefined ? d.source.id : d.source;
				var targetId = d.target.id != undefined ? d.target.id : d.target;
				return "n" + Math.min(sourceId, targetId) + "-n" + Math.max(sourceId, targetId); 
			})
			.on("click", function(d) {
				d3.event.stopPropagation();
				if (that.modifyMode && !that.addMode) {
					that.updateSelection("links", d, this)
				}				
			});

		selection.exit().remove();

		this.links = this.svg.select(".links").selectAll("line");
	}

	initNodes() {
		var that = this;
		var selection = this.svg.select(".nodes")
			.selectAll("g")
			.data(this.input.nodes, (d) => d.id)

		var newNodes = selection
			.enter().append("g")
			.attr("id", (d) => { return "n" + d.id })
			.attr("transform", (d) => {
				if (d.x) {
					// if we add node manually we pass datum already with coordinates to locate properly
					return "translate(" + d.x + "," + d.y + ")";
				}
			})
			.on("click", function(d) {
				d3.event.stopPropagation();
				if (that.modifyMode && !that.addMode) {
					that.updateSelection("nodes", d, this)
				}

				if (that.modifyMode && that.addMode && !that.drawLineMode) {
					// start drag new link
					that.startDrawLine(d, this);
					that.menuDrawLineModeOn();
				} else if (that.modifyMode && that.addMode && that.drawLineMode) {
					// finish drag new link
					that.finishDrawLine(d, this);
					that.menuAddModeOn();
				}

				if (!that.modifyMode) {
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
			.force("charge", d3.forceManyBody().strength(-30))
			.force("center", d3.forceCenter(this.width / 2, this.height / 2))

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
		var that = this;
		this.links
			.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });

		this.nodes
			.attr("transform", function(d) {
				// while draw line we must update line start position according to drawLineNode (node can move)
				if (that.drawLineMode) {
					that.drawLine
						.attr("x1", that.drawLineNode.x)
						.attr("y1", that.drawLineNode.y);
				}
				return "translate(" + d.x + "," + d.y + ")";
			})
	}

	// ================== Init event environment and handling ==================

	initEventsEnvironment() {
		this.keyDown = -1;
		this.modifyMode = false;
		this.addMode = false;
		this.drawLineMode = false;
		this.keyCodesAllowed = [17, 77, 46, 68];

		d3.select(window)
			.on('keydown', () => {this.keydown()})
			.on('keyup', () => {this.keyup()});

		var that = this;
		this.svg
			.on("click", function(d)  {
				if (that.modifyMode && that.addMode && !that.drawLineMode) {
					var mouse = d3.mouse(this)
					that.addNode(mouse[0],mouse[1]);
					// start drawLineMode
					if (that.modifyMode && that.addMode && !that.drawLineMode) {
						that.startDrawLine(that.input.nodes[that.getMaxArrayIndex(that.input.nodes)], this);
						that.menuDrawLineModeOn();
					}					
				}
			})
			.on("mousemove", function(d) {
				if (!that.drawLineMode) {
					return;
				}
				// update position of new line while drawing according to mouse position
				that.drawLine
					.attr("x2", d3.mouse(this)[0])
					.attr("y2", d3.mouse(this)[1]);
			});
	}

	keydown() {
		d3.event.preventDefault();
		// prevent multiple key pressed
		if (this.keyDown != -1) {
			console.log("key alredy pressed: " + this.keyDown);
			return;
		}

		if (this.keyCodesAllowed.indexOf(d3.event.keyCode) == -1) {
			console.log("key is not allowed: " + d3.event.keyCode);
			return;
		}

		this.keyDown = d3.event.keyCode;
		console.log("KEY DOWN: " + this.keyDown);

		switch (d3.event.keyCode) {
			case 77: // [m] button
				this.switchModifyMode();
				break;
			case 17: // [ctrl]
				if (this.modifyMode) {
					this.addMode = true;
					this.unHighlightSelectable();
					this.highlightLinkable();
					this.simulation.stop();
					this.menuAddModeOn();
				}
				break;
			case 46: // [delete]
				this.deleteSelected();
				break;
			case 68: // [d] button
				this.dumpGraph();
				break;
		}	
	}

	keyup() {
		if (this.keyDown != d3.event.keyCode) {
			return;
		}
		console.log("KEY UP " + this.keyDown);
		this.keyDown = -1;

		switch (d3.event.keyCode) {
			case 17: // [ctrl]
				if (this.modifyMode) {
					this.addMode = false;
					this.highlightSelectable();
					this.unHighlightLinkable();
					this.menuSelectionModeOn();
					this.updateSimulation();
				}

				if (this.modifyMode && this.drawLineMode) {
					this.cancelDrawLineMode();
					this.menuSelectionModeOn();
				}
				break;
		}

	}

	switchModifyMode() {
		if (this.modifyMode) {
			this.pathfinderModeOn();
		} else {
			this.modifyModeOn();
		}
	}

	pathfinderModeOn() {
		this.modifyMode = false;
		this.unHighlightAll();
		this.unHighlightSelectable();
		this.menuPathfinderModeOn();		
	}

	modifyModeOn() {
		this.modifyMode = true;
		this.highlightAll();
		this.highlightSelectable();
		this.menuModifyModeOn();		
	}

	deleteSelected() {
		this.selection.nodes.forEach((nodeId) => {
			this.deleteNode(nodeId);
		});
		this.selection.links.forEach((linkId) => {
			this.deleteLink(linkId);
		});
		this.selection.nodes.clear();
		this.selection.links.clear();
		this.menuSelectionExistUpdate();
	}

	// ================== Graph update view handling ==================

	highlightAll() {
		this.links
			.classed("highlight", true);
		this.nodes
			.classed("highlight", true);
		this.svg
			.classed("highlight", true);
	}

	unHighlightAll() {
		this.links
			.classed("highlight", false);
		this.nodes
			.classed("highlight", false);
		this.svg
			.classed("highlight", false);			
	}

	highlightSelectable() {
		this.links
			.classed("selectable", true)
		this.nodes
			.classed("selectable", true)
	}

	unHighlightSelectable() {
		this.links
			.classed("selectable", false)
		this.nodes
			.classed("selectable", false)
	}

	highlightLinkable() {
		this.nodes
			.classed("linkable", true)
	}

	unHighlightLinkable() {
		this.nodes
			.classed("linkable", false)
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

	// array for css classes [1, 2, 3, 4, 5, n]
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

	// ================== Side menu update view handling ==================

	menuModifyModeOn() {
		d3.select(".modify-mode").attr("hidden", null);
		d3.select(".pathfinder-mode").attr("hidden", true);
	}


	menuPathfinderModeOn() {
		d3.select(".pathfinder-mode").attr("hidden", null);
		d3.select(".modify-mode").attr("hidden", true);
	}

	menuAddModeOn() {
		d3.select(".add-submode").attr("hidden", null);
		d3.select(".selection-submode").attr("hidden", true);
		d3.select(".draw-submode").attr("hidden", true);
	}

	menuSelectionModeOn() {
		d3.select(".selection-submode").attr("hidden", null);
		d3.select(".add-submode").attr("hidden", true);
		d3.select(".draw-submode").attr("hidden", true);
	}

	menuDrawLineModeOn() {
		d3.select(".draw-submode").attr("hidden", null);
		d3.select(".add-submode").attr("hidden", true);
		d3.select(".selection-submode").attr("hidden", true);
	}

	menuSelectionExistUpdate() {
		if (this.selection.nodes.size || this.selection.links.size) {
			d3.select(".selection-exist").attr("hidden", null);
		} else {
			d3.select(".selection-exist").attr("hidden", true);
		}
	}

	// ================== Add/Delete Nodes/Links fucntions ==================

	addNode(x, y) {
		this.addNodeToInput(x, y);
		this.addNodeToRawInput(x, y);
		this.initNodes();
		this.highlightAll();
		this.highlightLinkable();
		// dont update Simulation to freeze node position on addition (does not work if grapg is ticking)
		// this.updateSimulation();		
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

	deleteNode(id) {
		if (this.firstSelectedNode == id || this.lastSelectedNode == id) {
			d3.selectAll(".nodes .start-node").classed("start-node", false);
			d3.selectAll(".nodes .end-node").classed("end-node", false);
			this.firstSelectedNode = null;
			this.lastSelectedNode = null;
		}

		// delete node from two arays
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
		// delete all links that linked to deleted node
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

	addLink(sourceId, targetId) {
		if (sourceId == targetId) {
			return;
		}

		if (this.checkLinkExist(sourceId, targetId)) {
			return;
		}

		this.addLinkToInput(sourceId, targetId);
		this.addLinkToRawInput(sourceId, targetId);
		this.initLinks();
		this.updateSimulation();
		this.findPaths();
		this.highlightAll();
		this.highlightSelectable();	
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

	deleteLink(id) {
		var index = this.rawInput.links.map((e) => {return e.id}).indexOf(id);
		this.rawInput.links.splice(index, 1);

		var index = this.input.links.map((e) => {return e.id}).indexOf(id);
		this.input.links.splice(index, 1);

		this.initLinks();
		this.updateSimulation();
		this.findPaths();
	}

	checkLinkExist(sourceId, targetId) {
		for (var i = this.rawInput.links.length - 1; i >= 0; i--) {
			var target = this.rawInput.links[i].target;
			var source = this.rawInput.links[i].source;
			if (targetId == target && sourceId == source) {
				return true;
			}
			if (targetId == source && sourceId == target) {
				return true;
			}
		}
		return false;
	}

	// ================== PathFinder invoker ==================

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

	// ================== Selection Mode ==================

	updateSelection(selectionType, d, element) {
		if (!this.selection[selectionType].has(d.id)) {
			this.selection[selectionType].add(d.id);
			d3.select(element).classed("selected", true);
			this.menuSelectionExistUpdate();
		} else {
			this.selection[selectionType].delete(d.id);
			d3.select(element).classed("selected", false);
			this.menuSelectionExistUpdate();
		}
	}

	// ================== DrawLine Mode ==================

	startDrawLine(d, node) {
		this.drawLineMode = true;
		this.drawLine
			.attr("x1", d.x)
			.attr("y1", d.y)
			.attr("x2", d.x)
			.attr("y2", d.y)
		this.drawLineNode = d;
	}

	finishDrawLine(d, node) {
		if (d.id != this.drawLineNode.id) {
			this.addLink(this.drawLineNode.id, d.id);
		}
		this.cancelDrawLineMode();
		this.menuAddModeOn();
	}

	cancelDrawLineMode() {
		this.drawLineMode = false;
		this.drawLineNode = null;
		this.drawLine
			.attr("x1", -1)
			.attr("y1", -1)
			.attr("x2", -1)
			.attr("y2", -1);
	}

	// ================== Helpers ==================

	dumpGraph() {
		var json = JSON.stringify(this.rawInput);
		console.log(json);
	}

}
