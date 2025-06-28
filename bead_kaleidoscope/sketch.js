// these receive values from the external slider object
const { Engine, World, Bodies, Composite, Constraint } = Matter;

let engine;
let world;

let kWidth = 800;             // width of graphics
let kHeight = 800;            // height of graphics

let nbrSides = 7;

let scopeRadius = Math.floor(.4*kWidth)
let scopeMargin = 8;

let mirrorRadians = 0;
let adjustedMirrorRadians = 0;
let objectCellHeight = kWidth; 
let objectCellWidth = kHeight;

let objectCell, // objectCell contains the things the kaleidoscope is looking at
    compositeCell; // composite cell is used to contruct the kaleidoscope view -- only needed because of the recursion/feedback feature.

let usesMirrors = true;

// these vars control the particle animation in the object cell
let kBlurAmt = 3;
let kDarkenAmount = 164;
let kRotationSpeed = 0.01;
let kRotationAngle = 1.5707963268;

let kNbrRings = 150;
let kMinBeadRadius = kWidth * .01;
let kMaxBeadRadius = kWidth * .015;

let kWedgeFeedback = false;
let kUseRecursion = false;
let kRecursionLevels = 0;
let kRecursionScale = 0.66;
let kStiffness = 0.25;
let kVisualRotate = true;
let kShowFrameRate = false;
let kShowColorFeedback = false;

function get_modified_color(clr, desired_lum) {
  // convert clr to hsl, set l to desired_lum, convert back to rgb
  colorMode(HSL, 360, 1, 1);
  let h = hue(clr);
  let s = saturation(clr);
  let l = desired_lum;
  let new_clr = color(h, s, l);
  colorMode(RGB, 255, 255, 255);
  return new_clr;
}

class Ball {
    constructor(px, py, radius, color) {
        this.x = px;
        this.y = py;
        this.r = radius;
        this.color = color;
        this.dark_color = get_modified_color(color, 0.1);
        this.light_color = get_modified_color(color, 0.75);
        let options = {
            friction: 0.85,
            restitution: 0.0
        }
        this.body = Bodies.circle(this.x, this.y, this.r, options);
        Composite.add(world, this.body);
    }
    show(ctx) {
        let pos = this.body.position;
      ctx.push();
      ctx.ellipseMode(RADIUS);
        ctx.translate(pos.x, pos.y);
        ctx.noStroke();
        ctx.fill(this.color);
        ctx.ellipse(0, 0, this.r, this.r);
        ctx.noStroke();
        ctx.fill(this.light_color);
        ctx.ellipse(this.r/2, -this.r/2, this.r*.1, this.r*.1);
        ctx.pop();
    }
}
class Boundary {
    constructor(x, y, w, h, a) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        let options = {
            friction: 0,
            restitution: 0.6,
            angle: a,
            isStatic: true
        }
        this.body = Bodies.rectangle(this.x, this.y, this.w, this.h, options);
        Composite.add(world, this.body);
    }

    show(ctx) {
        let pos = this.body.position;
        let angle = this.body.angle;
        ctx.push();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);
        ctx.rectMode(CENTER);
        ctx.fill(0x25);
        ctx.noStroke();
        ctx.rect(0, 0, this.w, this.h);
        ctx.pop();
    }
}
let balls = [];
let boundaries = [];

let kHuePhase = 0;
let kSatPhase = 0;
let kBriPhase = 0;
let kHueFreq = 0;
let kSatFreq = 0;
let kBriFreq = 0;
const kMin_Freq = 0;
const kMax_Freq = 10;

function make_ring(nbr_balls, ball_radius, cx, cy, clr) {
  // console.log("make_ring", nbr_balls);
  let cluster_radius = ball_radius * 0.2 * nbr_balls;
  let cballs = [];
  let ring_spring_length = ball_radius * 2;
  let ball_angle = 2 * PI / nbr_balls;

  for (let i = 0; i < nbr_balls; ++i) {
    let r = i / nbr_balls;
    let x = cx + cos(i * ball_angle) * cluster_radius;
    let y = cy + sin(i * ball_angle) * cluster_radius;
    let ball = new Ball(x, y, ball_radius, clr);
    balls.push(ball);
    cballs.push(ball);
  }
  for (let i = 0; i < nbr_balls; ++i) {
    let constraint = Constraint.create({
      bodyA: cballs[i].body,
      bodyB: cballs[(i + 1) % nbr_balls].body,
      length: ring_spring_length,
      stiffness: kStiffness
    });
    Composite.add(world, constraint);
  }
}

