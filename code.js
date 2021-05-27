function simulation_frame() {

}

function render_output(particles_array) {
    var svg = document.querySelector("svg");
    var svgns = "http://www.w3.org/2000/svg";
    for (particle of particles_array) {
        var img = document.createElementNS(svgns, "image");
    }
}