// Port of a sketch originally created to mimic the jukebox display in an old movie (an ami/rowe jukebox)
// footage at 00:35 in this clip: https://www.youtube.com/watch?v=QFlflxfe1RI
// Added tricorder and communicators from Star Trek later.
// This supports creating rotational interference patterns from one rotating pattern placed under a fixed pattern
// Other physical interference pattern displays of historical interest would be cool to add.

// Port of plates.py functions merged into sketch.js
const NBR_SHAPES = 9;
const NBR_GELS = 4;
const SLOT_WIDTH = 7;

let kWidth = 600;  // width of graphics
let kHeight = 600; // height of graphics
const msPerFrame = 1000 / 30.0;

// Simulation variables
let mode = 0;
let rpm = 1.6; // - it takes about 10 seconds to do a quarter turn, so 1rpm in 40 seconds
let curGraphic_A_idx = 0;
let curGraphic_B_idx = 0;
let curColorGel_idx = 0;
let isMonitor = false;
let kBlurAmt = 0;
let kUseDisplaceShader = false;

// Graphics objects
let graphic_A;
let graphic_B;
let gelDisc;
let luxShader;
let luxShader2;
let blurShader;
let use_shaders = false; // not successfully ported yet (having issue with calls to setUniform)
let use_shader_vars = false;
// Presets from the original code
const goodPresets = [
  [7, 7, 3, "tos tricorder"], // reference https://www.thewandcompany.com/tricorder-update-8/
  [8, 8, 3, "tos communicator"], // reference https://www.thewandcompany.com/tricorder-update-8/
  [0, 0, 0, "rowe/ami L-200 jukebox"], // reference footage https://www.youtube.com/watch?v=7QtO-hxgRfU and https://www.youtube.com/watch?v=QFlflxfe1RI
  [1, 2, 1, "expanding spiral"],
  [2, 2, 0, "starburst"],
  [3, 3, 1, "banded star"],
  [1, 3, 1, "slow expand"],
  [2, 0, 0, "spoke/rowe"],
];

let displaceColorsSrc = `
precision highp float;

uniform sampler2D tex0;
varying vec2 vTexCoord;

vec2 zoom(vec2 coord, float amount) {
  vec2 relativeToCenter = coord - 0.5;
  relativeToCenter /= amount; // Zoom in
  return relativeToCenter + 0.5; // Put back into absolute coordinates
}

void main() {
  // Get each color channel using coordinates with different amounts
  // of zooms to displace the colors slightly
  gl_FragColor = vec4(
    texture2D(tex0, vTexCoord).r,
    texture2D(tex0, zoom(vTexCoord, 1.05)).g,
    texture2D(tex0, zoom(vTexCoord, 1.1)).b,
    texture2D(tex0, vTexCoord).a
  );
}
`;

function preload() {
  console.log("Preloading shaders");
  if (use_shaders) {
    try {
      // Load shaders with both vertex and fragment shaders
      console.log("Loading shaders");
      luxShader = loadShader('data/lux.vert', 'data/lux.frag');
      luxShader2 = loadShader('data/lux.vert', 'data/lux.frag');
      blurShader = loadShader('data/blur.vert', 'data/blur.frag');
      console.log("Done Loading shaders");
    } catch (e) {
      console.error("Error loading shaders:", e);
      // Create dummy shaders that do nothing if loading fails
      luxShader = { setUniform: function () { } };
      luxShader2 = { setUniform: function () { } };
      blurShader = { setUniform: function () { } };
    }
  }
}

let displaceColors;

function setup() {
  createCanvas(kWidth, kHeight, WEBGL);
  pixelDensity(1); // Ensure consistent pixel density
  
  // Initialize graphics
  gelDisc = getColorGel(curColorGel_idx);
  graphic_A = getGraphic_A(curGraphic_A_idx, gelDisc);
  graphic_B = getGraphic_B(curGraphic_B_idx);
  
  // Set default text font
  textFont('Helvetica');
  textSize(12);
  
  // Process slider values
  // noLoop();
  displaceColors = createFilterShader(displaceColorsSrc);

}

