function simulation_frame(particles_array) {
    return particles_array;
}

function render_output(particles_array) {
    var svg = document.querySelector("svg");
    var svgns = "http://www.w3.org/2000/svg";
    for (var particle of particles_array) {
        var img = document.createElementNS(svgns, "image");
        img.setAttribute("x", particle.x - particle.w);
        img.setAttribute("y", particle.y - particle.h);
        img.setAttribute("width", particle.w);
        img.setAttribute("height", particle.h);
        svg.appendChild(particle)
    }
}

function emit_new(emitter_settings, rng) {
    //var rng = new Math.seedrandom(emitter_settings.seed);
    var particle = {
        x: emitter_settings.startX,
        y: emitter_settings.startY,
        angle: emitter_settings.angle + rng() * emitter_settings.angle_variance
    }
    return particle;
}

// shoot particles in a line based on starting point, angle
// allow the emitter to vary the angles randomly