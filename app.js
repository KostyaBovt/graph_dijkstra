const MAX_PATHS = 10;
const INPUT_FILE = "input_2.json";

window.onload = function() {	
	var fileInput = document.getElementById('fileinput');

	fileInput.onchange = function(event) {
		if (event.target.files && event.target.files.length > 0) {
			var fileName = event.target.files[0].name;
			document.getElementById("main-svg").innerHTML = "";
			var graph = new Graph(fileName);
	    }
	}

	fileInput.onclick = function(event) {
		fileInput.value = "";
	}
}

var graph = new Graph(INPUT_FILE);