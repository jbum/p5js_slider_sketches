// these receive values from the external slider object
const { Engine, World, Bodies, Composite } = Matter;

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

let kWedgeFeedback = false;
let kUseRecursion = false;
let kRecursionLevels = 0;
let kRecursionScale = 0.66;

let kBigCircleRadius = kWidth * .04;
let kSmallCircleRadius = kWidth * .01;
let kNbrBalls = 200;
let kVisualRotate = true;
let kShowFrameRate = false;
let kShowColorFeedback = false;

class Ball {
    constructor(px, py, radius, color, pts) {
        this.x = px;
        this.y = py;
        this.r = radius;
        this.inner_r = random(this.r*.1, this.r);
        this.color = color;
        this.pts = pts;
        let options = {
            friction: 0.1,
            restitution: 0.6
        }
        this.body = Bodies.circle(this.x, this.y, this.r, options);
        Composite.add(world, this.body);
    }
    show(ctx) {
        let pos = this.body.position;
        let angle = this.body.angle;
        ctx.push();
        ctx.noStroke();
        ctx.fill(this.color);
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);
        ctx.rectMode(CENTER);
        ctx.strokeWeight(1);
        let innerRadius = this.inner_r;
        let outerRadius = this.r;
        let angleStep = 2 * PI / this.pts;
        ctx.beginShape();
        for (let i = 0; i < this.pts; i++) {
            let angle = i * angleStep;
            let x = cos(angle) * outerRadius;
            let y = sin(angle) * outerRadius;
            ctx.vertex(x, y);
            angle += angleStep/2;
            x = cos(angle) * innerRadius;
            y = sin(angle) * innerRadius;
            ctx.vertex(x, y); 
        }
        ctx.endShape(CLOSE);
        // ctx.ellipse(0, 0, this.r);
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
let kHuePeriod = 0;
let kSatPeriod = 0;
let kBriPeriod = 0;
const kMin_Period = 0;
const kMax_Period = 10;

// Randomized color gradients using randomized sin waves
//
//
function initialize_ball_colors() {
  kHuePhase = random(0, 2 * PI);
  kSatPhase = random(0, 2 * PI);
  kBriPhase = random(0, 2 * PI);
  kHuePeriod = map(pow(random(),2),0,1,kMin_Period, kMax_Period);
  kSatPeriod = map(pow(random(),2),0,1,kMin_Period, kMax_Period);
  kBriPeriod = map(random(),0,1,1, kMax_Period);
}

function get_ball_color(i, kNbrBalls) {
  let r = i / kNbrBalls;
  let hue = sin(r * kHuePeriod * PI + kHuePhase) * 128 + 128;
  let sat = sin(r * kSatPeriod * PI + kSatPhase) * 128 + 128;
  let bri = sin(r * kBriPeriod * PI + kBriPhase) * 128 + 128;
  colorMode(HSB, 255, 255, 255);
  let clr = color(hue, sat, bri);
  colorMode(RGB, 255, 255, 255);
  return clr;
}

function show_color_feedback() {
  push();
  let graph_width = width - 20;
  let graph_x = (width - graph_width) / 2;
  let graph_y = 10;
  let element_height = 50;
  let graph_height = element_height * 3;
  noStroke();
  fill(0, 0, 0, 128);
  rect(graph_x, graph_y, graph_width, graph_height);
  fill(255);
  let phases = [kHuePhase, kSatPhase, kBriPhase];
  let periods = [kHuePeriod, kSatPeriod, kBriPeriod];
  let labels = ["Hue", "Saturation", "Brightness"];
  for (let j = 0; j < graph_width; j += 1) {
    let clr = get_ball_color(j, graph_width);
    fill(clr);
    rect(graph_x + j, graph_y, 1, element_height*3);
  }
  for (let i = 0; i < 3; ++i) {
    let phase = phases[i];
    let period = periods[i];
    let label = labels[i];
    let oy = graph_y + element_height * i + element_height/2;
    let ox = graph_x;
    // plot appropriate sine wave along the graph , starting at graph_x, and going to graph_x + graph_width
    stroke(255);
    noFill();
    beginShape();
    for (let j = 0; j < graph_width; j += 1) {
      let r = j / graph_width;
      let v = sin(phase + r*2*PI*period) * element_height*.35;
      vertex(ox+j, oy+v);
    }
    endShape();
    fill(255);
    noStroke();
    textSize(12);
    text(label, ox, oy + 5);
  textAlign(RIGHT);
  text("Phase: " + nf(phase, 0, 2), ox + graph_width - 5, oy - 5);
  text("Period: " + nf(period, 0, 2), ox + graph_width - 5, oy + 10);
  textAlign(LEFT);

  }
  pop();
}

function setup_balls() {
    engine = Engine.create();
    console.log("engine gravity scale", engine.gravity.scale);

    world = engine.world;
  let nbr_boundaries = 24;
  let object_cell_radius = scopeRadius * 1.1;
  let circumference = 2 * PI * object_cell_radius;
  let boundary_div = 5 + circumference / nbr_boundaries;
  let boundary_thickness = 10;
  for (let i = 0; i < nbr_boundaries; ++i) {
    let angle = i * 2 * PI / nbr_boundaries;
    let x = width/2 + cos(angle) * object_cell_radius;
    let y = height/2 + sin(angle) * object_cell_radius;
    boundaries.push(new Boundary(x, y, boundary_div, boundary_thickness, angle+PI/2));
  }
  console.log("kNbrBalls", kNbrBalls);
  initialize_ball_colors();
  for (let i = 0; i < kNbrBalls; ++i) {
    let ang = random(0, 2 * PI);
    let dist = random(10, scopeRadius-10);
    let x = width/2 + cos(ang) * dist;
    let y = height/2 + sin(ang) * dist;
    let radius = map(pow(random(1), 2), 0, 1, kSmallCircleRadius, kBigCircleRadius);
    let pts = int(map(pow(random(1), 2), 0, 1, 4, 13));
    let clr = get_ball_color(i, kNbrBalls);
    balls.push(new Ball(x, y, radius, clr, pts));
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
  oc.filter(BLUR, kBlurAmt);
  // this makes a glow effect
  oc.blend(0, 0, objectCellWidth, objectCellHeight, -2, 2, objectCellWidth + 3, objectCellHeight - 5, ADD);
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
      kBlurAmt = map(value, 0, 1, 0, 20);
      break;
    case 2:
      kDarkenAmount = map(value, 0, 1, 0, 255);
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
      kRotationSpeed = map(value, 0, 1, 0,0.1);
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