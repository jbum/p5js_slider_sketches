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
  // Slider 7 (index 6) controls mouth width from 5 to face_radius-5
  let mouth_width = map(values[6], 0, 1, 5, face_width_radius-5);
  // Slider 8 (index 7) controls mouth curve from frown to straight line to smile
  // 0 = full frown, 0.5 = straight line, 1 = full smile
  let mouth_curve = values[7];

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

  // Draw mouth as a circular arc with fixed endpoints
  // Fix the y position of the mouth to be about 3/4 down the face
  const mouth_y = cHeight/2 + face_height_radius * 0.5;
  
  // Calculate the x positions of the mouth endpoints
  const left_x = cWidth/2 - mouth_width/2;
  const right_x = cWidth/2 + mouth_width/2;
  
  // Handle the case when mouth is very narrow
  if (mouth_width < 5) {
    // Just draw a horizontal line for a very small mouth
    line(left_x, mouth_y, right_x, mouth_y);
    return;
  }
  
  // Map mouth_curve from 0-1 to determine arc type:
  // 0.0 = full semicircle frown
  // 0.5 = straight line
  // 1.0 = full semicircle smile
  
  if (abs(mouth_curve - 0.5) < 0.01) {
    // Straight line (when mouth_curve is very close to 0.5)
    line(left_x, mouth_y, right_x, mouth_y);
  } else {
    // Determine if it's a smile or frown
    const isSmile = mouth_curve > 0.5;
    
    // Calculate how "full" the semicircle should be (0 to 1)
    // 0 = straight line, 1 = full semicircle
    const arcFullness = map(abs(mouth_curve - 0.5), 0, 0.5, 0, 1);
    
    // Maximum height a full semicircle would have
    const maxHeight = mouth_width / 2;
    
    // Scale the height based on the desired fullness
    const arcHeight = maxHeight * arcFullness;
    
    // For a chord of length mouth_width and a desired height arcHeight,
    // calculate the radius:
    // r = (h^2 + (c/2)^2) / (2h)
    const halfChord = mouth_width / 2;
    
    // Avoid division by zero (this should never happen with our constraints)
    const safeArcHeight = max(arcHeight, 0.1);
    const arcRadius = (pow(halfChord, 2) + pow(safeArcHeight, 2)) / (2 * safeArcHeight);
    
    // Calculate the center of the circle
    const arcCenterX = cWidth/2;
    let arcCenterY;
    
    if (isSmile) {
      // For a smile, the center is below the mouth
      arcCenterY = mouth_y + arcRadius - arcHeight;
    } else {
      // For a frown, the center is above the mouth
      arcCenterY = mouth_y - (arcRadius - arcHeight);
    }
    
    // Calculate the angle span of the arc
    const angleSpan = 2 * asin(halfChord / arcRadius);
    
    // Calculate start and end angles based on smile/frown
    let startAngle, endAngle;
    
    if (isSmile) {
      // For a smile (facing up)
      startAngle = PI + angleSpan/2;
      endAngle = TWO_PI - angleSpan/2;
    } else {
      // For a frown (facing down)
      startAngle = angleSpan/2;
      endAngle = PI - angleSpan/2;
    }
    
    // Draw the arc
    arc(arcCenterX, arcCenterY, arcRadius, arcRadius, startAngle, endAngle);
  }
}
