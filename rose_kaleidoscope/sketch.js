let values = [0,0,0,0,0,0,0,0];
let button_values = [0, 0, 0, 0, 0, 0, 0, 0];

let kWidth = 800;             // width of graphics
let kHeight = 800;            // height of graphics

let nbrSides = 7;

let scopeRadius = Math.floor(.4*kWidth)
let scopeMargin = 8;

let mirrorRadians = 0;
let adjustedMirrorRadians = 0;
let objectCellHeight = 0; 
let objectCellWidth = 0;

let objectCell, compositeCell;
// let wedgePG; no longer used

let usesMirrors = true;

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
const oc_padding = 4;

function SetupMirror() {
  mirrorRadians = 2 * PI / (nbrSides * 2);
  let pixelAngle = 1 / scopeRadius; // helps reduce visible seams by overlapping aliased edges
  adjustedMirrorRadians = mirrorRadians + pixelAngle*2;
  console.log("mirrorRadians", mirrorRadians, "adjustedMirrorRadians", adjustedMirrorRadians);

  objectCellWidth = scopeRadius+oc_padding*2;
  objectCellHeight = ceil(sin(adjustedMirrorRadians/2)*scopeRadius) * 2+oc_padding*2;
  objectCell = createGraphics(objectCellWidth, objectCellHeight);
 
    // wedgePG.endDraw();
}

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
  // rStart = 30 + random(60);
}

function DrawCell(oc) {
  let tm = (millis() % 1000) / 1000.0;

  // oc.beginDraw();
  // oc.clear();
  oc.smooth();
  oc.background(0, 0, 0, kDarkenAmount);
  // oc.fill(0, 80, 0);
  // oc.rect(0, 0, 500, 20);
  oc.noStroke();

  let n = millis() * kSpeed + rStart;
  let rad = objectCellWidth / 2 - kDotRadius;
  let cx = objectCellWidth / 2;
  let cy = objectCellHeight / 2;
  oc.push();
  oc.translate(10, objectCellHeight/2);
  for (let i = 0; i <= kNbrDots; ++i) {
    let theta = i * PI * 2 / kNbrDots;
    let myHue = n + theta / 2;
    let ph = sin(millis() * 0.0001);
    let rr = Math.floor(sin(myHue) * 127 + 128);
    let gg = Math.floor(sin(myHue + (2 * ph) * PI / 3) * 127 + 128);
    let bb = Math.floor(sin(myHue + (4 * ph) * PI / 3) * 127 + 128);
    oc.fill(rr, gg, bb);
    let r = rad * sin(n * theta);
    let px = cos(theta) * r * 2;
    let py = sin(theta) * r * 2;
    oc.ellipse(px, py, kDotRadius, kDotRadius);
  }
  oc.pop();
  oc.filter(BLUR, kBlurAmt);
  oc.blend(0, 0, objectCellWidth, objectCellHeight, -2, 2, objectCellWidth + 3, objectCellHeight - 5, ADD);
  // oc.endDraw();
}

function setup() {
  let min_window_dimension = Math.min(windowWidth, windowHeight);
  myCanvas = createCanvas(kWidth, kWidth, document.getElementById('sketch-canvas'));
  compositeCell = createGraphics(kWidth, kWidth);
  background(0);
  ellipseMode(RADIUS);
  SetupMirror();
  SetupCell();

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
  console.log("slider revieved ", slider_index, "value", value);
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

function applyMirrors()
{
  for (let i = 0; i < nbrSides; ++i) {
    // for each reflection
    compositeCell.push();
    compositeCell.rotate(mirrorRadians * i * 2);
    compositeCell.push();
    compositeCell.clip(myMask);
    compositeCell.image(objectCell, -oc_padding, -objectCell.height/2);
    compositeCell.pop();
    compositeCell.rotate(mirrorRadians);
    compositeCell.scale(1, -1);
    compositeCell.push();
    compositeCell.clip(myMask);
    compositeCell.image(objectCell, -oc_padding, -objectCell.height/2);
    compositeCell.pop();
    compositeCell.pop();
  }

}

function draw() {
  empty_slider_queue();
  empty_button_queue();

  DrawCell(objectCell);

  if (usesMirrors) {
    // objectCell.mask(wedgePG);
    // objectCell.clip(wedgePG);
  }

  compositeCell.background(0);
  compositeCell.push();
  compositeCell.translate(width/2, height/2);
  // compositeCell.rotate(millis() * 0.00005);    // rotating of scope as a whole
      // for each reflection
  applyMirrors();
  for (let i = 0; i < kRecursionLevels; ++i) {
    objectCell.image(compositeCell, objectCell.width / 2 - kWidth*kRecursionScale/2, objectCell.height / 2 - kHeight*kRecursionScale/2,
                                    kWidth * kRecursionScale, kHeight * kRecursionScale);
    applyMirrors();
  }

  if (!usesMirrors) {
    compositeCell.background(0);
    compositeCell.image(objectCell, -oc_padding, -objectCell.height/2);
  }

  if (kWedgeFeedback) {
    compositeCell.push();
    // compositeCell.translate(10, 154);
    compositeCell.fill(0, 0, 255, 128);
    compositeCell.noStroke();
    myMask();
    compositeCell.pop();
  }
  compositeCell.pop();
  push();
  background(0);
  translate(width/2, height/2);
  rotate(millis() * 0.00005);    // rotating of scope as a whole
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
    SetupMirror();
  } else if (key >= 'a' && key <= 'l') {
    nbrSides = 10 + key.charCodeAt(0) - 'a'.charCodeAt(0);
    console.log("nbr sides = ", nbrSides)
    SetupMirror();
  }
}