let small_size = 600;
let large_size = 900;

function toggle_sketch_size() {
  kWidth = kWidth === small_size ? large_size : small_size;
  kHeight = kWidth;
  resizeCanvas(kWidth, kHeight);
  gelDisc = getColorGel(curColorGel_idx);
  graphic_A = getGraphic_A(curGraphic_A_idx, gelDisc);
  graphic_B = getGraphic_B(curGraphic_B_idx);
}


function updateDiscs() {
  gelDisc = getColorGel(curColorGel_idx);
  graphic_A = getGraphic_A(curGraphic_A_idx, gelDisc);
  graphic_B = getGraphic_B(curGraphic_B_idx);
}

let slider_queue = [];
function slider_hook(slider_index, value) {
  slider_queue.push([slider_index, value]);
}

function empty_slider_queue() {
  // First in, first out
  while (slider_queue.length > 0) {
    let [slider_index, value] = slider_queue.shift();
    slider_hook_process(slider_index, value);
  }
}

function slider_hook_process(slider_index, value) {
  // values[slider_index] = value;
  switch (slider_index) {
  case 0:
    mode = floor(map(value, 0, 1.01, 0, 5));
    break;
  case 1:
    rpm = map(value, 0, 1, 0, 3);
    break;
  case 2:
    curGraphic_A_idx = floor(map(value, 0, 1.01, 0, NBR_SHAPES));
    updateDiscs();
    break;
  case 3:
    curGraphic_B_idx = floor(map(value, 0, 1.01, 0, NBR_SHAPES));
    updateDiscs();
    break;
  case 4:
    curColorGel_idx = floor(map(value, 0, 1.01, 0, NBR_GELS));
    console.log("color gel idx", curColorGel_idx, "value", value);
    updateDiscs();
    break;
  case 5:
    let preset_idx = floor(map(value, 0, 1.01, 0, goodPresets.length));
    [curGraphic_A_idx, curGraphic_B_idx, curColorGel_idx] = goodPresets[preset_idx];
    const label = `${goodPresets[preset_idx][3]} (${curGraphic_A_idx}/${curGraphic_B_idx}/${curColorGel_idx})`;
    document.getElementById('sketch-label').textContent = label;
    updateDiscs();
    break;
  case 6:
    kBlurAmt = map(value, 0, 1, 0, 10);
    break;
  case 7:
      // unused
    break;
  }
}

let button_queue = [];
function button_hook(index, value) {
  button_queue.push([index, value]);
}

function empty_button_queue() {
  // First in, first out
  while (button_queue.length > 0) {
    let [index, value] = button_queue.shift();
    button_hook_process(index, value);
  }
}

function button_hook_process(index, value) {
  // button_values[index] = value;
  switch (index) {
    case 0:
      isMonitor = value > 0;
      break;
    case 1:
      kUseDisplaceShader = value > 0;
      break;
  }
}

