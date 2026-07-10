let planet_layer;
let main_layer;

const H = 1600; const W = 1600;

function setup() {
    createCanvas(H, W);
    main_layer = createGraphics(H, W);
    planet_layer = createGraphics(H, W);
    interactive_layer = createGraphics(H, W);
    planet_layer.noStroke();
    [main_layer, interactive_layer].forEach((layer) => {
        layer.textFont("EB Garamond")
        layer.textSize(20); main_layer.textStyle('regular'); 
    })
}

let i = 1;

function interpolate(samples, t) {
    if (t <= samples[0].t) return samples[0].value;
    if (t >= samples[samples.length - 1].t)
        return samples[samples.length - 1].value;

    for (let i = 0; i < samples.length - 1; i++) {
        let a = samples[i];
        let b = samples[i + 1];

        if (t >= a.t && t <= b.t) {
            let u = (t - a.t) / (b.t - a.t);
            return lerp(a.value, b.value, u);
        }
    }
}

const PI = 3.14159;
const d_radius = 0.5;
const d_angle = 0.02;
const global_speed = 3;

function clamp(n, min, max) {
    if (n > max) return max;
    if (n < min) return min;
    return n;
}

function square(n) { return n * n }

function rand(min, max) {
    return min + Math.random() * max;
}

function rand2(max) {
    return (Math.random() * max * 2) - max
}

let current = new Set([{
    d_opacity: 0, opacity: 256, start_opacity: 256,
    i: 1, start_x: 0, start_y: 0, x: 0, y: 0,
    scale: 1, angle: PI / 2, radius: 100, initial_radius: 100,
    spiral_width: 3, radius_pow: 0, step: 1, clef_step: 1, depth: 0, removed_indices: [], rotate: 0,
    hue: 128, saturation: 128
}]);

let planets = new Set([]);
add_planet();

const spawn_angles = [
    { angle: 2.75 * PI, rotate: 0, name: "Concert lectures" },
    { angle: 3.25 * PI, rotate: PI / 2, name: "Coaching" },
    { angle: 3.75 * PI, rotate: PI, name: "Klavierunterricht" },
    { angle: 4.25 * PI, rotate: -PI / 2, name: "Über mich" }
]

const clef_dx = points[points.length - 1].x - points[0].x;
const clef_dy = points[points.length - 1].y - points[0].y;
const planet_speed = 0.5;

let t = 0;

let links = [];

const LINK_RADIUS = 250;

function dist(cx, cy, x, y) {
    const dx = x - cx;
    const dy = y - cy;
    return sqrt(dx * dx + dy * dy)
}

function mouseMoved() {
    interactive_layer.clear();
    links.forEach((link) => {
        const d = dist(link.x, link.y, mouseX, mouseY);
        if (d < LINK_RADIUS / 2) {
            interactive_layer.fill(0, 0, 0, 20);
            interactive_layer.noStroke();
            interactive_layer.ellipse(link.x, link.y, LINK_RADIUS, LINK_RADIUS);
            interactive_layer.fill('blue');
            interactive_layer.text(link.name, link.x - 25, link.y + 10)
        }
    })
}

function mousePressed() {
    links.forEach((link) => {
        const d = dist(link.x, link.y, mouseX, mouseY);
        if (d < LINK_RADIUS / 2) {
            alert("Content not yet implemented...")
        }
    })
}

