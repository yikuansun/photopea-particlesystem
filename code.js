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
            newParticle.texture = particle_settings.texture;
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
                particle.x += forces.gravity / 100 * Math.cos(forces.gravitydirection) * (particle_settings.lifespan - particle.lives_left);
                particle.y += forces.gravity / 100 * Math.sin(forces.gravitydirection) * (particle_settings.lifespan - particle.lives_left);
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

async function render_output(particles_array, texture) {
    var texture_uri = await getdataurl(`https://yikuansun.github.io/photopea-particlesystem/default_textures/${texture}.png`);
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
    var wh = emitter_settings.particleWidth * (1 + (rng() - 0.5) * emitter_settings.scale_variance);
    var particle = {
        x: emitter_settings.startX,
        y: emitter_settings.startY,
        w: wh,
        h: wh,
        opacity: emitter_settings.particleOpacity,
        angle: emitter_settings.angle + (rng() - 0.5) * emitter_settings.angle_variance
    }
    return particle;
}

async function drawFromInputs() {
    var inputData = {
        startX: parseFloat(document.querySelector("#startX").value),
        startY: parseFloat(document.querySelector("#startY").value),
        particleSize: parseFloat(document.querySelector("#particleSize").value),
        particleOpacity: parseFloat(document.querySelector("#particleOpacity").value),
        angle: parseFloat(document.querySelector("#angle").value),
        angle_variance: parseFloat(document.querySelector("#angle_variance").value),
        scale_variance: parseFloat(document.querySelector("#scale_variance").value),
        period: parseFloat(document.querySelector("#period").value),
        seed: parseFloat(document.querySelector("#seed").value),
        frames: parseFloat(document.querySelector("#frames").value),
        lifespan: parseFloat(document.querySelector("#lifespan").value),
        scale_decay: parseFloat(document.querySelector("#scale_decay").value),
        opacity_decay: parseFloat(document.querySelector("#opacity_decay").value),
        speed: parseFloat(document.querySelector("#speed").value),
        gravity: parseFloat(document.querySelector("#gravity").value),
        gravitydirection: parseFloat(document.querySelector("#gravitydirection").value),
    };


    return new Promise(function(resolve, reject) {
        render_output(run_simulation(
            {
                startX: inputData.startX,
                startY: inputData.startY,
                particleWidth: inputData.particleSize,
                particleHeight: inputData.particleSize,
                particleOpacity: inputData.particleOpacity,
                angle: inputData.angle,
                angle_variance: inputData.angle_variance,
                scale_variance: inputData.scale_variance,
                period: inputData.period,
                seed: inputData.seed
            },
            inputData.frames,
            {
                lifespan: inputData.lifespan,
                scale_decay: inputData.scale_decay,
                opacity_decay: inputData.opacity_decay,
                speed: inputData.speed
            },
            {
                gravity: inputData.gravity,
                gravitydirection: inputData.gravitydirection
            }
        ), document.querySelector("#texture").value).then(async function(data) {
            document.querySelector("#preview").src = data;
            resolve(inputData);
        });
    });
}

function makePanel(inputs) {
    for (var id in inputs) {
        var br = document.createElement("br");
        document.querySelector("#controlpanel").appendChild(br);
        var nametag = document.createElement("div");
        nametag.style.display = "inline-block";
        nametag.style.width = "150px";
        nametag.innerText = inputs[id].name;
        document.querySelector("#controlpanel").appendChild(nametag);
        var input = document.createElement("ADVANCED-SLIDER");
        document.querySelector("#controlpanel").appendChild(input);
        input.id = id;
        input.min = inputs[id].min;
        input.max = inputs[id].max;
        input.value = inputs[id].val;
        input.numberElement.style.width = "69px";
        input.addEventListener("input", drawFromInputs);
        input.addEventListener("change", function() {
            drawFromInputs().then(function(data) {
                Photopea.runScript(window.parent, `app.activeDocument.activeLayer.remove();`);
                Photopea.runScript(window.parent, `app.open("${document.querySelector("#preview").src}", null, true);`);
            });
        });
        if (inputs[id].step) input.step = inputs[id].step;
    }
    document.querySelector("#texture").addEventListener("input", drawFromInputs);
    document.querySelector("#texture").addEventListener("change", function() {
        drawFromInputs().then(function(data) {
            Photopea.runScript(window.parent, `app.activeDocument.activeLayer.remove();`);
            Photopea.runScript(window.parent, `app.open("${document.querySelector("#preview").src}", null, true);`);
        });
    });
}

makePanel({
    startX: {
        name: "Origin X",
        val: doc_dimensions.width / 2,
        min: 0,
        max: doc_dimensions.width
    },
    startY: {
        name: "Origin Y",
        val: doc_dimensions.height / 2,
        min: 0,
        max: doc_dimensions.height
    },
    particleSize: {
        name: "Particle Size",
        val: 25,
        min: 0,
        max: 100
    },
    particleOpacity: {
        name: "Particle Opacity",
        val: 1,
        min: 0,
        max: 1,
        step: 0.01
    },
    angle: {
        name: "Emitter Angle",
        val: 3 * Math.PI / 2,
        min: 0,
        max: Math.PI * 2,
        step: 0.01
    },
    angle_variance: {
        name: "Angle Variance",
        val: Math.PI / 2,
        min: 0,
        max: Math.PI * 2,
        step: 0.01
    },
    scale_variance: {
        name: "Size Variance",
        val: 1.2,
        min: 0,
        max: 3,
        step: 0.01
    },
    period: {
        name: "Emitter Period",
        val: 5,
        min: 0,
        max: 10
    },
    seed: {
        name: "Random Seed",
        val: 69,
        min: 0,
        max: 101010
    },
    frames: {
        name: "Frame",
        val: 500,
        min: 0,
        max: 1000
    },
    lifespan: {
        name: "Particle Lifespan",
        val: 500,
        min: 0,
        max: 1000
    },
    scale_decay: {
        name: "Size Decay",
        val: 1,
        min: 0,
        max: 1,
        step: 0.01
    },
    opacity_decay: {
        name: "Opacity Decay",
        val: 1,
        min: 0,
        max: 1,
        step: 0.01
    },
    speed: {
        name: "Particle Speed",
        val: 0.25,
        min: 0,
        max: 5,
        step: 0.01
    },
    gravity: {
        name: "Gravity",
        val: 0.25,
        min: 0,
        max: 1,
        step: 0.01
    },
    gravitydirection: {
        name: "Gravity Direction",
        val: Math.PI / 2,
        min: 0,
        max: Math.PI * 2,
        step: 0.01
    },
});

drawFromInputs().then(function(data) {
    Photopea.runScript(window.parent, `app.open("${document.querySelector("#preview").src}", null, true);`);
});