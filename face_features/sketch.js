let values = [0.7, 0.87, 0.8, 0.4,
              0.25, 0.67, 0.8, 0.89];

function setup() {
  createCanvas(500, 500);
  ellipseMode(RADIUS);
  background(0);// noLoop();
}

function slider_hook(index, value) {
  if (index >= 0 && index < values.length) {
    values[index] = value;
  }
}

function button_hook(index, value) {
  console.log("button_hook", index, value);
}

function draw() {
  let face_width_radius = values[0] * width/2;
  let face_height_radius = values[1] * width/2;
  let eye_y = values[2] * width/2;
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
  ellipse(width/2, height/2, face_width_radius, face_height_radius);

  // draw eyes
  fill(255);
  ellipse(width/2 - eye_distance/2, eye_y, eye_width_radius/2, eye_height_radius/2);
  ellipse(width/2 + eye_distance/2, eye_y, eye_width_radius/2, eye_height_radius/2);
  noFill();
  ellipse(width/2 - eye_distance/2, eye_y, eye_width_radius, eye_height_radius);
  ellipse(width/2 + eye_distance/2, eye_y, eye_width_radius, eye_height_radius);

  // Define fixed mouth endpoint positions (the dimples)
  const mouth_dimple_y = height/2 + face_height_radius * 0.5; // Fixed y position for dimples
  const left_x = width/2 - mouth_width/2;
  const right_x = width/2 + mouth_width/2;
  
  // The endpoints of the mouth never move
  const leftPoint = { x: left_x, y: mouth_dimple_y };
  const rightPoint = { x: right_x, y: mouth_dimple_y };
  
  // Handle the case when mouth is very narrow
  if (mouth_width < 5) {
    // Just draw a horizontal line for a very small mouth
    line(leftPoint.x, leftPoint.y, rightPoint.x, rightPoint.y);
  } else {
  
    // Map mouth_curve from 0-1 to determine arc type:
    // 0.0 = full semicircle frown
    // 0.5 = straight line
    // 1.0 = full semicircle smile
    
    if (abs(mouth_curve - 0.5) < 0.01) {
      // Straight line (when mouth_curve is very close to 0.5)
      line(leftPoint.x, leftPoint.y, rightPoint.x, rightPoint.y);
    } else {
      // Determine if it's a smile or frown
      const isSmile = mouth_curve > 0.5;
      
      // Calculate the maximum displacement of the center point
      // For a true semicircle, the displacement would be half the width
      const maxDisplacement = mouth_width / 2;
      
      // Calculate the actual displacement based on the curve value (0 to maxDisplacement)
      // 0.5 = no displacement (straight line)
      // 0.0 or 1.0 = maximum displacement (semicircle)
      const displacement = map(abs(mouth_curve - 0.5), 0, 0.5, 0, maxDisplacement);
      
      // Calculate the center point of the mouth
      const centerX = width / 2;
      let centerY;
      
      if (isSmile) {
        // For a smile, the center point is below the straight line
        centerY = mouth_dimple_y + displacement;
      } else {
        // For a frown, the center point is above the straight line
        centerY = mouth_dimple_y - displacement;
      }
      
      // Draw the mouth with a quadratic Bezier curve
      // This ensures the curve always passes through the fixed endpoints
      // and the variable center point
      beginShape();
      vertex(leftPoint.x, leftPoint.y);  // Start at left endpoint
      
      // Use quadratic Bezier to create the curve
      // The control point is directly below/above the midpoint
      const controlX = centerX;
      const controlY = centerY;
      
      // Draw with a good number of segments for smooth curve
      const segments = 30;
      for (let i = 1; i < segments; i++) {
        const t = i / segments;
        
        // Quadratic Bezier formula: B(t) = (1-t)²*P0 + 2(1-t)t*P1 + t²*P2
        // where P0 = left endpoint, P1 = control point, P2 = right endpoint
        const oneMinusT = 1 - t;
        const x = oneMinusT * oneMinusT * leftPoint.x +
          2 * oneMinusT * t * controlX +
          t * t * rightPoint.x;
        
        const y = oneMinusT * oneMinusT * leftPoint.y +
          2 * oneMinusT * t * controlY +
          t * t * rightPoint.y;
        
        vertex(x, y);
      }
      
      vertex(rightPoint.x, rightPoint.y);  // End at right endpoint
      endShape();
    }
    
  }
}

let small_size = 500;
let large_size = 900;
let current_size = small_size;

function toggle_sketch_size() {
  let cw = width === small_size ? large_size : small_size;
  resizeCanvas(cw, cw);
}


function keyPressed() {
  if (key === 'x' || key === 'X') {
    toggle_slider_visibility();
  } else if (key === 's' || key === 'S') {
    toggle_sketch_size();
  }
}