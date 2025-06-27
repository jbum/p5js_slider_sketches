const { Engine, World, Bodies, Composite } = Matter;

let kWidth = 512;             // width of graphics
let kHeight = 512;            // height of graphics

let kBigCircleRadius = kWidth * .045;
let kSmallCircleRadius = kWidth * .02;
let kNbrBalls = 60;
let kDamp = 0.985;
let kGravity = 0.001;
let kFriction = 0.0;
let kRestitution = 0.6;
let kStiffness = 0.002;
let last_rotation_millis = 0;
let kRotationAngle = 0.00005;

let engine;
let world;

class Ball {
    constructor(px, py, radius, color) {
      this.color = color;
      this.radius = radius;
        let options = {
            friction: kFriction,
            restitution: kRestitution
        }
        this.body = Bodies.circle(px, py, radius, options);
        Composite.add(world, this.body);
    }
    show() {
        let pos = this.body.position;
        let angle = this.body.angle;
        push();
        noStroke();
        fill(this.color);
        translate(pos.x, pos.y);
        rotate(angle);
        rectMode(CENTER);
        strokeWeight(1);
        ellipse(0, 0, this.radius);
        pop();
    }
}

class Boundary {
    constructor(x, y, w, h, a) {
        this.w = w;
        this.h = h;
        let options = {
            friction: 0,
            restitution: 0.6,
            angle: a,
            isStatic: true
        }
        this.body = Bodies.rectangle(x, y, this.w, this.h, options);
        Composite.add(world, this.body);
    }

    show() {
        let pos = this.body.position;
        let angle = this.body.angle;
        push();
        translate(pos.x, pos.y);
        rotate(angle);
        rectMode(CENTER);
        noStroke();
        fill(0x25);
        rect(0, 0, this.w, this.h);
        pop();
    }
}
let balls = [];
let boundaries = [];


function setup()
{
  console.log("setup");
  let min_window_dimension = Math.min(windowWidth, windowHeight);
  myCanvas = createCanvas(kWidth, kWidth, document.getElementById('sketch-canvas'));
  background(0);
  ellipseMode(RADIUS);

  engine = Engine.create();
  world = engine.world;

  let boundary_thickness = 10;
  let boundary_radius = (width-boundary_thickness)/2;
  let boundary_sides = 24;
  let circumference = 2 * PI * boundary_radius;
  let segment_length = 3 + circumference / boundary_sides;
  for (let i = 0; i < boundary_sides; i++) {
    let angle = (i * 2 * PI) / boundary_sides;
    let midX = width/2 + boundary_radius * cos(angle);
    let midY = height/2 + boundary_radius * sin(angle);
    let segmentLength = segment_length;
    let segmentAngle = angle+PI/2;
    boundaries.push(new Boundary(midX, midY, segmentLength, boundary_thickness, segmentAngle));
  }

  for (let i = 0; i < kNbrBalls; ++i) {
    let angle = random(0, 2 * PI);
    let dist = random(boundary_radius * 0.9);
    let x = width/2 + cos(angle) * dist;
    let y = height/2 + sin(angle) * dist;
    let radius = random(kSmallCircleRadius, kBigCircleRadius);
    let clr = color(random(255), random(255), random(255));
    balls.push(new Ball(x, y, radius, clr));
  }
  last_rotation_millis = millis();
}

function update_ball_physics()
{
  for (let ball of balls) {
    ball.body.friction = kFriction;
    ball.body.restitution = kRestitution;
  }
}

let slider_queue = [];
function slider_hook(slider_index, value)
{
  slider_queue.push([slider_index, value]);
}

function empty_slider_queue()
{
  // first in, first out
  while (slider_queue.length > 0) {
    let [slider_index, value] = slider_queue.shift();
    slider_hook_process(slider_index, value);
  }
}

function slider_hook_process(slider_index, value)
{
  switch (slider_index) {
    case 0:
      kGravity = map(value, 0, 1, 0.00, 0.002);
      engine.gravity.scale = kGravity;
      break;
    case 1:
      kRotationAngle = map(value, 0, 1, -PI, PI);
      break;
    case 2:
      kFriction = map(value, 0, 1, 0.0, 0.1);
      update_ball_physics();
      break;
    case 3:
      kRestitution = map(value, 0, 1, 0.0, 1.0);
      update_ball_physics();
      break;
  }
}

let button_queue = [];
function button_hook(index, value)
{
  button_queue.push([index, value]);
}

function empty_button_queue()
{
  // first in, first out
  while (button_queue.length > 0) {
    let [index, value] = button_queue.shift();
    button_hook_process(index, value);
  }
}

function button_hook_process(index, value)
{
}



function draw()
{
  empty_slider_queue();
  empty_button_queue();
  background(0);

  engine.gravity.x = cos(kRotationAngle);
  engine.gravity.y = sin(kRotationAngle);


  Engine.update(engine);
  for (let i = 0; i < balls.length; i++) {
    balls[i].show();
  }
  for (let i = 0; i < boundaries.length; i++) {
    boundaries[i].show();
  }
  // draw an arrow indicating the direction of the gravity
  push();
  stroke(255);
  translate(width / 2, height / 2);
  let line_length = 100000 * engine.gravity.scale;
  let lx = engine.gravity.x * line_length;
  let ly = engine.gravity.y * line_length;
  line(0, 0, lx, ly);
  let angle = atan2(ly, lx);
  let arrow_length = 10;
  let arrow_angle = PI*4/5;
  line(lx, ly, lx + cos(angle + arrow_angle) * arrow_length, ly + sin(angle + arrow_angle) * arrow_length);
  line(lx, ly, lx + cos(angle - arrow_angle) * arrow_length, ly + sin(angle - arrow_angle) * arrow_length);

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
  }
}