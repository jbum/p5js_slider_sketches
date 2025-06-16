let radii = [];
let loop_length = 12;
let frame_rate = loop_length;
let nbr_sides = 9;
let is_regular = false;
let iRadius_ratio = 0.25;
let cWidth = 0;
let cHeight = 0;
let values = [0.5, 0.5, 0.5, 0.5,
              0.5, 0.5, 0.5, 0.5];

function setup() {
  let min_window_dimension = Math.min(windowWidth, windowHeight);
  cWidth = 500;
  cHeight = cWidth;
  
  let myCanvas = createCanvas(cWidth, cWidth, document.getElementById('sketch-canvas'));
  ellipseMode(RADIUS);
  for (let i = 0; i < 200; ++i) {
    radii.push(0.2 + random(0.8));
  }
  frameRate(frame_rate);
  background(0);// noLoop();

}



function slider_hook(index, value) {
  if (index >= 0 && index < values.length) {
    values[index] = value / 127;
  }
}

function button_hook(index, value) {
  console.log("button_hook", index, value);
}

function draw() {
  let face_width_radius = values[0] * cWidth/2;
  let face_height_radius = values[1] * cWidth/2;
  let eye_y = values[2] * cWidth/2;
  let eye_width_radius = values[3] * face_width_radius/2;
  let eye_height_radius = values[4] * face_height_radius/2;
  let eye_distance = values[5] * face_height_radius;
  let mouth_width = values[6] * face_width_radius;
  let mouth_slope = (values[7] - 0.5) * face_height_radius;

  background(0);
  stroke(255);
  noFill();

  // draw face outline
  ellipse(cWidth/2, cHeight/2, face_width_radius, face_height_radius);

  // draw eyes
  fill(255);
  ellipse(cWidth/2 - eye_distance/2, eye_y, eye_width_radius/2, eye_height_radius/2);
  ellipse(cWidth/2 + eye_distance/2, eye_y, eye_width_radius/2, eye_height_radius/2);
  noFill();
  ellipse(cWidth/2 - eye_distance/2, eye_y, eye_width_radius, eye_height_radius);
  ellipse(cWidth/2 + eye_distance/2, eye_y, eye_width_radius, eye_height_radius);

  // draw mouth as a circular arc
  // Set a fixed chord length based on mouth_width
  const fixedChordLength = mouth_width;
  const mouth_center_y = cHeight/2 + face_height_radius/2;
  
  // Handle special cases where we can't draw a proper arc
  if (fixedChordLength < 5) {
    // Just draw a horizontal line for a very small mouth
    line(cWidth/2 - fixedChordLength/2, mouth_center_y, cWidth/2 + fixedChordLength/2, mouth_center_y);
  } else if (abs(mouth_slope) < 0.001) {
    // For nearly flat mouth, just draw a straight line
    line(cWidth/2 - fixedChordLength/2, mouth_center_y, cWidth/2 + fixedChordLength/2, mouth_center_y);
  } else {
    // Map mouth_slope to an arc height parameter
    // When mouth_slope is negative, the arc curves upward (smile)
    // When mouth_slope is positive, the arc curves downward (frown)
    const maxHeight = face_height_radius/3;
    let arcHeight = map(abs(mouth_slope), 0, face_height_radius/2, 0, maxHeight);
    arcHeight = constrain(arcHeight, 0, maxHeight);
    
    // Direction of the arc (up or down)
    const direction = mouth_slope < 0 ? -1 : 1;
    
    // Using the chord length and desired height, calculate the circle properties
    // For a chord of length c and a desired height h, the radius is:
    // r = (h^2 + (c/2)^2) / (2h)
    const halfChord = fixedChordLength / 2;
    
    // Avoid division by zero
    if (arcHeight < 0.1) {
      arcHeight = 0.1;
    }
    
    const arcRadius = (pow(arcHeight, 2) + pow(halfChord, 2)) / (2 * arcHeight);
    
    // Calculate the center point of the circle
    const arcCenterX = cWidth/2;
    const arcCenterY = mouth_center_y + direction * (arcRadius - arcHeight);
    
    // Calculate angles based on the chord
    const angleSpan = 2 * asin(halfChord / arcRadius);
    
    // Calculate start and end angles
    let startAngle, endAngle;
    if (direction < 0) { // Smile
      startAngle = PI + angleSpan/2;
      endAngle = TWO_PI - angleSpan/2;
    } else { // Frown
      startAngle = angleSpan/2;
      endAngle = PI - angleSpan/2;
    }
    
    // Draw the arc
    arc(arcCenterX, arcCenterY, arcRadius, arcRadius, startAngle, endAngle);
  }
}
