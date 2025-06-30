         // height of graphics



function get_modified_color(clr, desired_lum) {
  // convert clr to hsl, set l to desired_lum, convert back to rgb
  colorMode(HSL, 360, 1, 1);
  let h = hue(clr);
  let s = saturation(clr);
  let l = desired_lum;
  let new_clr = color(h, s, l);
  colorMode(RGB, 255, 255, 255);
  return new_clr;
}

class Ball {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.dark_color = get_modified_color(color, 0.25);
    this.light_color = get_modified_color(color, 0.75);
    // make a radial gradient center on radius/2,radius/2 with radius of radius that goes from color to dark color
    this.gradient = createGraphics(this.radius, this.radius);
  }
  draw() {
    push();
    translate(this.x, this.y);
    noStroke();
    fill(this.color);
    fillGradient('radial', {from:[this.radius*.33, this.radius*.33, 0], to:[this.radius/2, this.radius/2, this.radius*2.5], steps:[this.dark_color, this.light_color]});
    ellipse(0, 0, this.radius, this.radius);
    noStroke();
    fill(this.light_color);
    ellipse(this.radius/2, -this.radius/2, this.radius*.1, this.radius*.1);
    pop();
  }
}

let balls = [];
let kNbrBalls = 10;

function slider_hook(slider_index, value) {
  console.log("slider recieved ", slider_index, "value", value);
}

function button_hook(button_index, value) {
  console.log("button recieved ", button_index, "value", value);
}

function setup() {
  let min_window_dimension = Math.min(windowWidth, windowHeight);
  myCanvas = createCanvas(512, 512);
  background(0);
  ellipseMode(RADIUS);
  for (let i = 0; i < kNbrBalls; i++) {
    let x = random(50, width-50); 
    let y = random(50, height-50);
    let radius = random(10, 50);
    colorMode(HSL, 255, 255, 255);
    let clr = color(random(255), random(255), 128);
    colorMode(RGB, 255, 255, 255);
    balls.push(new Ball(x, y, radius, clr));
  }
}



function draw() {
  background(0);

  
  // draw a series of 8 dots, representing the values of the sliders
  stroke(255);
  for (let ball of balls) {
    ball.draw();
  }
}

