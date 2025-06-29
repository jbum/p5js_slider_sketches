const { Engine, World, Bodies, Composite, Constraint } = Matter;
let values = [0,0,0,0,0,0,0,0];
let button_values = [0, 0, 0, 0, 0, 0, 0, 0];

let engine;
let world;

let kWidth = 800;             // width of graphics
let kHeight = 500;            // height of graphics
let kShowConstraints = false;

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

class Node {
  constructor(idx, x, y, radius, isStatic = false, display_letter = null, clr = null) {
    this.idx = idx;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.clr = clr;
    this.dark_clr = get_modified_color(clr, 0.25);
    this.body = Bodies.circle(x, y, radius, { friction: 0.1, restitution: 0.5, isStatic: isStatic });
    this.display_letter = display_letter;
    World.add(world, this.body);
  }

  show() {
    push();
    fill(this.clr);
    let pos = this.body.position;
    let angle = 0;
    if (this.idx > 0 && this.idx < nodes.length - 1) {
      let pos_prev = nodes[this.idx - 1].body.position;
      let pos_next = nodes[this.idx + 1].body.position;
      angle = atan2(pos_next.y - pos_prev.y, pos_next.x - pos_prev.x);
    }
    if (this.display_letter) {
      push();
      translate(pos.x, pos.y);
      rotate(angle);
      fill(this.dark_clr);
      text(this.display_letter, 4, 4);
      fill(this.clr);
      text(this.display_letter, 0, 0);
      pop();
    } else {
      if (kShowConstraints) {
        fill(255);
        ellipse(pos.x, pos.y, this.radius, this.radius);
      }
    }
    pop();
  }
} 
let nodes = [];
let springs = [];

function setup_letter_chain(phrase) {
  let letter_gap = 65;
  let nbr_nodes = int(kWidth / letter_gap) + 1;
  let node_radius = 10;
  let first_node = max(1, int((nbr_nodes - phrase.length) / 2));
  for (let i = 0; i < nbr_nodes; i++) {
    node_x = letter_gap * i;
    node_y = kHeight / 2;
    let letter = null;
    if (i >= first_node && i < first_node + phrase.length) {
      letter = phrase[i - first_node];
    }
    let h = i/nbr_nodes;
    let s = 0.5;
    let b = 0.85;
    colorMode(HSL, 1, 1, 1);
    let clr = color(h, s, b);
    colorMode(RGB, 255);
    let node = new Node(i, node_x, node_y, node_radius, (i == 0 || i == nbr_nodes-1) ? true : false, letter, clr);
    nodes.push(node);
  }

  let slack = letter_gap * 0.0;
  for (let i = 0; i < nbr_nodes-1; i++) {
    let node1 = nodes[i];
    let node2 = nodes[i + 1];
    let constraint = Constraint.create({
      bodyA: node1.body,
      bodyB: node2.body,
      length: letter_gap + slack,
      stiffness: 0.1,
    });
    Composite.add(world, constraint);
    springs.push(constraint);
  }
}

function setup() {
  myCanvas = createCanvas(kWidth, kHeight);

  engine = Engine.create();
  world = engine.world;



  background(0);
  ellipseMode(RADIUS);
  textFont("Bungee");
  textSize(72);
  textAlign(CENTER, CENTER);
  setup_letter_chain("HELIUM!");
}

let slider_queue = [];
function slider_hook(slider_index, value) {
  slider_queue.push([slider_index, value]);
}

function empty_slider_queue() {
  // first in, first out
  while (slider_queue.length > 0) {
    let [slider_index, value] = slider_queue.shift();
    slider_hook_process(slider_index, value);
  }
}

function slider_hook_process(slider_index, value) {
  values[slider_index] = value;
  switch (slider_index) {
    case 0:
      engine.gravity.scale = map(value, 0, 1, -0.002, 0.002);
      break;
  }
}

let button_queue = [];
function button_hook(index, value) {
  button_queue.push([index, value]);
}

function empty_button_queue() {
  // first in, first out
  while (button_queue.length > 0) {
    let [index, value] = button_queue.shift();
    button_hook_process(index, value);
  }
}

function button_hook_process(index, value) {
  button_values[index] = value;
  switch (index) {
    case 0:
      kShowConstraints = value > 0.5;
      break;
  }
}

function draw() {
  empty_slider_queue();
  empty_button_queue();
  background(0,0,0,90);

  Engine.update(engine);
  for (node of nodes) {
    node.show();
  }
  if (kShowConstraints) {
    push();
    for (spring of springs) {
      let posA = spring.bodyA.position;
      let posB = spring.bodyB.position;
      stroke(255);
      line(posA.x, posA.y, posB.x, posB.y);
    }
    pop();
  }
  // blur and expand
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