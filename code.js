const doc_dimensions = {
    width: parseFloat((new URLSearchParams(location.search)).get("docWidth")),
    height: parseFloat((new URLSearchParams(location.search)).get("docHeight"))
};

if (isNaN(doc_dimensions.width) || isNaN(doc_dimensions.height)) location.replace("index.html");

function run_simulation(emitter_settings, frames, particle_settings, forces) {
    var particles_array = [];
    var rng = new Math.seedrandom(emitter_settings.seed); 
    for (var i = 0; i < frames; i++) {
        if (i % emitter_settings.period == 0) {
            var newParticle = emit_new(emitter_settings, rng);
            newParticle.lives_left = particle_settings.lifespan;
            particles_array.push(newParticle);
        }
        var j = 0;
        while (j < particles_array.length) {
            var particle = particles_array[j];
            if (particle.lives_left == 0) {
                particles_array.splice(j, 1);
            }
            else {
                particle.x += Math.cos(particle.angle) * particle_settings.speed;
                particle.y += Math.sin(particle.angle) * particle_settings.speed;
                particle.x += forces.gravity * Math.cos(forces.gravitydirection) * (particle_settings.lifespan - particle.lives_left);
                particle.y += forces.gravity * Math.sin(forces.gravitydirection) * (particle_settings.lifespan - particle.lives_left);
                if (particle.lives_left < particle_settings.lifespan) {
                    particle.w -= emitter_settings.particleWidth / particle_settings.lifespan;
                    particle.h -= emitter_settings.particleHeight / particle_settings.lifespan;
                }
                particle.lives_left -= 1;
                j++;
            }
        }
    }
    return particles_array;
}

async function render_output(particles_array) {
    var svgns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(svgns, "svg");
    svg.setAttribute("width", doc_dimensions.width);
    svg.setAttribute("height", doc_dimensions.height);
    for (var particle of particles_array) {
        var img = document.createElementNS(svgns, "image");
        img.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", await getdataurl("https://yikuansun.github.io/photopea-particlesystem/default_textures/whiteorb.png"));
        img.setAttribute("x", particle.x - particle.w / 2);
        img.setAttribute("y", particle.y - particle.h / 2);
        img.setAttribute("width", particle.w);
        img.setAttribute("height", particle.h);
        img.setAttribute("transform", `rotate(${particle.angle * 180 / Math.PI} ${particle.x} ${particle.y})`);
        svg.appendChild(img);
    }
    document.querySelector("#hidden_content").appendChild(svg);
    var outstring = await rasterize(svg);
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

render_output(run_simulation(
    {
        startX: 960,
        startY: 540,
        particleWidth: 25,
        particleHeight: 25,
        angle: 3 * Math.PI / 2,
        angle_variance: Math.PI / 5,
        period: 1,
        seed: 69
    },
    500,
    {
        lifespan: 500,
        scale_decay: 1,
        speed: 1
    },
    {
        gravity: 0.005,
        gravitydirection: 3 * Math.PI / 2
    }
)).then(async function(data) {
    console.log(data);
    Photopea.runScript(window.parent, `app.open("${data}", null, true);`);
});