function draw() {
  empty_slider_queue();
  empty_button_queue();
  
  background(0, 0, 0);
  
  // Reset transformation
  resetMatrix();
  
  // Move to center and apply rotation
  translate(0, 0, 0); // WEBGL mode starts at center
  
  // Draw the color mask with rotation
  push();
  if (curGraphic_A_idx === 0) { // offset for JAL color plate
    translate(-width * 0.04, 0);
  }
  
  // Calculate rotation amount
  const rpmm = TWO_PI * (rpm / 60.0) / 1000.0;
  rotate(frameCount * msPerFrame * rpmm);
  
  blendMode(LIGHTEST);


  // Draw the color mask
  imageMode(CENTER);
    image(graphic_A, 0, 0);
  pop();
  
  // Apply different blending based on mode
  if (mode === 4) {
    // Special mode with partial transparency
    push();
    tint(255, 32);
    imageMode(CENTER);
    image(graphic_B, 0, 0);
    noTint();
    pop();
  }
  
  if (mode !== 1) {
    if (mode !== 2) {
      // Use DARKEST blend mode for most modes
      push();
      blendMode(DARKEST);
      imageMode(CENTER);
      image(graphic_B, 0, 0);
      pop();
    } else {
      // Just overlay the grille for mode 2
      imageMode(CENTER);
      image(graphic_B, 0, 0);
    }
  }
  
  // Apply shaders for certain modes
  if ((mode === 0 || mode === 4) && luxShader && blurShader && use_shaders && use_shader_vars) {
    try {
      // Apply blur shader
      console.log("shader a");
      shader(blurShader);
      blurShader.setUniform('uTexture', get());
      blurShader.setUniform('uTexOffset', [1.0/width, 1.0/height]);
      blurShader.setUniform('uKernelSize', 64);
      blurShader.setUniform('uHorizontalPass', 1);
      blurShader.setUniform('uStrength', 2.0);
      rect(0, 0, width, height);
      resetShader();
      
      // Apply horizontal lux shader
      console.log("shader b");
      shader(luxShader);
      luxShader.setUniform('uTexture', get());
      luxShader.setUniform('uTexOffset', [1.0/width, 1.0/height]);
      luxShader.setUniform('uKernelSize', 64);
      luxShader.setUniform('uStrength', 32.0);
      luxShader.setUniform('uAngle', 0);
      rect(0, 0, width, height);
      resetShader();
      
      // Apply vertical lux shader
      shader(luxShader2);
      luxShader2.setUniform('uTexture', get());
      luxShader2.setUniform('uTexOffset', [1.0/width, 1.0/height]);
      luxShader2.setUniform('uKernelSize', 64);
      luxShader2.setUniform('uStrength', 32.0);
      luxShader2.setUniform('uAngle', PI / 2);
      rect(0, 0, width, height);
      resetShader();
    } catch (e) {
      console.error("Error applying shaders:", e);
    }
  }
  if (!use_shaders && (mode == 0 || mode == 4)) {
    // Draw the color mask with rotation
    push();
    // filter(BLUR, 2);
    pop();
  }
  if (kBlurAmt >= 1 / 10) {
    for (let i = 0; i < kBlurAmt; i++) {
      filter(BLUR, 1);
      filter(DILATE);
    }
    filter(BLUR, 1);
  }
  if (kUseDisplaceShader) {
    filter(displaceColors);
  }

  // this makes a glow effect
  // blend(0, 0, width, height, -2, 2, width + 3, height - 5, ADD);
  
  // Draw monitor (preview of components) if enabled
  if (isMonitor) {
    // Switch back to 2D mode for UI drawing
    push();
    imageMode(CORNER);
    translate(-width/2, -height/2); // Adjust for WEBGL mode
    
    const mdiv = 5.0; // Size divisor for the preview
    
    // Draw rotated/colorized graphic_A preview
    push();
    fill(255);
    translate(0, height - height / mdiv);
    translate(width / mdiv / 2, height / mdiv / 2);
    rotate(frameCount * msPerFrame * rpmm);
    translate(-width / mdiv / 2, -height / mdiv / 2);
    image(graphic_A, 0, 0, width / mdiv, height / mdiv);
    pop();
    
    // Draw gel preview
    image(gelDisc, width / 2 - width / mdiv / 2, height - height / mdiv, width / mdiv, height / mdiv);
    
    // Draw grille preview
    image(graphic_B, width - width / mdiv, height - height / mdiv, width / mdiv, height / mdiv);
    
    pop();
  }
  // noLoop();
}

function keyPressed() {
  // Handle keyboard input (useful for testing)
  if (key === 'x' || key === 'X') {
    toggle_slider_visibility();
  } else if (key === 's' || key === 'S') {
    toggle_sketch_size();
  }
}

// Port of plates.py to JavaScript for p5.js
// Original code was for Processing/Python mode

