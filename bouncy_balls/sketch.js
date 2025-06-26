const { Engine, World, Bodies, Composite } = Matter;
let values = [0,0,0,0,0,0,0,0];
let button_values = [0, 0, 0, 0, 0, 0, 0, 0];

let kWidth = 512;             // width of graphics
let kHeight = 512;            // height of graphics

let kBigCircleRadius = kWidth * .045;
let kSmallCircleRadius = kWidth * .02;
let kNbrBalls = 100;
let kDamp = 0.985;
let kGravity = 0.001;
let kStiffness = 0.002;
let last_rotation_millis = 0;
let kRotationAngle = 0.00005;

let engine;
let world;

class Ball {
    constructor(px, py, radius, color) {
        this.x = px;
        this.y = py;
        this.r = radius;
        this.color = color;
        let options = {
            friction: 0,
            restitution: 0.6
        }
        this.body = Bodies.circle(this.x, this.y, this.r, options);
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
        ellipse(0, 0, this.r);
        pop();
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

    show() {
        let pos = this.body.position;
        let angle = this.body.angle;
        push();
        translate(pos.x, pos.y);
        rotate(angle);
        rectMode(CENTER);
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
    console.log("engine gravity scale", engine.gravity.scale);

  world = engine.world;
  let bgap = 10;
  boundaries.push(new Boundary(width/2, 0, width, bgap, 0.0));
  boundaries.push(new Boundary(width/2, height, width, bgap, 0.0));
  boundaries.push(new Boundary(0, height/2, bgap, height, 0.0));
  boundaries.push(new Boundary(width, height/2, bgap, height, 0.0));
//   boundaries.push(new Boundary(250, 300, width* 0.6, 20, -0.3));  
//   boundaries.push(new Boundary(150, 100, width* 0.6, 20, 0.3));
//   boundaries.push(new Boundary(150, 100, width* 0.6, 20, 0.3));

  for (let i = 0; i < kNbrBalls; ++i) {
    let x = random(kWidth);
    let y = random(10,20);
    let radius = random(kSmallCircleRadius, kBigCircleRadius);
    let clr = color(random(255), random(255), random(255));
    balls.push(new Ball(x, y, radius, clr));
  }
  last_rotation_millis = millis();
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
  values[slider_index] = value;
  switch (slider_index) {
    case 0:
      kGravity = map(value, 0, 1, 0.00, 0.002);
      engine.gravity.scale = kGravity;
      break;
    case 1:
      kRotationAngle = map(value, 0, 1, -PI,PI);
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
  button_values[index] = value;
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
  push();
  stroke(255);
  translate(width / 2, height / 2);
  line(0,0,  engine.gravity.x *100000*engine.gravity.scale, engine.gravity.y *100000*engine.gravity.scale);
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