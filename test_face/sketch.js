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
  let mouth_start_x = cWidth/2 - mouth_width/2;
  let mouth_end_x = cWidth/2 + mouth_width/2;
  let mouth_center_y = cHeight/2 + face_height_radius/2;
  
  // Handle special cases where we can't draw a proper arc
  if (mouth_width < 5) {
    // Just draw a horizontal line for a very small mouth
    line(mouth_start_x, mouth_center_y, mouth_end_x, mouth_center_y);
  } else if (abs(mouth_slope) < 0.001) {
    // For nearly flat mouth, just draw a straight line
    line(mouth_start_x, mouth_center_y, mouth_end_x, mouth_center_y);
  } else {
    // Map mouth_slope to an arc fraction ranging from 0.01 to 0.5 (of a circle)
    // When mouth_slope is negative, the arc curves upward (smile)
    // When mouth_slope is positive, the arc curves downward (frown)
    let arcFraction = map(abs(mouth_slope), 0, face_height_radius/2, 0.01, 0.5);
    
    // Ensure arcFraction is within safe bounds to avoid extreme values
    arcFraction = constrain(arcFraction, 0.01, 0.5);
    
    // Calculate arc radius based on mouth width and desired arc fraction
    let arcRadius = (mouth_width/2) / sin(arcFraction * PI);
    
    // Constrain the radius to a reasonable size to avoid extreme values
    arcRadius = constrain(arcRadius, 0, cWidth * 5);
    
    // Calculate center of the circle based on whether it's a smile or frown
    let arcCenterY;
    if (mouth_slope < 0) {
      // Smile - arc center is below the mouth points
      arcCenterY = mouth_center_y + sqrt(arcRadius*arcRadius - pow(mouth_width/2, 2));
    } else {
      // Frown - arc center is above the mouth points
      arcCenterY = mouth_center_y - sqrt(arcRadius*arcRadius - pow(mouth_width/2, 2));
    }
    
    // Calculate the start and end angles of the arc
    let startAngle, endAngle;
    if (mouth_slope < 0) {
      // Smile
      startAngle = PI + arcFraction * PI;
      endAngle = TWO_PI - arcFraction * PI;
    } else {
      // Frown
      startAngle = arcFraction * PI;
      endAngle = PI - arcFraction * PI;
    }
    
    // Draw the arc
    arc(cWidth/2, arcCenterY, arcRadius, arcRadius, startAngle, endAngle);
  }
}