function getGraphic_A(n, gelD) {
  if (n < 0) {
    n = 0;
  }
  n %= NBR_SHAPES;
  switch (n) {
    case 0:
      return makeRoweJALColorPlate();
    case 1:
      return makeSpiral(n, gelD);
    case 2:
      return makeSpokes(n, gelD);
    case 3:
      return makeSwirl(n, gelD);
    case 4:
      return makeFib(n, gelD);
    case 5:
      return makeWhitney(n, gelD);
    case 6:
      return makeZinnia(n, gelD);
    case 7:
      return makeTricorder(n, gelD, width * 146/286, -width * 119/286);
    case 8:
      return makeTricorder(n, gelD, 0, width * 32/286);
  }
}

function getGraphic_B(n) {
  if (n < 0) {
    n = 0;
  }
  n %= NBR_SHAPES;
  switch (n) {
    case 0:
      return makeRoweJALGrille();
    case 1:
      return makeSpiral(n);
    case 2:
      return makeSpokes(n);
    case 3:
      return makeSwirl(n);
    case 4:
      return makeFib(n);
    case 5:
      return makeWhitney(n);
    case 6:
      return makeZinnia(n);
    case 7:
      return makeTricorder(n, null, -width * 119/286, width * 110/286);
    case 8:
      return makeTricorder(n, null, 0, 0);
  }
}

function getColorGel(stripeNbr) {
  if (stripeNbr < 0) {
    stripeNbr = 0;
  }
  stripeNbr %= NBR_GELS;
  switch (stripeNbr) {
    case 0:
      return makeColorSpokes();
    case 1:
      return makeColorRings();
    case 2:
      return makeColorSpiral();
    case 3:
      return makeWhiteGel();
  }
  return elem;
}

function makeZinnia(n, gel = null) {
  const nbrSpokes = 12;
  const circMask = createGraphics(width, height);
  circMask.background(0);
  circMask.noStroke();
  circMask.fill(255);
  circMask.ellipseMode(RADIUS);
  circMask.circle(circMask.width / 2, circMask.height / 2, circMask.width / 2);
  
  const zinnia = createGraphics(width, height);
  zinnia.background(0);
  zinnia.noFill();
  zinnia.stroke(255);
  zinnia.strokeWeight(20);
  zinnia.strokeJoin(MITER);
  zinnia.push();
  zinnia.translate(zinnia.width / 2, zinnia.height / 2);
  const rad = zinnia.width / 2;
  let yOffset = 100;
  if (gel !== null) {
    yOffset = -yOffset;
  }
  for (let i = 0; i < nbrSpokes; i++) {
    zinnia.push();
    zinnia.rotate(i * TWO_PI / nbrSpokes);
    zinnia.beginShape();
    zinnia.vertex(0, 0);
    zinnia.quadraticVertex(rad / 4, yOffset * 0.4, rad / 2, 0);
    zinnia.vertex(3 * rad / 4, yOffset * 0.8);
    zinnia.quadraticVertex(7 * rad / 8, yOffset, rad, 0);
    zinnia.endShape();
    zinnia.pop();
  }
  zinnia.pop();
  zinnia.blendMode(DARKEST);
  zinnia.image(circMask, 0, 0);
  zinnia.blendMode(BLEND);
  if (gel !== null) {
    console.log("Color Spokes");
    zinnia.blendMode(DARKEST);
    zinnia.image(gel, 0, 0);
    zinnia.blendMode(BLEND);
  }
  return zinnia;
}

