let values = [0,0,0,0,0,0,0,0];
let button_values = [0, 0, 0, 0, 0, 0, 0, 0];

let kWidth = 512;             // width of graphics
let kHeight = 512;            // height of graphics

function setup() {
  let min_window_dimension = Math.min(windowWidth, windowHeight);
  myCanvas = createCanvas(kWidth, kWidth, document.getElementById('sketch-canvas'));
  background(0);
  ellipseMode(RADIUS);
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
  console.log("slider recieved ", slider_index, "value", value);
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
  console.log("button recieved ", index, "value", value);
}

function draw() {
  empty_slider_queue();
  empty_button_queue();
  background(0);



  //
  // BEGIN ----- DELETE THIS BLOCK -----
  //
  stroke(255);
  for (let i = 0; i < 8; i++) {
    let x = map(values[i], 0, 1, 50, width-50);
    let y = 20+i*50;
    let radius = 5;
    ellipse(x, y, radius, radius);
  }

  for (let i = 0; i < 8; i++) {
    gx = i % 4;
    gy = int(i / 4);
    tw = 48;
    th = 48;
    let x = 64 + tw*gx;
    let y = th*gy + height-64;
    let radius = 16;
    if (button_values[i] > 0) {
      fill(255);
    } else {
      fill(0);
    }
    stroke(255);
    ellipse(x, y, radius, radius);
    fill(0);
  }
  //
  // END ----- DELETE THIS BLOCK -----
  //

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