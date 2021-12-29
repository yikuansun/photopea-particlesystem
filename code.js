const doc_dimensions = {
    width: parseFloat((new URLSearchParams(location.search)).get("docWidth")),
    height: parseFloat((new URLSearchParams(location.search)).get("docHeight"))
};

if (isNaN(doc_dimensions.width) || isNaN(doc_dimensions.height)) location.replace("index.html");

function run_simulation(emitter_settings, frames, particle_settings, forces) {
    var particles_array = [];
    var rng = new Math.seedrandom(emitter_settings.seed); 
    for (var i = 0; i < frames; i++) {
        if (i % Math.floor(emitter_settings.period) == 0) {
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

async function drawFromInputs(inputData) {
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
        ), inputData.texture).then(async function(data) {
            document.querySelector("#preview").src = data;
            resolve(inputData);
        });
    });
}

var inputsObj = {
    texture: "circle_05",
    startX:  doc_dimensions.width / 2,
    startY: doc_dimensions.height / 2,
    particleSize: 25,
    particleOpacity: 1,
    angle: 3 * Math.PI / 2,
    angle_variance: Math.PI / 2,
    scale_variance: 1.2,
    period: 5,
    seed: 69,
    frames: 500,
    lifespan: 500,
    scale_decay: 1,
    opacity_decay: 1,
    speed: 0.25,
    gravity: 0.25,
    gravitydirection: Math.PI / 2,
};
var gui = new dat.GUI();
var availTextures = [];
fetch("https://api.github.com/repos/yikuansun/photopea-particlesystem/contents/default_textures").then(function(x) {
    x.text().then(function(y) {
        var returnedObj = JSON.parse(y);
        for (var littleObj of returnedObj) {
            availTextures.push(littleObj.name.split(".png")[0]);
        }
        gui.add(inputsObj, "texture", availTextures);
    });
});
var emitterFolder = gui.addFolder("Emitter");
emitterFolder.add(inputsObj, "startX", 0, doc_dimensions.width);
emitterFolder.add(inputsObj, "startY", 0, doc_dimensions.height);
emitterFolder.add(inputsObj, "particleSize", 0, 100);
emitterFolder.add(inputsObj, "particleOpacity", 0, 1);
emitterFolder.add(inputsObj, "angle", 0, Math.PI * 2);
emitterFolder.add(inputsObj, "angle_variance", 0, Math.PI * 2);
emitterFolder.add(inputsObj, "scale_variance", 0, 3);
emitterFolder.add(inputsObj, "period", 0, 5);
emitterFolder.add(inputsObj, "seed", 0, 1111);
gui.add(inputsObj, "frames", 0, 1000);
var particleFolder = gui.addFolder("Particle");
particleFolder.add(inputsObj, "lifespan", 0, 1000);
particleFolder.add(inputsObj, "scale_decay", 0, 1);
particleFolder.add(inputsObj, "opacity_decay", 0, 1);
particleFolder.add(inputsObj, "speed", 0, 5);
var forcesFolder = gui.addFolder("Forces");
forcesFolder.add(inputsObj, "gravity", 0, 1);
forcesFolder.add(inputsObj, "gravitydirection", 0, Math.PI * 2);
var myControllers = gui.getRoot().__controllers;
for (var folder in gui.getRoot().__folders) {
    var myFolder = gui.getRoot().__folders[folder];
    myControllers = myControllers.concat(myFolder.__controllers);
}
for (var controller of myControllers) {
    controller.onChange(function() {
        drawFromInputs(inputsObj);
    });
    controller.onFinishChange(function() {
        drawFromInputs(inputsObj).then(async function(data) {
            await Photopea.runScript(window.parent, `app.activeDocument.activeLayer.remove();`);
            await Photopea.runScript(window.parent, `app.open("${document.querySelector("#preview").src}", null, true);`);
        });
    });
}
gui.show();
gui.open();
drawFromInputs(inputsObj).then(function(data) {
    Photopea.runScript(window.parent, `app.open("${document.querySelector("#preview").src}", null, true);`);
});