function makeSwirl(n, gel = null) {
  const nbrSpokes = 17; // play with this...
  let spokeWind = radians(90);
  if (gel !== null) {
    spokeWind = -spokeWind;
  }
  const spokeSegments = 32;
  const circMask = createGraphics(width, height);
  circMask.background(0);
  circMask.noStroke();
  circMask.fill(255);
  circMask.ellipseMode(RADIUS);
  circMask.circle(circMask.width / 2, circMask.height / 2, circMask.width / 2);
  
  const spokes = createGraphics(width, height);
  spokes.background(0);
  spokes.push();
  spokes.translate(spokes.width / 2, spokes.height / 2);
  const segWidth = width / 2 / spokeSegments;
  spokes.stroke(255);
  spokes.strokeWeight(4);
  spokes.noFill();
  for (let i = 0; i < nbrSpokes; i++) {
    spokes.push();
    spokes.rotate(i * TWO_PI / nbrSpokes);
    const dang = spokeWind / spokeSegments;
    let px = 0;
    let py = 0;
    for (let s = 0; s < spokeSegments; s++) {
      const ang = map(s, 0, spokeSegments, 0, spokeWind);
      const rad = map(s, 0, spokeSegments, 0, width / 2);
      const nx = cos(ang) * rad;
      const ny = sin(ang) * rad;
      spokes.line(px, py, nx, ny);
      px = nx;
      py = ny;
    }
    spokes.pop();
  }
  spokes.pop();
  
  spokes.blendMode(DARKEST);
  spokes.image(circMask, 0, 0);
  spokes.blendMode(BLEND);
  if (gel !== null) {
    console.log("Color Spokes");
    spokes.blendMode(DARKEST);
    spokes.image(gel, 0, 0);
    spokes.blendMode(BLEND);
  }
  return spokes;
}

function makeWhitney(n, gel = null) {
  const nbrRings = 32;
  
  const whit = createGraphics(width, height);
  whit.ellipseMode(RADIUS);
  whit.background(0);
  whit.push();
  whit.translate(whit.width / 2, whit.height / 2);
  whit.fill(255);
  whit.noStroke();
  const dotRad = width / 2.0 / nbrRings;
  for (let i = 1; i <= nbrRings; i++) {
    const rad = map(i, 0, nbrRings, 0, width / 2);
    const nbrDots = i;
    const rAng = radians(360 / nbrDots);
    for (let n = 1; n <= nbrDots; n++) {
      const cx = cos(rAng * n) * rad;
      const cy = sin(rAng * n) * rad;
      whit.circle(cx, cy, dotRad);
    }
  }
  whit.pop();
  if (gel !== null) {
    whit.blendMode(DARKEST);
    whit.image(gel, 0, 0);
    whit.blendMode(BLEND);
  }
  return whit;
}

function makeFib(n, gel = null) {
  const nbrSpots = 100;
  const phi = (sqrt(5) + 1) / 2 - 1;
  const goldenAngle = phi * TWO_PI;
  const lgRad = width * 0.45;
  const lgArea = sq(lgRad) * PI;
  const smArea = lgArea / nbrSpots;
  const smRad = sqrt(smArea / PI);
  const fudge = 0.5;
  const adjSmDiameter = smRad * 2 * fudge;
  
  const fib = createGraphics(width, height);
  fib.ellipseMode(RADIUS);
  fib.background(0);
  fib.push();
  fib.translate(fib.width / 2, fib.height / 2);
  fib.fill(255);
  fib.noStroke();
  for (let i = 1; i <= nbrSpots; i++) {
    const angle = i * goldenAngle;
    const cumArea = i * smArea;
    const spiralRad = sqrt(cumArea / PI);
    const x = cos(angle) * spiralRad;
    const y = sin(angle) * spiralRad;
    fib.circle(x, y, adjSmDiameter / 2);
  }
  fib.pop();

  if (gel !== null) {
    fib.blendMode(DARKEST);
    fib.image(gel, 0, 0);
    fib.blendMode(BLEND);
  }
  return fib;
}

function makeSpokes(n, gel = null) {
  const spokeColors = [color(255, 128, 128), color(128, 255, 128), color(128, 128, 255)];
  const nbrSpokes = 17; // play with this...
  
  const spokes = createGraphics(width, height);
  spokes.background(0);
  spokes.push();
  spokes.translate(spokes.width / 2, spokes.height / 2);
  for (let i = 0; i < nbrSpokes; i++) {
    spokes.push();
    spokes.rotate(i * TWO_PI / nbrSpokes);
    spokes.stroke(255);
    spokes.strokeWeight(4);
    spokes.noFill();
    spokes.line(0, 0, 0, spokes.width / 2);
    spokes.pop();
  }
  spokes.pop();

  if (gel !== null) {
    spokes.blendMode(DARKEST);
    spokes.image(gel, 0, 0);
    spokes.blendMode(BLEND);
  }

  return spokes;
}



