let planet_layer, main_layer, interactive_layer, text_layer;
let natural, flat, kapelle;
let canvases;

function makeCanvas(w, h, z_index) {
    const func = (p) => {
        p.setup = () => {
            const c = p.createCanvas(w, h).parent("menu");
            c.position(8, 8);
            c.style("z-index", z_index);
        }
    }
    return new p5(func);
}

function setup() {
    natural = loadImage("res/natural.png");
    flat = loadImage("res/flat.png");
    kapelle = loadImage("res/sixtinische-kapelle.png");

    const W = windowWidth;
    const H = 950;

    createCanvas(W, H).parent("menu");
    main_layer = this;
    planet_layer = makeCanvas(W, H, 1);
    text_layer = makeCanvas(W, H, 2);
    interactive_layer = makeCanvas(W, H, 3);
    text_layer.background(255, 255, 255, 150);
    text_layer.noStroke();
    planet_layer.noStroke();
    canvases = [this, interactive_layer, planet_layer, text_layer]
    canvases.forEach((layer) => {
        layer.textFont("EB Garamond")
        layer.textSize(28);
        const scale = windowWidth / W;
        console.log("Scale", scale);
        //layer.canvas.style.transform = `scale(${1})`;
    })
}

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

async function loadPage(file, elementId='content') {
    const response = await fetch(file);
    const html = await response.text();
    document.getElementById(elementId).innerHTML = html;
}

const ORIGIN_Y = 500;

const PI = 3.14159;
const d_radius = 0.5;
const d_angle = 0.02;
const global_speed = 5;
const COLORFUL = false;
const MAX_RADIUS = 495;
const DEPTH = 4;
const SCALE_PER_LAYER = 0.5;
const MENU_OFFSET = 0;

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
    hue: 128, saturation: 128, color: 120
}]);

let planets = new Set([]);
let last_spawn_time = 0;
const spawn_interval = 15000;
const planet_speed = 0.1;
const notehead_size = 12;
const notehead_rotation = -PI / 8;
const planet_spawn_time = 300;
add_planet([256, 256, 128]);

const spawn_angles = [
    { angle: 2.75 * PI, rotate: 0, name: "Concert Lectures", offset_y: 1, color: [255, 0, 0], url: "pages/concerts.html" }, //Concert Lectures: 
    { angle: 3.25 * PI, rotate: PI / 2, name: "Lebensunterricht", offset_y: -1, color: [0, 255, 0], url: "pages/unterricht.html" }, //Unterpunkte: Coaching, Instrumentalunterricht 
    { angle: 3.75 * PI, rotate: PI, name: "Akademische Lehre", offset_y: -1, color: [0, 0, 255], url: "pages/lehre.html" }, //Vorlesungen, Seminare
    { angle: 4.25 * PI, rotate: -PI / 2, name: "Think Tank", offset_y: 1, color: [0, 255, 255], url: "pages/think-tank.html" } //
];

//Stichwörter einblenden, wenn hover

const clef_dx = points[points.length - 1].x - points[0].x;
const clef_dy = points[points.length - 1].y - points[0].y;

let t = 0; let frame_rate = 60;

let links = [];

const BLACK = 50;

const LINK_RADIUS = 240;

function accent(opacity = 100) {
    return color([20, 100, 0, opacity]);
}

const BACH = [
    { angle: PI, y: -14, text: "A", text_offset: -10, textStyle: "italic", fontFamily: "serif" },
    { angle: 2 * PI, y: -42, accidental: null, text: "Complete", text_offset: 55 },
    { angle: 3 * PI, y: -28, accidental: null, accidental: () => flat, scale: 0.12, offset_y: -9, offset_x: -7, text: "BE", text_offset: -20, color: 'green' },
    { angle: 4 * PI, y: -28, accidental: () => natural, scale: 0.05, offset_y: 0, offset_x: -12, text: "Human", text_offset: 50, color: 'pink' }
];

function dist(cx, cy, x, y) {
    const dx = x - cx;
    const dy = y - cy;
    return sqrt(dx * dx + dy * dy)
}

