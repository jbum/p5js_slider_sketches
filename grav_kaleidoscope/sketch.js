// these receive values from the external slider object
let values = [0, 0, 0, 0, 0, 0, 0, 0];
let button_values = [0, 0, 0, 0, 0, 0, 0, 0];

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
let kNbrDots = 512;
let kDotRadius = 12;
let kBlurAmt = 3;
let kDarkenAmount = 164;
let kSpeed = 0.00005;


let kWedgeFeedback = false;
let kUseRecursion = false;
let kRecursionLevels = 0;
let kRecursionScale = 0.66;
let rStart;
const oc_padding = 4; // object cell padding -- this helps reduce edge artifacts in the center and outer rim

let kBigCircleRadius = kWidth * .45;
let kSmallCircleRadius = kWidth * .02;
let kNbrBalls = 300;
let kDamp = 0.985;
let kGravity = 0.04;
let kStiffness = 0.002;
let kGrav_x = 1;
let kGrav_y = 0;

class Ball {
  constructor(px, py, vx, vy, radius, color) {
    this.px = px;
    this.py = py;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.radius = radius;
  }

  rotate_ball(angle) {
    let cur_ang = atan2(this.py, this.px);
    let cur_dist = dist(this.px, this.py, 0, 0);
    let new_ang = cur_ang + angle;
    let new_x = cur_dist * cos(new_ang);
    let new_y = cur_dist * sin(new_ang);
    
    // Rotate velocity vector as well
    let vel_ang = atan2(this.vy, this.vx);
    let vel_mag = sqrt(this.vx * this.vx + this.vy * this.vy);
    let new_vel_ang = vel_ang + angle;
    this.vx = vel_mag * cos(new_vel_ang);
    this.vy = vel_mag * sin(new_vel_ang);
    
    this.px = new_x;
    this.py = new_y;
  }
  
  movement_pass() {
    // Apply gravity
    this.vx += kGrav_x*kGravity;
    this.vy += kGrav_y*kGravity;
    
    // Update position
    this.px += this.vx;
    this.py += this.vy;
    
    // Check collision with circle boundary
    let distance_from_center = dist(this.px, this.py, 0, 0);
    let max_allowed_distance = kBigCircleRadius - this.radius;
    
    if (distance_from_center > max_allowed_distance) {
      // Ball is outside the boundary - push it back
      let nx = this.px / distance_from_center;
      let ny = this.py / distance_from_center;
      
      // Push ball back to boundary
      this.px = nx * max_allowed_distance;
      this.py = ny * max_allowed_distance;
      
      // Reflect velocity vector off the boundary
      let dot_product = this.vx * nx + this.vy * ny;
      this.vx = this.vx - 2 * dot_product * nx;
      this.vy = this.vy - 2 * dot_product * ny;
    }
    
    // Apply damping
    this.vx *= kDamp;
    this.vy *= kDamp;
  }
  draw(ctx)
  {
    ctx.push();
    ctx.noStroke();
    ctx.fill(this.color);
    ctx.ellipse(this.px, this.py, this.radius, this.radius);
    ctx.pop();
  }
}


let balls = [];
console.log("sketch");

class Spring {
  constructor(ball1, ball2, rest_length, k) {
    this.ball1 = ball1;
    this.ball2 = ball2;
    this.rest_length = rest_length;
    this.k = k;
  }
  draw(ctx) {
    ctx.push();
    ctx.stroke(255,0,0);
    ctx.line(this.ball1.px, this.ball1.py, this.ball2.px, this.ball2.py);
    ctx.pop();
  }
}

let springs = [];

function setup_balls() {
  let ang = 0;
  let dist = kBigCircleRadius - kSmallCircleRadius * 2;
  for (let i = 0; i < kNbrBalls; ++i) {
    let got_one = false;
    console.log("dist", dist,"ang", ang);
    let bx = cos(ang) * dist;
    let by = sin(ang) * dist;
    let circumference = 2 * PI * dist;
    ang += 2 * PI * kSmallCircleRadius * 2 / circumference;
    if (ang > 2 * PI) {
      ang = 0;
      dist -= kSmallCircleRadius * 2;
    }
    let bvx = random(-1, 1);
    let bvy = random(-1, 1);
    let bcol = color(random(255), random(255), random(255));
    balls.push(new Ball(bx, by, bvx, bvy, kSmallCircleRadius, bcol));
  }
  let ctr = 0;
  while (ctr < balls.length) {
    let ball1 = balls[ctr];
    let ball2 = balls[(ctr + 1) % balls.length];
    ctr += 1;
    if (ctr % 5 == 0) {
      continue;
    }
    let rest_length = kSmallCircleRadius*2.1;
    let k = kStiffness;
    springs.push(new Spring(ball1, ball2, rest_length, k));
  }
  console.log("balls", balls);
  last_rotation_time = millis();
}

function handle_springs() {
  for (let spring of springs) {
    let dx = spring.ball1.px - spring.ball2.px;
    let dy = spring.ball1.py - spring.ball2.py;
    let dist = sqrt(dx*dx + dy*dy);
    let force = spring.k * (dist - spring.rest_length);
    let nx = dx / dist;
    let ny = dy / dist;
    spring.ball1.vx -= force * nx;
    spring.ball1.vy -= force * ny;
    spring.ball2.vx += force * nx;
    spring.ball2.vy += force * ny;
  }
}

