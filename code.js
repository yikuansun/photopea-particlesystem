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
                    particle.w -= emitter_settings.particleWidth / particle_settings.lifespan * particle_settings.scale_decay;
                    particle.h -= emitter_settings.particleHeight / particle_settings.lifespan * particle_settings.scale_decay;
                    particle.opacity -= emitter_settings.particleOpacity / particle_settings.lifespan * particle_settings.opacity_decay;
                }
                particle.lives_left -= 1;
                j++;
            }
        }
    }
    return particles_array;
}

async function render_output(particles_array) {
    var texture_uri = await getdataurl("https://yikuansun.github.io/photopea-particlesystem/default_textures/flame01.png");
    var canvas = document.createElement("canvas");
    canvas.width = doc_dimensions.width;
    canvas.height = doc_dimensions.height;
    document.querySelector("#hidden_content").appendChild(canvas);
    var ctx = canvas.getContext("2d");
    await preloadImage(texture_uri);
    for (var particle of particles_array) {
        var img = new Image(particle.w, particle.h);
        img.src = texture_uri;
        ctx.globalAlpha = particle.opacity;
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
        w: emitter_settings.particleWidth * (1 + (rng() - 0.5) * emitter_settings.scale_variance),
        h: emitter_settings.particleHeight * (1 + (rng() - 0.5) * emitter_settings.scale_variance),
        opacity: emitter_settings.particleOpacity,
        angle: emitter_settings.angle + (rng() - 0.5) * emitter_settings.angle_variance
    }
    return particle;
}

render_output(run_simulation(
    {
        startX: 960,
        startY: 540,
        particleWidth: 69,
        particleHeight: 69,
        particleOpacity: 0.15,
        angle: 3 * Math.PI / 2,
        angle_variance: Math.PI / 2,
        scale_variance: 1.2,
        period: 1,
        seed: 69
    },
    500,
    {
        lifespan: 500,
        scale_decay: 0.25,
        opacity_decay: 1,
        speed: 0.25
    },
    {
        gravity: 0.0025,
        gravitydirection: 3 * Math.PI / 2
    }
)).then(async function(data) {
    console.log(data);
    document.querySelector("#preview").src = data;
    Photopea.runScript(window.parent, `app.open("${data}", null, true);`);
});

function makePanel(inputs) {
    for (var id in inputs) {
        var input = document.createElement("ADVANCED-SLIDER");
        document.querySelector("#controlpanel").appendChild(input);
        input.value = inputs[id].val;
        input.min = inputs[id].min;
        input.max = inputs[id].max;
        input.numberElement.style.width = "69px";
        if (inputs[id].step) input.step = inputs[id].step;
        var br = document.createElement("br");
        document.querySelector("#controlpanel").appendChild(br);
    }
}

makePanel({
    startX: {
        val: doc_dimensions.width / 2,
        min: 0,
        max: doc_dimensions.width
    },
    startY: {
        val: doc_dimensions.height / 2,
        min: 0,
        max: doc_dimensions.height
    },
    particleSize: {
        val: 69,
        min: 0,
        max: 100
    },
    particleOpacity: {
        val: 0.15,
        min: 0,
        max: 1,
        step: 0.01
    },
    angle: {
        val: 3 * Math.PI / 2,
        min: 0,
        max: Math.PI * 2,
        step: 0.01
    },
    angle_variance: {
        val: Math.PI / 2,
        min: 0,
        max: Math.PI * 2,
        step: 0.01
    },
    scale_variance: {
        val: 1.2,
        min: 0,
        max: 3,
        step: 0.01
    },
    period: {
        val: 1,
        min: 0,
        max: 10
    },
    seed: {
        val: 69,
        min: 0,
        max: 101010
    },
    frames: {
        val: 500,
        min: 0,
        max: 1000
    },
    lifespan: {
        val: 500,
        min: 0,
        max: 1000
    },
    scale_decay: {
        val: 0.25,
        min: 0,
        max: 1,
        step: 0.01
    },
    opacity_decay: {
        val: 1,
        min: 0,
        max: 1,
        step: 0.01
    },
    speed: {
        val: 0.25,
        min: 0,
        max: 5,
        step: 0.01
    },
    gravity: {
        val: 0.0025,
        min: 0,
        max: 0.01,
        step: 0.0001
    },
    gravitydirection: {
        val: 3 * Math.PI / 2,
        min: 0,
        max: Math.PI * 2,
        step: 0.01
    },
});