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

  // draw mouth as a curve which goes thru
  beginShape();
  let nbr_points = 100;
  let mouse_start_x = cWidth/2 - mouth_width/2;
  let mouse_end_x = cWidth/2 + mouth_width/2;
  let mouse_center_y = cHeight/2 + face_height_radius/2;
  for (let i = 0; i < nbr_points; i++) {
    let t = i / nbr_points;
    let x = map(t,0,1,mouse_start_x,mouse_end_x);
    let y = mouse_center_y + mouth_slope * sin(i * PI/nbr_points);
    vertex(x, y);
  }
  endShape();
}
