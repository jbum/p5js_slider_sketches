// these receive values from the external slider object

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
let kShowFrameRate = false;

let rStart;
const oc_padding = 4; // object cell padding -- this helps reduce edge artifacts in the center and outer rim

function SetupMirror() {
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
  oc.background(0, 0, 0, kDarkenAmount);
  oc.noStroke();

  let n = millis() * kSpeed + rStart;
  let rad = objectCellWidth / 2 - kDotRadius;
  oc.push();
  oc.translate(objectCellWidth/2, objectCellHeight/2);
  for (let i = 0; i <= kNbrDots; ++i) {
    let theta = i * PI * 2 / kNbrDots; // angle going around the circle goes from 0 -> 2π
    let myHue = n + theta / 2;
    let ph = sin(millis() * 0.0001);
    let rr = Math.floor(sin(myHue) * 127 + 128);
    let gg = Math.floor(sin(myHue + (2 * ph) * PI / 3) * 127 + 128);
    let bb = Math.floor(sin(myHue + (4 * ph) * PI / 3) * 127 + 128);
    oc.fill(rr, gg, bb);
    let r = rad * cos(n * theta); // the rose equation, note that each dot oscillates back and forth on a straight line
    let px = cos(theta) * r * 2;
    let py = sin(theta) * r * 2;
    oc.ellipse(px, py, kDotRadius, kDotRadius);
  }
  oc.pop();
  // this provides a blur effect
  if (kBlurAmt >= 1/20) {
    oc.filter(BLUR, kBlurAmt);
  }
  // glow
  oc.blend(0, 0, objectCellWidth, objectCellHeight, -2, 2, objectCellWidth + 3, objectCellHeight - 5, ADD);
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


  ellipseMode(RADIUS);
  SetupMirror();
  SetupCell();

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
      SetupMirror();
      break;
    case 1:
      kNbrDots = map(value, 0, 1, 10, 2048);
      break;
    case 2:
      kDotRadius = map(value, 0, 1, 1, 20);
      break;
    case 3:
      kBlurAmt = map(value, 0, 1, 0, 20);
      break;
    case 4:
      kDarkenAmount = map(value, 1, 0, 128, 255);
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
      kUseRecursion = !(value == 0);
      break;
    case 2:
      kWedgeFeedback = !(value == 0);
      break;
    case 3:
      kShowFrameRate = !(value == 0);
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
  translate(width/2, height/2);
  rotate(millis() * 0.00005);    // rotating of scope as a whole
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
    SetupMirror();
  } else if (key >= 'a' && key <= 'l') {
    nbrSides = 10 + key.charCodeAt(0) - 'a'.charCodeAt(0);
    console.log("nbr sides = ", nbrSides)
    SetupMirror();
  }
}