function handle_ball_collisions() {
  for (let i = 0; i < balls.length; ++i) {
    for (let j = i + 1; j < balls.length; ++j) {
      let ball1 = balls[i];
      let ball2 = balls[j];
      let dx = ball1.px - ball2.px;
      let dy = ball1.py - ball2.py;
      let dist = sqrt(dx*dx + dy*dy);
      let min_dist = ball1.radius + ball2.radius;
      
      if (dist < min_dist && dist > 0.001) {
        // Calculate normal vector
        let nx = dx / dist;
        let ny = dy / dist;
        
        // Separate overlapping balls more aggressively
        let overlap = min_dist - dist;
        let separation = overlap * 0.51; // Slightly more than half to prevent sticking
        ball1.px += nx * separation;
        ball1.py += ny * separation;
        ball2.px -= nx * separation;
        ball2.py -= ny * separation;
        
        // Calculate relative velocity
        let dvx = ball1.vx - ball2.vx;
        let dvy = ball1.vy - ball2.vy;
        
        // Calculate relative velocity along normal
        let dvn = dvx * nx + dvy * ny;
        
        // Only resolve if objects are moving towards each other
        if (dvn > 0) continue;
        
        // Coefficient of restitution (bounciness)
        let restitution = 0.8;
        
        // Calculate impulse magnitude
        let impulse_magnitude = -(1 + restitution) * dvn;
        
        // Apply collision response
        ball1.vx += impulse_magnitude * nx * 0.5;
        ball1.vy += impulse_magnitude * ny * 0.5;
        ball2.vx -= impulse_magnitude * nx * 0.5;
        ball2.vy -= impulse_magnitude * ny * 0.5;
      }
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
}

function DrawCell(oc) {
  oc.background(0, 0, 0, kDarkenAmount);
  for (let ball of balls) {
    ball.movement_pass();
  }
  handle_ball_collisions();
  handle_springs();

  oc.push();
  oc.translate(width/2, height/2);
  // oc.ellipse(0, 0, kBigCircleRadius, kBigCircleRadius)
  for (let ball of balls) {
    ball.draw(oc);
  }
  for (let spring of springs) {
    // spring.draw();
  }
  oc.pop();
  // this provides a blur effect
  oc.filter(BLUR, kBlurAmt);
  oc.blend(0, 0, objectCellWidth, objectCellHeight, -2, 2, objectCellWidth + 3, objectCellHeight - 5, ADD);
  // gravitry feedback
  // oc.stroke(255, 255, 255);
  // oc.line(width/2, height/2, width/2+kGrav_x*kBigCircleRadius/2, height/2+kGrav_y*kBigCircleRadius/2);
}

function setup() {
  let min_window_dimension = Math.min(windowWidth, windowHeight);
  myCanvas = createCanvas(kWidth, kWidth, document.getElementById('sketch-canvas'));
  compositeCell = createGraphics(kWidth, kWidth);
  background(0);

  objectCellWidth = width;
  objectCellHeight = height;
  objectCell = createGraphics(objectCellWidth, objectCellHeight);


  ellipseMode(RADIUS);
  setup_mirror();
  setup_balls();
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
  values[slider_index] = value;
  console.log("slider revieved ", slider_index, "value", value);
  switch (slider_index) {
    case 0:
      let v = value * value;
      nbrSides = int(map(v, 0, 1, 3, 23));
      console.log("nbr sides = ", nbrSides)
      setup_mirror();
      break;
    case 1:
      kNbrDots = map(value, 0, 1, 10, 2048);
      break;
    case 2:
      kDotRadius = map(value, 0, 1, 1, 20);
      kSmallCircleRadius = kDotRadius;
      for (let ball of balls) {
        ball.radius = kSmallCircleRadius;
      }
      break;
    case 3:
      kBlurAmt = map(value, 0, 1, 0, 20);
      break;
    case 4:
      kDarkenAmount = map(value, 0, 1, 0, 255);
      break;
    case 5:
      kSpeed = map(value, 0, 1, 0.00001, 0.0001);
      break;
    case 6:
      kRecursionLevels = int(map(value, 0, 1, 0, 6));
      break;
    case 7:
      rStart = map(value,0,1,30,60);
      break;
    case 8:
      kRecursionScale = map(value, 0, 1, 0.1, 0.9);
      break;
    case 10:
      kGravity = map(value, 0, 1, 0.001, 0.2);
      break;
    case 11:
      kDamp = map(value, 0, 1, 0.8, 0.999);
      break;
    case 12:
      rotation_speed = map(value, 0, 1, 0,30)**Math.PI/180;
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
  button_values[index] = value;
  console.log("button revieved ", index, "value", value);
  switch (index) {
    case 0:
      usesMirrors = !(value == 0);
      break;
    case 1:
      kUseRecursion = !(value == 0);
      break;
    case 2:
      kWedgeFeedback = !(value == 0);
      break;
  }
}

// copies wedges from the objectCell to the compositeCell in a 2-mirror kaleidoscope pattern
// that rotates about the center
//
// alternate wedges are reflected by inverting the Y scaling
function applyMirrors()
{
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

}

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
  let rot_angle = millis() * 0.00005;
  rotate(rot_angle);    // rotating of scope as a whole
  kGrav_x = cos(PI/4 - rot_angle);
  kGrav_y = sin(PI/4 - rot_angle);
  image(compositeCell, -kWidth/2, -kHeight/2);
  pop();
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