function mouseMoved() {
    if (!interactive_layer) return;
    interactive_layer.clear();
    links.forEach((link) => {
        const d = dist(link.x, link.y, mouseX, mouseY);
        let text_color, bg_color;
        if (d < link.radius / 2) {
            if (link.name != "Fundament") {
                interactive_layer.stroke(BLACK);
                for (let i = -3; i <= 1; i++) {
                    const y = link.y + i * 16;
                    interactive_layer.stroke(150);
                    interactive_layer.line(link.x - 80, y, link.x + 80, y);
                }
            }
            text_color = BLACK;
            bg_color = accent(40);
        } else {
            text_color = 'white';
            bg_color = accent();
        }

        //interactive_layer.fill(color(link.color.concat([50])));
        interactive_layer.fill(color(bg_color));
        if (!link.current) {
            interactive_layer.stroke(accent());
        } else {
            interactive_layer.stroke(BLACK);
        }
        interactive_layer.ellipse(link.x, link.y - 10, link.radius, link.radius);

        interactive_layer.fill(text_color);
        interactive_layer.noStroke();
        interactive_layer.textSize(30);
        const x = link.x - interactive_layer.textWidth(link.name) / 2;
        interactive_layer.text(link.name, x, link.y + link.offset_y);
    })
}

function mousePressed() {
    links.forEach((link) => {
        const d = dist(link.x, link.y, mouseX, mouseY);
        if (d < link.radius / 2) {
            openPage(link);   
        }
    })
}

async function openPage(link) {
    await loadPage(link.url);
    links.forEach(link => link.current = false);
    link.current = true;
    window.scrollBy({top: 500, behavior: "smooth"})
    mouseMoved();
} 

let background_drawn = false;

function loadWelcome() {
    loadPage("pages/welcome.html");
    links.forEach(link => link.current = false);
    mouseMoved();
}

loadWelcome();


