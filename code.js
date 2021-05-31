const doc_dimensions = {
    width: parseFloat((new URLSearchParams(location.search)).get("docWidth")),
    height: parseFloat((new URLSearchParams(location.search)).get("docHeight"))
};

if (isNaN(doc_dimensions.width) || isNaN(doc_dimensions.height)) location.replace("index.html");

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
    var svgns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(svgns, "svg");
    svg.setAttribute("width", doc_dimensions.width);
    svg.setAttribute("height", doc_dimensions.height);
    for (var particle of particles_array) {
        var img = document.createElementNS(svgns, "image");
        img.setAttribute("href", "https://raw.githubusercontent.com/yikuansun/photopea-particlesystem/master/default_textures/whiteorb.png");
        img.setAttribute("x", particle.x - particle.w);
        img.setAttribute("y", particle.y - particle.h);
        img.setAttribute("width", particle.w);
        img.setAttribute("height", particle.h);
        img.setAttribute("transform", `rotate(${particle.angle * 180 / Math.PI} ${particle.x} ${particle.y})`);
        svg.appendChild(img);
    }
    document.body.appendChild(svg);
    var outstring = "data:image/svg+xml;base64," + window.btoa(
        (new XMLSerializer()).serializeToString(svg)
    );
    svg.remove();
    return outstring;
}

function emit_new(emitter_settings, rng) {
    var particle = {
        x: emitter_settings.startX,
        y: emitter_settings.startY,
        w: emitter_settings.particleWidth,
        h: emitter_settings.particleHeight,
        angle: emitter_settings.angle + (rng() - 0.5) * emitter_settings.angle_variance
    }
    return particle;
}

console.log(render_output(run_simulation(
    {
        startX: 960,
        startY: 540,
        particleWidth: 25,
        particleHeight: 25,
        angle: Math.PI,
        angle_variance: Math.PI / 5,
        period: 10,
        seed: 69
    },
    500
)));

Photopea.runScript(window.parent, `app.open("${render_output(run_simulation(
    {
        startX: 960,
        startY: 540,
        particleWidth: 25,
        particleHeight: 25,
        angle: Math.PI,
        angle_variance: Math.PI / 5,
        period: 10,
        seed: 69
    },
    500
))}", null, true);`);