function makeTricorder(n, gel = null, xOffset = 0, yOffset = 0) {
  const nbrSpokes = 127; // play with this...
  const spokes = createGraphics(width, height);
  spokes.background(0);
  spokes.ellipseMode(RADIUS);
  spokes.fill(255);
  spokes.ellipse(spokes.width / 2, spokes.height / 2, spokes.width / 2);
  spokes.push();
  spokes.translate(width/2 + xOffset, height/2 + yOffset);
  let spoke_angle = 2 * PI / nbrSpokes;
  let spoke_radius = width * 1.5;
  for (let i = 0; i < nbrSpokes; i++) {
    spokes.push();
    spokes.rotate(i * spoke_angle);
    spokes.fill(0);
    spokes.noStroke();
    spokes.beginShape();
    spokes.vertex(0, 0);
    spokes.vertex(cos(0)*spoke_radius, sin(0)*spoke_radius);
    spokes.vertex(cos(spoke_angle/2)*spoke_radius, sin(spoke_angle/2)*spoke_radius);
    spokes.endShape();
    spokes.pop();
  }
  spokes.pop();

  if (gel !== null) {
    spokes.blendMode(DARKEST);
    spokes.image(gel, 0, 0);
    spokes.blendMode(BLEND);
  }

  return spokes;
}

function makeWhiteGel() {
  const white = createGraphics(width, height);
  white.background(255);
  return white;
}

function makeColorRings() {
  const nbrRings = 12; // play with this...

  const spokeColors = [color(255, 128, 128), color(128, 255, 128), color(128, 128, 255)];
  const circMask = createGraphics(width, height);
  circMask.background(0);
  circMask.noStroke();
  circMask.fill(255);
  circMask.ellipseMode(RADIUS);
  circMask.circle(circMask.width / 2, circMask.height / 2, circMask.width / 2);
  
  const spokes = createGraphics(width, height);
  spokes.ellipseMode(RADIUS);
  spokes.background(0);
  spokes.push();
  spokes.translate(spokes.width / 2, spokes.height / 2);
  for (let i = 0; i < nbrRings; i++) {
    const r = map(i, 0, nbrRings - 1, width * 0.5, width / nbrRings);
    spokes.fill(spokeColors[i % spokeColors.length]);
    spokes.noStroke();
    spokes.circle(0, 0, r);
  }
  spokes.pop();
  spokes.blendMode(DARKEST);
  spokes.image(circMask, 0, 0);
  spokes.blendMode(BLEND);
  return spokes;
}

function makeColorSpokes() {
  const nbrSpokes = 17; // play with this...
  const widthSpokes = 150;

  const spokeColors = [color(255, 128, 128), color(128, 255, 128), color(128, 128, 255)];
  const circMask = createGraphics(width, height);
  circMask.background(0);
  circMask.noStroke();
  circMask.fill(255);
  circMask.ellipseMode(RADIUS);
  circMask.circle(circMask.width / 2, circMask.height / 2, circMask.width / 2);
  
  const spokes = createGraphics(width, height);
  spokes.background(0);
  spokes.push();
  spokes.translate(spokes.width / 2, spokes.height / 2);
  for (let i = 0; i < nbrSpokes; i++) {
    spokes.push();
    spokes.rotate(i * TWO_PI / nbrSpokes);
    spokes.fill(spokeColors[i % spokeColors.length]);
    spokes.noStroke();
    spokes.beginShape();
    spokes.vertex(0, 0);
    spokes.vertex(spokes.width / 2, -widthSpokes / 2);
    spokes.vertex(spokes.width / 2, widthSpokes / 2);
    spokes.endShape(CLOSE);
    spokes.pop();
  }
  spokes.pop();
  spokes.blendMode(DARKEST);
  spokes.image(circMask, 0, 0);
  spokes.blendMode(BLEND);
  return spokes;
}