function draw() {
    if (!background_drawn && kapelle.width > 1) {
        //main_layer.image(kapelle, 0, 0, width, kapelle.height * (width / kapelle.width));
        background_drawn = true;
    }

    fill(0); stroke(0);
    t += global_speed

    const alpha = ((t - 200) / 100) ** 3 + 2;
    if (t % 10 == 0 && alpha < 256 && t < 600) {
        main_layer.strokeWeight(2.5);
        for (let i = -3; i <= 1; i++) {
            main_layer.stroke(BLACK, BLACK, BLACK, alpha);
            const y = ORIGIN_Y + i * 28;
            main_layer.line(0, y, width, y);
        }
    }
    const content = document.getElementById("content");
    content.style.opacity = clamp(t / 1000, 0, 1);
    
    if (t >= planet_spawn_time) {
        current.forEach((o) => {
            main_layer.push();
            main_layer.translate(width / 2 + o.start_x, o.start_y + ORIGIN_Y);
            if (o.depth == 1 && o.text_drawn == false) {
                links.push({
                    current: false, name: o.name, url: o.url,
                    x: width / 2 + o.start_x, y: o.start_y + ORIGIN_Y, offset_y: o.offset_y,
                    color: o.highlight_color, radius: LINK_RADIUS
                });
                o.text_drawn = true;
                mouseMoved();
            }
            //rotate(o.rotate);
            if (COLORFUL) {
                main_layer.stroke(o.hue + (255 - o.saturation), (255 - o.hue) + (255 - o.saturation), 255 - o.saturation, o.opacity);
                o.hue = clamp(o.hue + rand2(10) + 0.06, 50, 180);
                o.saturation = clamp(o.saturation + rand2(10) + 0.05, 100, 255);
            } else {
                main_layer.stroke(o.color, o.color, o.color, o.opacity);
                o.color = clamp(o.color + rand2(30), 0, 150);
            }

            if (o.angle > PI && links.length == 0) {
                links.push({
                    current: false, name: "Fundament", url: "pages/fundament.html",
                    x: width / 2, y: ORIGIN_Y - 5, offset_y: 0,
                    color: 'black', radius: 270
                });
                mouseMoved();
            }

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
            } else if ((o.radius < MAX_RADIUS * (o.scale ** 1.4) || o.angle < 4.25 * PI) && o.opacity > 0) {
                let r = o.radius;
                const prev_x = r * cos(o.angle);
                const prev_y = r * sin(o.angle);
                o.angle += d_angle * o.step * global_speed;
                o.radius += d_radius * o.step * global_speed / ((o.radius + 1) ** o.radius_pow);
                r = o.radius;
                const new_x = r * cos(o.angle);
                const new_y = r * sin(o.angle);
                o.spiral_width = clamp(o.spiral_width + rand2(1), 2, 8);
                main_layer.strokeWeight(o.spiral_width * o.scale);
                main_layer.line(prev_x + o.x, prev_y + o.y - o.initial_radius, new_x + o.x, new_y + o.y - o.initial_radius);
                o.opacity = o.opacity + o.d_opacity * global_speed;

                spawn_angles.forEach((spawn_angle, idx) => {
                    if (!o.removed_indices.includes(idx) && Math.abs(spawn_angle.angle - o.angle) <= d_angle * o.step * global_speed / 2 && o.depth < DEPTH) {
                        current.add({
                            start_x: o.x + new_x + o.start_x, start_y: o.start_y + new_y + o.y - o.initial_radius,
                            initial_radius: o.initial_radius * SCALE_PER_LAYER,
                            x: 0, y: 0, scale: o.scale * SCALE_PER_LAYER, angle: PI / 2, radius: o.initial_radius * SCALE_PER_LAYER, i: 1,
                            radius_pow: o.radius_pow + 0.25,
                            d_opacity: -0.6 * o.scale, start_opacity: o.start_opacity / 2, opacity: o.start_opacity / 2,
                            step: o.step + 2, clef_step: o.clef_step + 2, depth: o.depth + 1,
                            rotate: o.rotate + spawn_angle.rotate,
                            hue: o.hue, saturation: o.saturation, color: o.color, url: spawn_angle.url,
                            text_drawn: false, name: spawn_angle.name, offset_y: spawn_angle.offset_y, highlight_color: spawn_angle.color,
                            removed_indices: o.removed_indices//.concat([Math.floor(Math.random() * 6)]),
                        })
                    }
                })

                BACH.forEach((a) => {
                    if (o.depth == 0 && abs(o.angle - a.angle) < d_angle * o.step * global_speed / 2) {
                        text_layer.push()
                        text_layer.translate(width / 2 + o.start_x, o.start_y + ORIGIN_Y);
                        text_layer.translate(new_x + o.x, a.y);
                        if (a.accidental != null) {
                            const img = a.accidental();
                            text_layer.imageMode(CENTER);
                            text_layer.image(img, -img.width * a.scale + a.offset_x, a.offset_y, img.width * a.scale, img.height * a.scale);
                        }
                        text_layer.fill(accent(255));
                        text_layer.textSize(40);
                        let x = -text_layer.textWidth(a.text) / 2 + a.text_offset;
                        if (a.textStyle) {
                            text_layer.textStyle(a.textStyle)
                        } else {
                            text_layer.textStyle('bold');
                        }
                        if (a.fontFamily) {
                            text_layer.textFont(a.fontFamily);
                            console.log(a.fontFamily);
                        } else {
                            text_layer.textFont('EB Garamond');
                        }
                        text_layer.text(a.text[0], x, -95 - a.y);
                        x += text_layer.textWidth(a.text[0]);
                        text_layer.textStyle('normal');
                        if (a.text == "BE") {
                            text_layer.textSize(25);
                        }
                        text_layer.text(a.text.slice(1), x, -95 - a.y);

                        text_layer.rotate(-PI / 8)
                        text_layer.fill(10);
                        text_layer.ellipse(0, 0, 30, 30 * 0.75);
                        text_layer.pop();
                    }
                }); //living concerts, concertified lectures
            } else {
                current.delete(o);
            }
            main_layer.pop();
        })
    }

    planet_layer.clear();
    //planet_layer.text(frame_rate.toFixed(1) + " FPS", width / 2, 200)

    planets.forEach((p) => {
        planet_layer.push();
        planet_layer.translate(width / 2 + p.start_x, p.start_y + ORIGIN_Y);
        if (p.i < 0) {
            const prog = (p.i + planet_spawn_time) / planet_spawn_time;
            p.rotation = notehead_rotation * prog;
            p.size = prog * notehead_size;
            p.squish = 1 - (prog * 0.25);
            p.i = Math.round(p.i + global_speed);
        } else if (p.i < points.length) {
            p.x = (points[p.i].x - points[0].x) * p.scale;
            p.y = (points[p.i].y - points[0].y) * p.scale;
            p.i = Math.round(p.i + global_speed * planet_speed);
        } else if (p.radius < MAX_RADIUS * (p.scale ** 1.4)) {
            p.rotate += PI / 48;
            p.angle += d_angle * planet_speed * global_speed;
            p.radius += d_radius * planet_speed * global_speed / ((p.radius + 1) ** p.radius_pow);
            p.opacity -= 0.35 * planet_speed * global_speed * p.scale; 
            //o.step -= 0.003;
            p.x = p.radius * cos(p.angle) + (clef_dx * p.scale);
            p.y = p.radius * sin(p.angle) + (clef_dy * p.scale) - p.initial_radius;
            spawn_angles.forEach((spawn_angle) => {
                if (Math.abs(spawn_angle.angle - p.angle) <= d_angle * planet_speed * global_speed / 2 && p.scale > (0.5 ** DEPTH) && Math.random() < 0.5) {
                    //console.log("spawning");
                    planets.add({
                        start_x: p.x + p.start_x, start_y: p.start_y + p.y,
                        initial_radius: p.initial_radius / 2,
                        x: 0, y: 0, size: p.size / 1.4, rotation: notehead_rotation, squish: 0.75,
                        angle: PI / 2, radius: p.initial_radius / 2, i: 0,
                        radius_pow: p.radius_pow + 0.25, scale: p.scale / 2,
                        rotate: p.rotate + spawn_angle.rotate, color: p.color, opacity: p.opacity
                    })
                }
            })
        } else {
            planets.delete(p);
        }
        if (COLORFUL) {
            planet_layer.stroke(p.color[0], p.color[1], p.color[2], p.opacity);
            planet_layer.fill(p.color[0], p.color[1], p.color[2], p.opacity);
        } else {
            planet_layer.stroke(0, 0, 0, p.opacity);
            planet_layer.fill(0, 0, 0, p.opacity);
        }
        planet_layer.translate(p.x, p.y);
        const stem_h = clamp(p.i / 10, 0, 33);
        //planet_layer.rotate(o.rotate);
        planet_layer.line(p.size / 2, 0, p.size / 2, -stem_h * (p.size / notehead_size));
        planet_layer.rotate(p.rotation);
        planet_layer.ellipse(0, 0, p.size, p.size * p.squish);
        planet_layer.pop();
    });

    if (Math.random() < 0.002 && Date.now() - last_spawn_time >= spawn_interval) {
        add_planet();
    }

    if (t % 60 == 0) {
        frame_rate = frameRate();
    }
}


