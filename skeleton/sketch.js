function setup() {
  let min_window_dimension = Math.min(windowWidth, windowHeight);
  myCanvas = createCanvas(512, 512);
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
  console.log("button recieved ", index, "value", value);
}

function draw() {
  empty_slider_queue();
  empty_button_queue();
  background(32);

  fill(255);
  textAlign(CENTER, CENTER);
  text("Insert drawing code here", width / 2, height / 2);

}

let small_size = 512;
let large_size = 900;

function toggle_sketch_size() {
  let kWidth = width === small_size ? large_size : small_size;
  resizeCanvas(kWidth, kWidth);
}

function keyPressed() {
  if (key === 'x' || key === 'X') { 
    toggle_slider_visibility();
  } else if (key === 's' || key === 'S') {
    toggle_sketch_size();
  }
}