function make_hub_ring(nbr_spokes, ball_radius, cx, cy, hub_color, spoke_color) {
  console.log("make_hub_ring", nbr_spokes);
  let spokes = [];
  let hub_ball = new Ball(cx, cy, ball_radius, hub_color);
  balls.push(hub_ball);

  let hub_radius = ball_radius * 2;
  let ball_angle = 2 * PI / nbr_spokes;
  let spring_length = dist(cos(0)*hub_radius, sin(0)*hub_radius, cos(ball_angle)*hub_radius, sin(ball_angle)*hub_radius);

  for (let i = 0; i < nbr_spokes; ++i) {
    let r = i / nbr_spokes;
    let x = cx + cos(r * 2 * PI) * ball_radius*2;
    let y = cy + sin(r * 2 * PI) * ball_radius*2;
    let ball = new Ball(x, y, ball_radius, spoke_color);
    balls.push(ball);
    spokes.push(ball);
  }
  for (let i = 0; i < nbr_spokes; ++i) {
    let constraint = Constraint.create({
      bodyA: spokes[i].body,
      bodyB: hub_ball.body,
      length: ball_radius*2,
      stiffness: kStiffness
    });
    Composite.add(world, constraint);
    let constraint2 = Constraint.create({
      bodyA: spokes[i].body,
      bodyB: spokes[(i+1)%nbr_spokes].body,
      length: spring_length,
      stiffness: kStiffness
    });
    Composite.add(world, constraint2);
  }
}

// Randomized color gradients using randomized sin waves
//
//
function initialize_ball_colors() {
  kHuePhase = random(0, 2 * PI);
  kSatPhase = random(0, 2 * PI);
  kBriPhase = random(0, 2 * PI);
  kHueFreq = map(pow(random(),2),0,1,kMin_Freq, kMax_Freq);
  kSatFreq = map(pow(random(),2),0,1,kMin_Freq, kMax_Freq);
  kBriFreq = map(random(),0,1,1, kMax_Freq);
}

function get_ball_color(i, tot) {
  let r = i / tot;
  let hue = sin(r * kHueFreq * PI + kHuePhase) * 128 + 128;
  let sat = sin(r * kSatFreq * PI + kSatPhase) * 128 + 128;
  let bri = sin(r * kBriFreq * PI + kBriPhase) * 32 + 128;
  colorMode(HSL, 255, 255, 255);
  let clr = color(hue, sat, bri);
  colorMode(RGB, 255, 255, 255);
  return clr;
}

function show_color_feedback() {
  push();
  let graph_width = width - 20;
  let graph_x = (width - graph_width) / 2;
  let element_height = 50;
  let graph_y = element_height;
  let graph_height = element_height * 3;
  noStroke();
  fill(0, 0, 0, 128);
  rect(graph_x, graph_y, graph_width, graph_height);
  fill(255);
  let phases = [kHuePhase, kSatPhase, kBriPhase];
  let freqs = [kHueFreq, kSatFreq, kBriFreq];
  let labels = ["Hue", "Saturation", "Brightness"];
  for (let j = 0; j < graph_width; j += 1) {
    let clr = get_ball_color(j, graph_width);
    fill(clr);
    rect(graph_x + j, graph_y-element_height, 1, element_height);
  }
  for (let i = 0; i < 3; ++i) {
    let phase = phases[i];
    let freq = freqs[i];
    let label = labels[i];
    let oy = graph_y + element_height * i + element_height/2;
    let ox = graph_x;
    // plot appropriate sine wave along the graph , starting at graph_x, and going to graph_x + graph_width
    stroke(128);
    // axis line
    line(ox, oy, ox + graph_width, oy);
    // sine wave
    stroke(255);
    strokeWeight(2);
    noFill();
    beginShape();
    for (let j = 0; j < graph_width; j += 1) {
      let r = j / graph_width;
      let v = -sin(phase + r*PI*freq) * element_height*.35;
      vertex(ox+j, oy+v);
    }
    endShape();
    fill(128);
    noStroke();
    textSize(12);
    text(label, ox, oy + 5);
    textAlign(RIGHT);
    text("Phase: " + nf(phase, 0, 2), ox + graph_width - 5, oy - 5);
    text("Freq: " + nf(freq, 0, 2), ox + graph_width - 5, oy + 10);
    textAlign(LEFT);

  }
  pop();
}

