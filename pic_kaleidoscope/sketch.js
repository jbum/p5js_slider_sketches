// these receive values from the external slider object

let kWidth = 800;             // width of graphics
let kHeight = 800;            // height of graphics

let nbrSides = 7;
let nbrSides_M1 = 3;
let nbrSides_M2 = 5;

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
let kSpeed = 0.1;
let kMinPanSpeed = 0;
let kMaxPanSpeed = .05;
let kMinRotateSpeed = 0;
let kMaxRotateSpeed = .0005;
let kDoRotate = false;
let kTubeRotate = false;
let kStartTubeRotate;
let kBisect = false;

let kWedgeFeedback = false;
let kRecursionLevels = 0;
let kRecursionScale = 0.66;
let kShowFrameRate = false;

let rStart;
let src_img, src_images;

let pic_names = ['./assets/ramayana_2.jpg', './assets/ramayana_1.jpg', './assets/ramayana_3.gif','./assets/gradient_1.png']

const oc_padding = 4; // object cell padding -- this helps reduce edge artifacts in the center and outer rim

function setupMirrors() {
  // console.log("setup",nbrSides);
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

function SetupCell() {
  // unused
}

function DrawCell(oc) {
  oc.smooth();
  // when kDarkenAmount is a lower value, this provides a trail effect
  oc.background(0); // , 0, 0, kDarkenAmount);
  oc.noStroke();

  // draw the picture in ramayana.pic 
  let subPixels = 2; // sub-pixel movement
  oc.push();
  if (kDoRotate) {
    let rotate_speed = map(kSpeed,0,1,kMinRotateSpeed,kMaxRotateSpeed);
    oc.translate(width/2, height/2);
    oc.rotate(millis() * rotate_speed);
    oc.scale(height/min(src_img.height, src_img.width));
    oc.image(src_img, -src_img.width/2, -src_img.height/2);
  } else {
    let pan_speed = map(kSpeed,0,1,kMinPanSpeed,kMaxPanSpeed);
    let pixels_traveled = (int(millis() * pan_speed) % (src_img.width*subPixels))/subPixels;
    let delta_x = -pixels_traveled;
    oc.scale(height/src_img.height);
    oc.image(src_img, delta_x, 0);
    oc.image(src_img, delta_x + src_img.width, 0);
  }
  oc.pop();

  // this provides a blur effect
  if (kBlurAmt >= 1/20) {
    oc.filter(BLUR, kBlurAmt);
  }
}

function preload() {
  src_images = [];
  for (let i = 0; i < pic_names.length; ++i) {
    src_images.push(loadImage(pic_names[i]));
  }
  src_img = src_images[0];
}

function setup() {
  let min_window_dimension = Math.min(windowWidth, windowHeight);
  myCanvas = createCanvas(kWidth, kWidth);
  compositeCell = createGraphics(kWidth, kWidth);
  background(0);

  objectCellWidth = width;
  objectCellHeight = height;
  objectCell = createGraphics(objectCellWidth, objectCellHeight);
  frameRate(60); // desired frame rate

  kStartTubeRotate = millis();

  ellipseMode(RADIUS);
  setupMirrors();
  SetupCell();

}

// we use a queue to manage incoming slider values, because slider_hook is not in p5.js context when called.
let slider_queue = [];
function slider_hook(slider_index, value) {
  console.log("slider_hook", slider_index, value);
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
  let v;
  switch (slider_index) {
    case 0:
      v = value * value;
      nbrSides = int(map(v, 0, 1, 3, 12));
      console.log("nbr sides = ", nbrSides)
      setupMirrors();
      break;
    case 1:
      kBlurAmt = map(value, 0, 1, 0, 20);
      break;
    case 2:
      kSpeed = map(value, 0, 1, 0, 1);
      break;
    case 3:
      v = value * value;
      nbrSides_M1 = int(map(v, 0, 1, 3, 12));
      break;
    case 4:
      v = value * value;
      nbrSides_M2 = int(map(v, 0, 1, 3, 12));
      break;
    case 5:
      src_img_idx = int(map(value, 0, 1.01, 0, src_images.length));
      src_img = src_images[src_img_idx];
      break;
    case 6:
      kRecursionLevels = int(map(value, 0, 1, 0, 6));
      break;
    case 7:
      kRecursionScale = map(value, 0, 1, 0.1, 0.9);
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
      kDoRotate = !(value == 0);
      break;
    case 2:
      kWedgeFeedback = !(value == 0);
      break;
    case 3:
      kShowFrameRate = !(value == 0);
      break;
    case 4:
      kTubeRotate = !(value == 0);
      if (kTubeRotate) {
        kStartTubeRotate = millis();
      }
      break;
    case 5:
      kBisect = !(value == 0);
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
    let save_nbrSides = nbrSides;
    nbrSides = kRecursionLevels > 0? nbrSides_M1 : save_nbrSides;
    setupMirrors();
    applyMirrors(); // copy the wedges from the object cell to the composite Cell
    // apply feedback passes, if any
    for (let i = 0; i < kRecursionLevels; ++i) {
      nbrSides = kRecursionLevels > 1 && i == 0? nbrSides_M2 : save_nbrSides;
      setupMirrors();
      let cx = objectCell.width/2;
      let cy = objectCell.height/2;
      let dx = cx + objectCell.width / 4;
      let dy = cy;
      let image_width = kWidth * kRecursionScale;
      let image_height = kHeight * kRecursionScale;
      if (kBisect) {
        let center_rad = dx - cx;
        dx = cx + cos(-mirrorRadians/2)*center_rad;
        dy = cy + sin(-mirrorRadians/2)*center_rad;
      }
      objectCell.image(compositeCell, 
        dx - image_width / 2, 
        dy - image_height / 2,
        image_width, image_height);
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
  translate(width/2, height/2);
  if (kTubeRotate) {
    rotate((millis() - kStartTubeRotate) * 0.00005);    // rotating of scope as a whole
  }
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


  if (kShowFrameRate) {
    push();
    fill(255);
    textSize(16);
    let fr_str = average_fr.toFixed(1);
    text(fr_str, 10, 20);
    pop();
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
    setupMirrors();
  } else if (key >= 'a' && key <= 'l') {
    nbrSides = 10 + key.charCodeAt(0) - 'a'.charCodeAt(0);
    console.log("nbr sides = ", nbrSides)
    setupMirrors();
  }
}