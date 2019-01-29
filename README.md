# Graph Dijkstra algorithm

This is web application for finding best paths in graph between two nodes using Dijkstra algorithm.
This project was made using d3.js.

## Development server

How to run this project:

1. `git clone https://github.com/KostyaBovt/graph_dijkstra folder`
2. `cd folder`
3. `npm install http-server -g` (if needed)
4. `http-server`
5. open http://localhost:8080/ in browser


## How to use

1. Configure application in `app.js` file:
* Set MAX_PATHS - maximum paths to be found between two nodes
* Set INPUT_FILE - file with graph map description
* Reload page to apply configuration
2. Click on nodes to select it: when two nodes selected - best paths will be colored:
* best 5 paths - from the best to the worst, accordingly from  the darkest to the lightest
* others - colored in light red
3. You can create your own input graph file using example: input.json

## Application architecture

1. class Graph:
* responsible for building and managing graph on page layout using map from input file
* receives input file with graph map and builds graph
* manages clicks on nodes
* creates PathFinder object to calculate paths between selected nodes
* updates graph on page to display found paths

2. class PathFinder:
* resposible for finding paths between two nodes
* receives input arrays of nodes and links, and start-end nodes ids
* finds best paths and returns them