function setup_balls() {
    engine = Engine.create();
    engine.constraintIterations = 5;
    console.log("engine gravity scale", engine.gravity.scale);

    world = engine.world;
    let nbr_boundaries = 24;
    let object_cell_radius = scopeRadius * 1.1;
    let circumference = 2 * PI * object_cell_radius;
    let boundary_div = 5 + circumference / nbr_boundaries;
    let boundary_thickness = 20;
    for (let i = 0; i < nbr_boundaries; ++i) {
        let angle = i * 2 * PI / nbr_boundaries;
        let x = width/2 + cos(angle) * object_cell_radius;
        let y = height/2 + sin(angle) * object_cell_radius;
        boundaries.push(new Boundary(x, y, boundary_div, boundary_thickness, angle+PI/2));
    }
    console.log("kNbrRings", kNbrRings);
    initialize_ball_colors();

    let golden_ratio = (1 + sqrt(5)) / 2;
    let golden_angle = 2 * PI / golden_ratio;
    let max_hub_radius = kMaxBeadRadius * 2;
    let max_hub_area = PI * pow(max_hub_radius, 2);
    let cum_area = max_hub_area;


  for (let i = 0; i < kNbrRings; ++i) {
      let r = i / kNbrRings;
      let ang = i * golden_angle;
      let dist = sqrt(cum_area / PI);
      cum_area += max_hub_area;
      let x = width/2 + cos(ang) * dist;
      let y = height / 2 + sin(ang) * dist;
      let rad = map(pow(random(1),3),0,1,kMinBeadRadius, kMaxBeadRadius);
      if (random() < 0.66) {
          let bead_color = get_ball_color(i, kNbrRings);
          make_ring(int(random(3,5)), rad, x, y, bead_color);
        } else {  
          let hub_color = get_ball_color(i+random(kNbrRings), kNbrRings);
          let spoke_color = get_ball_color(i, kNbrRings);
          make_hub_ring(int(random(5,7)), rad, x, y, hub_color, spoke_color);
        }
    }
}

function setup_mirror() {
  mirrorRadians = 2 * PI / (nbrSides * 2);
  let pixelAngle = 1 / scopeRadius; // helps reduce visible seams by overlapping aliased edges
  adjustedMirrorRadians = mirrorRadians + pixelAngle*2;
    // wedgePG.endDraw();
}

// render the mirror shape - use the mirror button to see it
function myMask() {
  compositeCell.push();
  // compositeCell.rotate(rot_angle);
  let ox = 0, oy = 0;  // objectCell.height/2;
  let adjustedAngle = adjustedMirrorRadians; // helps reduce seams by adding a pixel to the outer angle
  compositeCell.beginShape();
  compositeCell.vertex(ox,oy);
  let beginAngle = -adjustedAngle / 2;
  let nbrDivs = 10;
  for (let i = 0; i <= nbrDivs; ++i) {
    let amt = i / nbrDivs;
    compositeCell.vertex(ox+cos(beginAngle+adjustedAngle*amt)*scopeRadius, oy+sin(beginAngle+adjustedAngle*amt)*scopeRadius);

  }
  // curveVertex(scopeRadius, 0);
  // curveVertex(cos(mirrorRadians*.5)*scopeRadius, sin(mirrorRadians*.5)*scopeRadius);
  // curveVertex(cos(mirrorRadians)*scopeRadius, sin(mirrorRadians)*scopeRadius);
  // curveVertex(cos(mirrorRadians)*scopeRadius, sin(mirrorRadians)*scopeRadius);
  compositeCell.endShape(CLOSE);
  compositeCell.pop();
}