function makeRoweJALColorPlate() {
  const circMask = createGraphics(width, height);
  circMask.background(0);
  circMask.noStroke();
  circMask.fill(255);
  circMask.ellipseMode(RADIUS);
  circMask.circle(circMask.width / 2, circMask.height / 2, circMask.width / 2);
  
  const spokes = createGraphics(width, height);
  spokes.background(0);
  spokes.noFill();
  spokes.stroke(255);
  spokes.strokeWeight(SLOT_WIDTH);
  drawRoweJALStarburst(spokes, true);
  return spokes;
}

function makeRoweJALGrille() {
  const grille = createGraphics(width, height);
  grille.background(0);
  grille.noFill();
  grille.stroke(255);
  grille.strokeWeight(SLOT_WIDTH);
  drawRoweJALStarburst(grille);
  return grille;
}

function drawRoweJALStarburst(graf, colorize = false) {
  const colorXOffset = 0; // -width * 0.04
  const spokeColors = [color(255, 128, 128), color(128, 255, 128), color(128, 128, 255)];
  for (let i = 0; i < 4; i++) {
    if (colorize) {
      if (i % 2 === 0) {
        graf.stroke(spokeColors[0]);
      } else {
        graf.stroke(spokeColors[2]);
      }
    }

    graf.push();
    graf.translate(width / 2 + (colorize ? colorXOffset : 0), height / 2);
    graf.rotate(radians(90) * i);
    const rad1 = width * 0.13;
    const rad2 = width * 0.45;
    const ang1 = radians(0);
    const ang2 = radians(60 / 2.0);
    const ox = 0;
    const oy = 0;
    // viceroy 1 - these are actually gently bowed out
    let vx1 = ox + cos(-ang1) * rad1;
    let vy1 = oy + sin(-ang1) * rad1;
    let vx2 = ox + cos(-ang2) * rad2;
    let vy2 = oy + sin(-ang2) * rad2;
    const bAng = radians(1);
    let cx1 = ox + cos(-ang2 - bAng) * (rad1 + rad2) / 3;
    let cy1 = ox + sin(-ang2 - bAng) * (rad1 + rad2) / 3;
    let cx2 = ox + cos(-ang2 - bAng) * 2 * (rad1 + rad2) / 3;
    let cy2 = ox + sin(-ang2 - bAng) * 2 * (rad1 + rad2) / 3;
    graf.bezier(vx1, vy1, cx1, cy1, cx2, cy2, vx2, vy2);
    vx1 = ox + cos(ang1) * rad1;
    vy1 = oy + sin(ang1) * rad1;
    vx2 = ox + cos(ang2) * rad2;
    vy2 = oy + sin(ang2) * rad2;
    cx1 = ox + cos(ang2 + bAng) * (rad1 + rad2) / 3;
    cy1 = ox + sin(ang2 + bAng) * (rad1 + rad2) / 3;
    cx2 = ox + cos(ang2 + bAng) * 2 * (rad1 + rad2) / 3;
    cy2 = ox + sin(ang2 + bAng) * 2 * (rad1 + rad2) / 3;
    graf.bezier(vx1, vy1, cx1, cy1, cx2, cy2, vx2, vy2);
    graf.pop();
  }
  for (let i = 0; i < 4; i++) {
    if (colorize) {
      graf.stroke(spokeColors[1]);
    }
    graf.push();
    graf.translate(width / 2 + (colorize ? colorXOffset : 0), height / 2);
    graf.rotate(radians(90) * i + radians(2));
    const ox = 0;
    const oy = 0;
    // viceroy 1 - very gently bowed in
    const rad1 = width * 0.17;
    const rad2 = width * 0.45;
    const rad3 = width * 0.34;
    const ang1 = radians(45);
    const ang2 = radians(5);
    const ang3 = radians(0);
    graf.line(ox + cos(-ang1) * rad1, oy + sin(-ang1) * rad1, ox + cos(-ang2) * rad2, oy + sin(-ang2) * rad2);
    graf.line(ox + cos(ang1) * rad1, oy + sin(ang1) * rad1, ox + cos(ang2) * rad2, oy + sin(ang2) * rad2);
    graf.line(ox + cos(ang3) * rad3, oy + sin(ang3) * rad3, ox + cos(ang2) * rad2, oy + sin(ang2) * rad2);
    graf.line(ox + cos(ang3) * rad3, oy + sin(ang3) * rad3, ox + cos(-ang2) * rad2, oy + sin(-ang2) * rad2);
    graf.pop();
  }
}

