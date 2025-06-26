let values = [0,0,0,0,0,0,0,0];
let button_values = [0, 0, 0, 0, 0, 0, 0, 0];

let kWidth = 512;             // width of graphics
let kHeight = 512;            // height of graphics

let kViewAngle = 35*Math.PI/180;
let kCamRadius = 500;
let kCamHeight = 500;

let camZ = ((kHeight/2.0)/Math.tan(kViewAngle));
let zNear = camZ/8;
let zFar = camZ*10;

let ca = 0;
let cx = -Math.cos(ca)*kCamRadius;
let cy = kCamHeight;
let cz = Math.sin(ca)*kCamRadius; 
let ex = 0;
let ey = 30;
let ez = 0;
let useMask = false;
let maskPG, iMaskPG, iMaskFrame, last_img;
const kMaxRecursions = 4;
let puzzle_x = 687;
let puzzle_y = 876;
let isAutomated = false;

class Recursion {
  constructor(scale, rx, ry, rz, tx, ty, tz, isOn, isTweaking) {
    this.scale = scale;
    this.rot_x = rx;
    this.rot_y = ry;
    this.rot_z = rz;
    this.tran_x = tx;
    this.tran_y = ty;
    this.tran_z = tz;
    this.isOn = isOn;
    this.isTweaking = isTweaking;
    this.isPressed = false;
    this.lastPress = 0;
  }
}

let recursions = [];

const kMinTran = -256;
const kMaxTran = 256;

function setup_recursions() {
  recursions = [];
  recursions.push(new Recursion(1, 0.5, 1, 0.123,  -179, 2, 38, true, true));
  recursions.push(new Recursion(0.275, 0, 0.9, 0.267,  -228, -256, -22, true, false));
  recursions.push(new Recursion(0.275, 0, 0.9, 0.267,  -100, -256, -22, false, false));
  recursions.push(new Recursion(0.275, 0, 0.9, 0.267,  -50, -256, -22, false, false));
}

function setup() {
  let min_window_dimension = Math.min(windowWidth, windowHeight);
  myCanvas = createCanvas(kWidth, kWidth, WEBGL, document.getElementById('sketch-canvas'));
  // background(0);
  ellipseMode(RADIUS);

  setup_recursions();

  // noDepth();
  last_img = get(0,0,width,height);

  puzzle_x = 701;
  puzzle_y = 849;

  perspective(radians(48), width/height, 10, 10000);
  // feedbackPads(0xFF);

  maskPG = createGraphics(width, height, P2D);
  maskPG.ellipseMode(RADIUS);
  maskPG.smooth();
  maskPG.background(0);
  maskPG.fill(255);
  maskPG.stroke(255);  // or no stroke
  maskPG.ellipse(width/2, height/2, width*0.45, width*0.45);

  iMaskPG = createGraphics(width, height, P2D);
  iMaskPG.ellipseMode(RADIUS);
  iMaskPG.smooth();
  iMaskPG.background(255);
  iMaskPG.fill(0);
  iMaskPG.stroke(0);  // or no stroke
  iMaskPG.ellipse(width/2, height/2, width*0.45, width*0.45);
  
  iMaskFrame = createGraphics(width, height, P2D);
  iMaskFrame.background(0);
  // iMaskFrame.mask(iMaskPG);

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
  let v = value;
  switch (slider_index) {
    case 0:
      for (let i = 0; i < kMaxRecursions; ++i) {
        if (recursions[i].isTweaking) {
          recursions[i].rot_x = map(v, 0, 1, -PI, PI);
        }
      }
      break;
    case 1:
      for (let i = 0; i < kMaxRecursions; ++i) {
        if (recursions[i].isTweaking) {
          recursions[i].rot_y = map(v, 0, 1, -PI, PI);
        }
      }
      break;
    case 2:
      for (let i = 0; i < kMaxRecursions; ++i) {
        if (recursions[i].isTweaking) {
          recursions[i].rot_z = map(v, 0, 1, -PI, PI);
        }
      }
      break;
    case 3:
      for (let i = 0; i < kMaxRecursions; ++i) {
        if (recursions[i].isTweaking) {
          recursions[i].tran_x = map(v, 0, 1, kMinTran, kMaxTran);
        }
      }
      break;
    case 4:
      for (let i = 0; i < kMaxRecursions; ++i) {
        if (recursions[i].isTweaking) {
          recursions[i].tran_y = map(v, 0, 1, kMinTran, kMaxTran);
        }
      }
      break;
    case 5:
      for (let i = 0; i < kMaxRecursions; ++i) {
        if (recursions[i].isTweaking) {
          recursions[i].tran_z = map(v, 0, 1, kMinTran, kMaxTran);
        }
      }
      break;
    case 6:
      for (let i = 0; i < kMaxRecursions; ++i) {
        if (recursions[i].isTweaking) {
          recursions[i].scale = map(v, 0, 1, 0.01, 1);
        }
      }
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
  if (index < 4) {
    let rIdx = index;
    if (value) {
      recursions[rIdx].isOn = true;
    }
    else {
      recursions[rIdx].isOn = false;
    }
  } else if (index >= 4 && index < 8) {
    let rIdx = index - 4;
    if (value) {
      recursions[rIdx].isTweaking = true;
    }
    else {
      recursions[rIdx].isTweaking = false;
    }

  }
  // if (index == 4) {
  //   useMask = value > 0;
  // }
}

function draw() {
  empty_slider_queue();
  empty_button_queue();

  let ang = frameCount * 0.3;
  noStroke();
  background(0,0,0,64);

  push();
  console.log("drawing");
  translate(-width / 2, -height / 2);
  
  let ctr = int(frameCount / 60);
  fill(ctr % 2 === 0 ? 255 : 0);
  rect(0, 0, width, height);
  fill(ctr % 2 === 0 ? 0 : 255);
  triangle(0, 0, width, height, width, 0);
  // filter(BLUR, 10);
  fill(0);
  // return;

  if (useMask) {
    image(iMaskFrame, 0, 0);
  }
  
  // Recursions
  for (let i = 0; i < kMaxRecursions; i++) {
    let recur = recursions[i];
    if (!recur.isOn) {
      continue;
    }
   
    push();
      // translate(0,0,10);
      // perspective(radians(48),width/height,10,10000);
      translate(width/2, height/2);
      rotateX(recur.rot_x);
      rotateY(recur.rot_y);
      rotateZ(recur.rot_z);
      translate(recur.tran_x, recur.tran_y, recur.tran_z);
      noStroke();
      let qw = width * recur.scale/2;
      let qh = height * recur.scale/2;
      beginShape();
        texture(last_img);
        vertex(-qw, -qh, 0, 0);
        vertex(qw, -qh, 0, width, 0);
        vertex(qw, qh, 0, width, height);
        vertex(-qw, qh, 0, 0, height);
      endShape();
    pop();
  }
  
  // Image Generation Overlays go here...
  //fill(color(random(255), random(255), random(255), 20));
  //ellipse(random(width), random(height), random(400), random(400));
  //fill(0);

  last_img = get(0, 0, width, height);
  if (useMask) {
    last_img.mask(maskPG);
  }
  pop();
  if (isAutomated) {
    // autoPass();
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
  switch (key) {
    case 'x':
      toggle_slider_visibility();
      break;
    case 's':
      toggle_sketch_size();
      break;
    case 'a':
      isAutomated = !isAutomated;
      break;
  }
}