function DrawCell(oc) {
  oc.background(0, 0, 0, kDarkenAmount);
  oc.ellipseMode(RADIUS);


  engine.gravity.x = cos(kRotationAngle);
  engine.gravity.y = sin(kRotationAngle);


  Engine.update(engine);
  for (let i = 0; i < balls.length; i++) {
    balls[i].show(oc);
  }
  for (let i = 0; i < boundaries.length; i++) {
    boundaries[i].show(oc);
  }

  kRotationAngle += kRotationSpeed;



  oc.push();
  oc.translate(width / 2, height / 2);
  // old drawing went here...
  oc.pop();
  // this provides a blur effect
  if (kBlurAmt >= 1/20) { 
    oc.filter(BLUR, kBlurAmt);
  }
  // this makes a glow effect
  // oc.blend(0, 0, objectCellWidth, objectCellHeight, -2, 2, objectCellWidth + 3, objectCellHeight - 5, ADD);
  // gravity feedback
  if (!usesMirrors) {
    oc.push();
    oc.translate(width / 2, height / 2);
    oc.stroke(255, 255, 255);
    let line_length = 100000 * engine.gravity.scale;
    let lx = engine.gravity.x * line_length;
    let ly = engine.gravity.y * line_length;
    oc.line(0, 0, lx, ly);
    let angle = atan2(ly, lx);
    let arrow_length = 10;
    let arrow_angle = PI*4/5;
    oc.line(lx, ly, lx + cos(angle + arrow_angle) * arrow_length, ly + sin(angle + arrow_angle) * arrow_length);
    oc.line(lx, ly, lx + cos(angle - arrow_angle) * arrow_length, ly + sin(angle - arrow_angle) * arrow_length);
    oc.pop();
  }
}

function setup() {
  let min_window_dimension = Math.min(windowWidth, windowHeight);
  myCanvas = createCanvas(kWidth, kWidth, document.getElementById('sketch-canvas'));
  compositeCell = createGraphics(kWidth, kWidth);
  background(0);
  frameRate(60); // desired frame rate

  objectCellWidth = width;
  objectCellHeight = height;
  objectCell = createGraphics(objectCellWidth, objectCellHeight);


  ellipseMode(RADIUS);
  setup_mirror();
  setup_balls();
  last_millis = millis();
}

// we use a queue to manage incoming slider values, because slider_hook is not in p5.js context when called.
let slider_queue = [];
function slider_hook(slider_index, value) {
  slider_queue.push([slider_index, value]);
}

// this is called from our draw() function, and is in p5.js context
function empty_slider_queue() {
  // first in, first out
  while (slider_queue.length > 0) {
    let [slider_index, value] = slider_queue.shift();
    slider_hook_process(slider_index, value);
  }
}

// process incoming slider changes
function slider_hook_process(slider_index, value) {
  switch (slider_index) {
    case 0:
      let v = value * value;
      nbrSides = int(map(v, 0, 1, 3, 23));
      console.log("nbr sides = ", nbrSides)
      setup_mirror();
      break;
    case 1:
      kBlurAmt = map(value, 0, 1, 0, 10);
      break;
    case 2:
      kDarkenAmount = map(value, 1, 0, 0, 255);
      break;
    case 3:
      kRotationAngle = map(value, 0, 1, -PI,PI);
      break;
    case 4:
      kRecursionLevels = int(map(value, 0, 1, 0, 6));
      break;
    case 5:
      kRecursionScale = map(value, 0, 1, 0.1, 0.9);
      break;
    case 6:
      let kGravity = map(value, 0, 1, 0.00, 0.002);
      engine.gravity.scale = kGravity;
      break;
    case 7:
      kRotationSpeed = map(value, 0, 1, 0, 0.02);
      break;
  }
}

// we use a queue to manage incoming button values, because button_hook is not in p5.js context when called.
let button_queue = [];
function button_hook(index, value) {
  button_queue.push([index, value]);
}

// this is called from our draw routine, and is in p5.js context
function empty_button_queue() {
  // first in, first out
  while (button_queue.length > 0) {
    let [index, value] = button_queue.shift();
    button_hook_process(index, value);
  }
}

// process incoming button presses
function button_hook_process(index, value) {
  switch (index) {
    case 0:
      usesMirrors = !(value == 0);
      break;
    case 1:
      kWedgeFeedback = !(value == 0);
      break;
    case 2:
      kVisualRotate = !(value == 0);
      break;
    case 3:
      kShowFrameRate = !(value == 0);
      break;
    case 4:
      kShowColorFeedback = !(value == 0);
      break;
  }
}