function makeSpiral(n, gel = null) {
  const spiral = createGraphics(width, height);
  spiral.background(0);
  spiral.noFill();
  spiral.stroke(255);
  spiral.strokeWeight(SLOT_WIDTH);
  drawSpiral(spiral, n, gel);
  return spiral;
}

function drawSpiral(graf, n, gel = null) {
  const spiralPoints = 400;
  const winds = gel === null ? 5 : -5;
  graf.push();
  graf.translate(width / 2, height / 2);
  graf.beginShape();
  
  // Add at least one vertex before curveVertex to define starting control point
  const firstPoint = {
    x: 0,
    y: 0
  };
  graf.vertex(firstPoint.x, firstPoint.y);
  
  for (let i = 1; i <= spiralPoints; i++) {
    let rr = map(i, 1, spiralPoints, 0, 1);
    rr = rr * rr;
    const rad = map(rr, 0, 1, 0, width * 0.5);
    const ang = map(i, 0, spiralPoints, 0, TWO_PI * winds);
    graf.curveVertex(cos(ang) * rad, sin(ang) * rad);
  }
  
  // Add last point again for final control point
  const lastIndex = spiralPoints;
  const lastRr = lastIndex * lastIndex / (spiralPoints * spiralPoints);
  const lastRad = map(lastRr, 0, 1, 0, width * 0.5);
  const lastAng = map(lastIndex, 0, spiralPoints, 0, TWO_PI * winds);
  graf.vertex(cos(lastAng) * lastRad, sin(lastAng) * lastRad);
  
  graf.endShape();
  graf.pop();
  if (gel !== null) {
    graf.blendMode(DARKEST);
    graf.image(gel, 0, 0);
    graf.blendMode(BLEND);
  }
}

function makeColorSpiral() {
  const nbrSpirals = 18;
  const spiralPoints = 40;
  const windAngle = 90;
  
  const spokeColors = [color(255, 128, 128), color(128, 255, 128), color(128, 128, 255)];
  const circMask = createGraphics(width, height);
  circMask.background(0);
  circMask.noStroke();
  circMask.fill(255);
  circMask.ellipseMode(RADIUS);
  circMask.circle(circMask.width / 2, circMask.height / 2, circMask.width / 2);
  
  const graf = createGraphics(width, height);
  graf.background(0);
  graf.push();
  graf.translate(graf.width / 2, graf.height / 2);
  for (let s = 0; s < nbrSpirals; s++) {
    graf.push();
    graf.rotate(s * TWO_PI / nbrSpirals);
    graf.fill(spokeColors[s % spokeColors.length]);
    graf.noStroke();
    graf.beginShape();
    for (let i = 1; i <= spiralPoints; i++) {
      let rr = map(i, 1, spiralPoints, 0, 1);
      rr = rr * rr;
      const rad = map(rr, 0, 1, 0, width * 0.5);
      const ang = map(i, 0, spiralPoints, 0, radians(windAngle));
      graf.vertex(cos(ang) * rad, sin(ang) * rad);
    }
    for (let i = spiralPoints; i > 0; i--) {
      let rr = map(i, 1, spiralPoints, 0, 1);
      rr = rr * rr;
      const rad = map(rr, 0, 1, 0, width * 0.5);
      const ang = TWO_PI / nbrSpirals + map(i, 0, spiralPoints, 0, radians(windAngle));
      graf.vertex(cos(ang) * rad, sin(ang) * rad);
    }
    graf.endShape();
    graf.pop();
  }
  graf.pop();
  graf.blendMode(DARKEST);
  graf.image(circMask, 0, 0);
  graf.blendMode(BLEND);
  return graf;
}