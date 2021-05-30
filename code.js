function run_simulation(emitter_settings, frames) {
    var particles_array = [];
    var rng = new Math.seedrandom(emitter_settings.seed); 
    for (var i = 0; i < frames; i++) {
        if (i % emitter_settings.period == 0) particles_array.push(emit_new(emitter_settings, rng));
        for (var particle of particles_array) {
            particle.x += Math.cos(particle.angle);
            particle.y += Math.sin(particle.angle);
        }
    }
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
    var particle = {
        x: emitter_settings.startX,
        y: emitter_settings.startY,
        angle: emitter_settings.angle + rng() * emitter_settings.angle_variance
    }
    return particle;
}

// shoot particles in a line based on starting point, angle
// allow the emitter to vary the angles randomly