// copies wedges from the objectCell to the compositeCell in a 2-mirror kaleidoscope pattern
// that rotates about the center
//
// alternate wedges are reflected by inverting the Y scaling
function applyMirrors()
{
  compositeCell.push();
  // compositeCell.rotate(rot_angle);
  for (let i = 0; i < nbrSides; ++i) {
    // for each reflection, there are two wedges copied (a normal one, and a reflected one)
    compositeCell.push();
    compositeCell.rotate(mirrorRadians * i * 2);
    compositeCell.push();
    compositeCell.clip(myMask);
    compositeCell.image(objectCell, -objectCell.width/2, -objectCell.height/2);
    compositeCell.pop();

    // every other wedge is inverted (reflected)
    compositeCell.rotate(mirrorRadians);
    compositeCell.scale(1, -1);
    compositeCell.push();
    compositeCell.clip(myMask);
    compositeCell.image(objectCell, -objectCell.width/2, -objectCell.height/2);
    compositeCell.pop();
    compositeCell.pop();
  }
  compositeCell.pop();

}
let average_fr = 0;
let fr_count = 0;
let fr_total = 0;

function draw() {
  empty_slider_queue(); // process incoming slider events
  empty_button_queue(); // process incoming button events

  DrawCell(objectCell); // draw object cell contents

  // begin rendering to composteCell
  compositeCell.background(0);
  compositeCell.push();
  compositeCell.translate(width/2, height/2);

  if (usesMirrors) {
    applyMirrors(); // copy the wedges from the object cell to the composite Cell
    // apply feedback passes, if any
    for (let i = 0; i < kRecursionLevels; ++i) {
      objectCell.image(compositeCell, objectCell.width * 3 / 4 - kWidth * kRecursionScale / 2, objectCell.height / 2 - kHeight * kRecursionScale / 2,
        kWidth * kRecursionScale, kHeight * kRecursionScale);
      applyMirrors();
    }
  } else {
    compositeCell.background(0);
    compositeCell.image(objectCell, -objectCell.width/2, -objectCell.height/2);
  }


  if (kWedgeFeedback) {
    // show the wedge shape itself
    compositeCell.push();
    // compositeCell.translate(10, 154);
    compositeCell.fill(0, 0, 255, 128);
    compositeCell.noStroke();
    myMask();
    compositeCell.pop();
  }
  compositeCell.pop(); // finish drawing

  // render compositeCell to screen, with rotation about the center
  push();
  background(0);
  translate(width / 2, height / 2);

  let kGravAngle = atan2(engine.gravity.y, engine.gravity.x);
  if (kVisualRotate) {  
    rotate(PI/2-kGravAngle);
  }

  // rotate(rot_angle);    // rotating of scope as a whole
  image(compositeCell, -kWidth/2, -kHeight/2);
  pop();
  let fr = frameRate();
  fr_total += fr;
  fr_count += 1;
  if (fr_count > 60) {
    average_fr = fr_total / fr_count;
    fr_total = 0;
    fr_count = 0;
  }
  if (kShowColorFeedback) {
    show_color_feedback();
  }
  if (kShowFrameRate) {
    pop();
    fill(255);
    textSize(16);
    let fr_str = average_fr.toFixed(1);
    text(fr_str, 10, 20);
    push();
  }
}


let small_size = 512;
let large_size = 900;

function toggle_sketch_size() {
  kWidth = kWidth === small_size ? large_size : small_size;
  kHeight = kWidth;
  resizeCanvas(kWidth, kHeight);
}

function keyPressed() {
  if (key === 'x' || key === 'X') { 
    toggle_slider_visibility();
  } else if (key === 's' || key === 'S') {
    toggle_sketch_size();
  } else if (key === 'm') {
    usesMirrors = !usesMirrors;
    console.log("MIRRORS " + (usesMirrors ? "ON" : "OFF"));
  } else if (key >= '2' && key <= '9') {
    nbrSides = key - '0';
    setup_mirror();
  } else if (key >= 'a' && key <= 'l') {
    nbrSides = 10 + key.charCodeAt(0) - 'a'.charCodeAt(0);
    console.log("nbr sides = ", nbrSides)
    setup_mirror();
  }
}