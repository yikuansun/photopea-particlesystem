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
    var texture_uri = await getdataurl("https://yikuansun.github.io/photopea-particlesystem/default_textures/whiteorb.png");
    var canvas = document.createElement("canvas");
    canvas.width = doc_dimensions.width;
    canvas.height = doc_dimensions.height;
    document.querySelector("#hidden_content").appendChild(canvas);
    var ctx = canvas.getContext("2d");
    await preloadImage(texture_uri);
    for (var particle of particles_array) {
        var img = new Image(particle.w, particle.h);
        img.src = texture_uri;
        ctx.drawRotatedImage(img, particle.x, particle.y, particle.w, particle.h, particle.angle);
    }
    var outstring = canvas.toDataURL();
    canvas.remove();
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
        gravitydirection: Math.PI / 2
    }
)).then(async function(data) {
    console.log(data);
    Photopea.runScript(window.parent, `app.open("${data}", null, true);`);
});