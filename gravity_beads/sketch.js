const { Engine, World, Bodies, Composite, Constraint } = Matter;

let kWidth = 512;             // width of graphics
let kHeight = 512;            // height of graphics

let kNbrRings = 140;
let kBeadRadius = kWidth * .01;
let kDamp = 0.985;
let kGravity = 0.001;
let kFriction = 0.0;
let kRestitution = 0.6;
let kStiffness = 0.25;
let last_rotation_millis = 0;
let kRotationAngle = 0.00005;

let engine;
let world;

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
      this.color = color;
      this.dark_color = get_modified_color(color, 0.25);
      this.light_color = get_modified_color(color, 0.75);
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
        translate(pos.x, pos.y);
        noStroke();
        // fill(this.color);
      fillGradient('radial', {
        from: [this.radius/3, this.radius/2, 0],
        to: [this.radius/3, this.radius/2, this.radius * 2],
        steps: [this.dark_color, this.light_color]
      });
        ellipse(0, 0, this.radius, this.radius);
        noStroke();
        fill(this.light_color);
        ellipse(this.radius/2, -this.radius/2, this.radius*.1, this.radius*.1);
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

function make_ring(nbr_balls, ball_radius, cx, cy, clr) {
  console.log("make_ring", nbr_balls);
  let cluster_radius = ball_radius * .2 * nbr_balls;
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


function setup()
{
  console.log("setup");
  let min_window_dimension = Math.min(windowWidth, windowHeight);
  myCanvas = createCanvas(kWidth, kWidth, document.getElementById('sketch-canvas'));
  background(0);
  ellipseMode(RADIUS);

  engine = Engine.create();
  world = engine.world;
  engine.constraintIterations = 10;

  let boundary_thickness = 20;
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

  let golden_ratio = (1 + sqrt(5)) / 2;
  let golden_angle = 2 * PI / golden_ratio;
  let max_hub_radius = kBeadRadius * 3.7;
  let max_hub_area = PI * pow(max_hub_radius, 2);
  let cum_area = max_hub_area;
  

  for (let i = 0; i < kNbrRings; ++i) {
    let r = i / kNbrRings;
    let angle = i * golden_angle;
    let dist = sqrt(cum_area / PI);
    cum_area += max_hub_area;
    let x = width/2 + cos(angle) * dist;
    let y = height / 2 + sin(angle) * dist;
    if (random() < 0.5) {
      make_ring(3 + (random(1) < 0.5), kBeadRadius, x, y, color(random(255), random(255), random(255)));
    } else {
      let hub_color = color(random(255), random(255), random(255));
      let spoke_color = color(random(255), random(255), random(255));
      make_hub_ring(int(random(4,7)), kBeadRadius, x, y, hub_color, spoke_color);
    }
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
  let angle = kRotationAngle;
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