function add_planet(color) {
    if (!color) {
        const hue = rand(50, 180);
        const saturation = rand(100, 255);
        color = [hue + (255 - saturation), (255 - hue) + (255 - saturation), (255 - saturation)];
    }
    last_planet_color = color;
    last_spawn_time = Date.now();
    planets.add({
        i: -planet_spawn_time, start_x: 0, start_y: 0, x: 0, y: 0,
        scale: 1, radius: 100, initial_radius: 100, angle: PI / 2,
        depth: 0, rotate: 0, squish: 1,
        hue: 128, saturation: 128, step: 1, radius_pow: 0, opacity: 256,
        color: last_planet_color
    })
}

/*

- bezug zum klavier???
- schwarze tasten in den notenlinien

- farben: schwarz/bunt?
- symmetrisch/asymmetrisch - kein dazwischen?
- am anfang: rosa, licht durch haut
- urknall am anfang vor dem punkt

- 3-Menü Punkte + Basis 
- scrollen => Menü wird kleiner, Inhalte erscheinen

- Zusammenhang mit Mathematik in den Vordergrund rücken

- sixtinische kapelle im hintergrund, den rest schwarz

- Klavier tasten an beiden Seiten

- weniger herunterskalieren pro ebene => mehr überlappungen

- f(x) = A => f'(x) = 0 -> omega

- noten schnell ausfaden, langsamer
- subtiler

- fundament in der mitte in grau
- 4 weitere punkte: einzelunterricht - kritiken - kontakt-formular, think tank - blog - instagram, akademische lehre - LinkedIn - vita, concert lectures - konzertkalender - YouTube - TikTok, Instagram 
- irgendwas mathematisches
*/