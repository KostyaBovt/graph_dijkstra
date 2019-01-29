# Graph dijkstra algorithm

This is web application for finding best paths in graph between two nodes using dijkstra algorithm.
This project was made using d3.js.

## Development server

How to run this project:

1. `git clone https://github.com/KostyaBovt/graph_dijkstra folder`
2. `cd folder`
3. `npm install http-server -g` (if needed)
4. `http-server`
5. open http://localhost:8080/ in browser


## How to use

1. Configure application in `app.js` file
* Set MAX_PATHS - maximum paths to be founded between two nodes
* Set INPUT_FILE - file with graph map description
* Reload page to apply configuration
2. Click on nodes to select it: where two nodes selected - best paths will be colored:
* best 5 paths - from best to worst, accordingly from darker to lighter
* others - ligth red colored
3. You can create your own input grapg file using example: input.json

## Application architecture

1. class Graph:
* responsible for building and managing graph on page layout using map from input file
* receive input file with graph map and build it
* manage clicks on nodes
* create GraphMap object to calculate paths between selected nodes
* update graph on page to display founded paths

2. class GraphMap:
* resposible for finding paths betwenn two nodes
* receive input arays of nodes and links, and start-end nodes ids
* find best paths and return them