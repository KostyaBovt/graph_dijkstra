# Graph Dijkstra algorithm

This is web application for finding best paths in graph between two nodes using Dijkstra algorithm.
This project was made using d3.js.

## Development server

###### How to run this project:

1. `git clone https://github.com/KostyaBovt/graph_dijkstra folder`
2. `cd folder`
3. `npm install http-server -g` (if needed)
4. `http-server`
5. open http://localhost:8080/ in browser


## Configure
###### Configure application in `app.js` file:
* Set MAX_PATHS - maximum paths to be found between two nodes
* Set INPUT_FILE -  default input file with graph map description (will be loaded on open page)
* Reload page to apply configuration

## Usage

#### Sidebar
* Upload new graph file
* See current Mode activated (Pathfinder, Modify)
* See tips on every action

#### Graph
###### Pathfinder Mode
* Click on nodes to select it: when two nodes selected - best paths will be colored:
* Best 5 paths - from the best to the worst, accordingly from  the darkest to the lightest
* Others - colored in light red

###### Modify Mode
* Press `m` button to activate
* Click on nodes/link to select
* Press `delete` to delete selected elements

Press and hold `ctrl` to activate Add Mode:
* now click on empty area to add node and than on another node to link new node to it
* OR click on existing node and than on another node to link them 


## Application architecture

###### class `Graph` (`graph.js`):
* responsible for building, displaying, and manipulating graph on page layout
* receives input file with graph map and builds graph
* manages additing/deleting/selecting nodes and links
* uses PathFinder object to calculate paths between selected nodes

###### class `PathFinder` (`pathfinder.js`):
* resposible for finding paths between two nodes
* receives input arrays of nodes and links, and start-end nodes ids
* finds best paths and returns them