function draw() {
    fill(0); stroke(0);
    t += global_speed

    if (t < 200) {
        background('white');
        translate(width / 2, 500);
        rotate(PI / 12 * min(1, t / 50.0))
        ellipse(0, 0, t / 15, t / 15 - min(4, t / 50.0));
        return;
    }

    const alpha = ((t - 200) / 100) ** 3 + 2;
    if (t % 10 == 0 && alpha < 256) {
        main_layer.strokeWeight(2.5);
        for (let i = 0; i < 5; i++) {
            main_layer.stroke(0, 0, 0, alpha);
            const y = 405 + i * 32;
            main_layer.line(0, y, width, y);
        }
    }

    current.forEach((o) => {
        main_layer.push();
        main_layer.translate(width / 2 + o.start_x, o.start_y + 500);
        if (o.depth == 1 && o.text_drawn == false) {
            main_layer.noStroke();
            main_layer.text(o.name, 25, 0);
            o.text_drawn = true;
            links.push({name: o.name, url: o.url, x: width / 2 + o.start_x + 50, y: o.start_y + 500 - 10})
        }
        //rotate(o.rotate);
        main_layer.stroke(o.hue + (255 - o.saturation), (255 - o.hue) + (255 - o.saturation), 255 - o.saturation, o.opacity);
        o.hue = clamp(o.hue + rand2(10) + 0.05, 0, 255);
        o.saturation = clamp(o.saturation + rand2(10) + 0.05, 100, 255);
        if (o.i < points.length && o.opacity > 0) {
            const step = Math.round(max(o.step, min(5, sqrt(o.i) / 10))) * global_speed;
            for (let j = o.i; j < min(o.i + step, points.length); j += o.clef_step) {
                const dx = (points[j].x - points[j - 1].x) * o.clef_step;
                const dy = (points[j].y - points[j - 1].y) * o.clef_step;
                const w = interpolate(thickness, o.i) * o.scale;
                main_layer.strokeWeight(w * 1.5);
                main_layer.line(o.x, o.y, o.x + dx, o.y + dy);
                o.x += dx * o.scale; o.y += dy * o.scale;
            }
            o.i += step;
        } else if ((o.radius < 500 * (o.scale ** 1.4) || o.angle < 4.25 * PI) && o.opacity > 0) {
            let r = o.radius;
            const prev_x = r * cos(o.angle);
            const prev_y = r * sin(o.angle);
            o.angle += d_angle * o.step * global_speed;
            o.radius += d_radius * o.step * global_speed / ((o.radius + 1) ** o.radius_pow);
            r = o.radius;
            const new_x = r * cos(o.angle);
            const new_y = r * sin(o.angle);
            o.spiral_width += rand2(1);
            o.spiral_width = clamp(o.spiral_width, 1, 8);
            main_layer.strokeWeight(o.spiral_width * o.scale);
            main_layer.line(prev_x + o.x, prev_y + o.y - o.initial_radius, new_x + o.x, new_y + o.y - o.initial_radius);
            o.opacity = o.opacity + o.d_opacity * global_speed;

            spawn_angles.forEach((spawn_angle, idx) => {
                if (!o.removed_indices.includes(idx) && Math.abs(spawn_angle.angle - o.angle) <= d_angle * o.step * global_speed / 2 && o.scale > (0.5 ** 6)) {
                    current.add({
                        start_x: o.x + new_x + o.start_x, start_y: o.start_y + new_y + o.y - o.initial_radius,
                        initial_radius: o.initial_radius / 2,
                        x: 0, y: 0, scale: o.scale / 2.0, angle: PI / 2, radius: o.initial_radius / 2, i: 1,
                        radius_pow: o.radius_pow + 0.25,
                        d_opacity: -0.6 * o.scale, start_opacity: o.start_opacity / 2, opacity: o.start_opacity / 2,
                        step: o.step + 2, clef_step: o.clef_step + 2, depth: o.depth + 1,
                        rotate: o.rotate + spawn_angle.rotate,
                        hue: o.hue, saturation: o.saturation,
                        text_drawn: false, name: spawn_angle.name,
                        removed_indices: o.removed_indices//.concat([Math.floor(Math.random() * 6)]),
                    })
                }
            })
        } else {
            current.delete(o);
        }
        main_layer.pop();
    })
    
    planet_layer.clear();
    background('white');

    planets.forEach((o) => {
        planet_layer.push();
        planet_layer.translate(width / 2 + o.start_x, o.start_y + 500);
        if (o.i < points.length) {
            o.x = (points[o.i].x - points[0].x) * o.scale; 
            o.y = (points[o.i].y - points[0].y) * o.scale;
            o.i += global_speed;
        } else if (o.radius < 500 * (o.scale ** 1.4)) {
            o.angle += d_angle * planet_speed * global_speed;
            o.radius += d_radius * planet_speed * global_speed / ((o.radius + 1) ** o.radius_pow);
            //o.step -= 0.003;
            o.x = o.radius * cos(o.angle) + (clef_dx * o.scale);
            o.y = o.radius * sin(o.angle) + (clef_dy * o.scale) - o.initial_radius;  
            spawn_angles.forEach((spawn_angle) => {
                if (Math.abs(spawn_angle.angle - o.angle) <= d_angle * planet_speed * global_speed / 2 && o.scale > (0.5 ** 6) && Math.random() < 0.25) {
                    console.log("spawning");
                    planets.add({
                        start_x: o.x + o.start_x, start_y: o.start_y + o.y,
                        initial_radius: o.initial_radius / 2,
                        x: 0, y: 0, size: o.size / 1.4, angle: PI / 2, radius: o.initial_radius / 2, i: 0,
                        radius_pow: o.radius_pow + 0.25, scale: o.scale / 2,
                        rotate: o.rotate + spawn_angle.rotate, color: o.color
                    })
                }
            })  
        } else {
            planets.delete(o);
        }
        planet_layer.noStroke();
        planet_layer.fill(o.color[0], o.color[1], o.color[2]);
        planet_layer.ellipse(o.x, o.y, o.size, o.size);
        planet_layer.pop();
    });

    if (Math.random() < 0.005) {
        add_planet();    
    }

    image(main_layer, 0, 0);
    image(planet_layer, 0, 0);
    image(interactive_layer, 0, 0);
}

function add_planet() {
    planets.add({
        i: 0, start_x: 0, start_y: 0, x: 0, y: 0,
        scale: 1, radius: 100, initial_radius: 100, angle: PI / 2,
        depth: 0, rotate: 0, size: 12, 
        hue: 128, saturation: 128, step: 1, radius_pow: 0,
        color: [Math.random() * 255, Math.random() * 255, Math.random() * 255]
    })
}