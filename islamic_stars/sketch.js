let polys = [];
 
let isInteractive = false; // turn off when you've found a good ratio for this tiling...
 
let minx = 10000, maxx = -10000, miny = 10000, maxy = -10000;
let dxs = 1;
let dys = 1;
let lm = 10;
let tm = 10;
let ratio = 1;
let angStar = (2 * Math.PI) / 18;  // 30 degrees
let edgeDist = 0.1;
let starEdge = 1000;
let currentTile = 0;
let mx = 0.5;
let my = 0.5;

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

// this crashes in certain situations...
function intersection(x1, y1, x2, y2, x3, y3, x4, y4) {
  let d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  try {
    //      let xi = ((x3-x4)*(x1*y2-y1*x2)-(x1-x2)*(x3*y4-y3*x4))/d;
    //      let yi = ((y3-y4)*(x1*y2-y1*x2)-(y1-y2)*(x3*y4-y3*x4))/d;
    let denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    let numea = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
    let numeb = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3);
    if (abs(denom) < 0.01) {
      if (numea == 0.0 && numeb == 0.0) {
        // coincident
        console.log("c");
        return new Point(x1, y1);
      } else {
        // parallel
        console.log("p");
        return null;
      }
    }
    let ua = numea / denom;
    let ub = numeb / denom;
    if (ua >= 0.0 && ua <= 1.0 && ub >= 0.0 && ub <= 1.0) {
      let xi = x1 + ua * (x2 - x1);
      let yi = y1 + ua * (y2 - y1);
      return new Point(xi, yi);
      // if (xi >= 0 && xi <= width && yi >= 0 && yi <= width) {
      //   return new Point(xi, yi);
      // } else {
      //   console.log("p2");
      //   return null;
      // }
    } else {
      // not intersecting - this works well...
      return new Point(x1, y1);
    }
  } catch (e) {
    console.log("e");
    return null;
  }
}

class Poly {
  constructor(idx, nbrSides) {
    this.idx = idx;
    this.nbrSides = nbrSides;
    this.pts = [];
  }

  AddDot(x, y) {
    this.pts.push(new Point(x, y));
  }

  doDraw() {
    if (this.outsideBorder()) {
      fill(0.5);
      return;
    }

    let r = sin(this.nbrSides * PI * 2 / 8.0);
    let g = sin(this.nbrSides * PI * 2 / 8.0 + 2);
    let b = sin(this.nbrSides * PI * 2 / 8.0 + 4);
    fill(0.9 + r * 0.1, 0.9 + g * 0.1, 0.9 + b * 0.1);
    noStroke();
    stroke(0.9 + r * 0.1, 0.9 + g * 0.1, 0.9 + b * 0.1);
    // stroke(0.8 + r * 0.1, 0.8 + g * 0.1, 0.8 + b * 0.1);

    let outStr = this.nbrSides + ",";
    beginShape();

    for (let i = 0; i <= this.nbrSides; ++i) {
      let pt = this.pts[i % this.nbrSides];
      vertex(tx(pt.x), ty(pt.y));
      if (i < this.nbrSides)
        outStr += pt.x + "," + pt.y + ",";
    }
    endShape();
    // console.log(outStr);

    stroke(0);


    for (let i = 0; i < this.nbrSides; ++i) {
      let p1 = this.pts[i % this.nbrSides];
      let p2 = this.pts[(i + 1) % this.nbrSides];
      let p3 = this.pts[(i + 2) % this.nbrSides];
      // Draw segment that starts at midpoint of p2,p1 and goes at angle p2,p1 + (PI-angStar)/2
      // to the point where it intersects segment that starts at midpoint of p2,p3 and goes at angle p2,p3-(PI-angStar)/2
      let mx1 = (p1.x + p2.x) / 2;
      let my1 = (p1.y + p2.y) / 2;
      mx1 += (p1.x - p2.x) * edgeDist;
      my1 += (p1.y - p2.y) * edgeDist;
      let mx2 = (p3.x + p2.x) / 2;
      let my2 = (p3.y + p2.y) / 2;
      mx2 += (p3.x - p2.x) * edgeDist;
      my2 += (p3.y - p2.y) * edgeDist;
      let ang1 = atan2(p2.y - p1.y, p2.x - p1.x) + (PI - angStar) / 2;
      let ang2 = atan2(p2.y - p3.y, p2.x - p3.x) - (PI - angStar) / 2;
      let ex1 = mx1 + cos(ang1) * starEdge;
      let ey1 = my1 + sin(ang1) * starEdge;
      let ex2 = mx2 + cos(ang2) * starEdge;
      let ey2 = my2 + sin(ang2) * starEdge;
      let ip = intersection(mx1, my1, ex1, ey1, mx2, my2, ex2, ey2);
      if (ip == null) {
        continue;
      }
      line(tx(mx1), ty(my1), tx(ip.x), ty(ip.y));
      line(tx(mx2), ty(my2), tx(ip.x), ty(ip.y));
      // Find point where these lines intersect, and draw line from mx1,my1 ix,iy   and mx2,my2,ix,iy
    }
  }

  outsideBorder() {
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < this.nbrSides; ++i) {
      let pt = this.pts[i % this.nbrSides];
      cx += tx(pt.x);
      cy += ty(pt.y);
    }
    cx /= this.nbrSides;
    cy /= this.nbrSides;
    let dx = cx - width/2;
    let dy = cy - height/2;
    return sqrt(dx*dx + dy*dy) > ratio*width/2;
  }
}

function setup() {
  let min_window_dimension = Math.min(windowWidth, windowHeight);
  myCanvas = createCanvas(600, 600);
  background(0);
  ellipseMode(RADIUS);
  colorMode(RGB, 1);
  smooth();
  strokeWeight(2);
  //   noLoop();
  polys = [];
  console.log("current tile is ", currentTile, tiling_data[currentTile].name);
  myLoadFile(tiling_data[currentTile].data);
  textFont('LadylikeBB');
}

function myLoadFile(tileData) {
  let vipts = [];
  minx = 10000;
  maxx = -10000;
  miny = 10000;
  maxy = -10000;
  
  // Parse the tileData array directly
  for (let i = 0; i < tileData.length; i++) {
    let num = tileData[i];
    num = int(num * 100) / 100;
    if (typeof num === 'number' && !isNaN(num)) {
      vipts.push(num);
    }
  }
  
  polys = [];
  let ipts = vipts;
  console.log("loaded " + vipts.length + " points");
  
  for (let i = 0; i < vipts.length;) {
    let nbrSides = Math.floor(ipts[i++]);
    let poly = new Poly(polys.length, nbrSides);
    for (let j = 0; j < nbrSides; j++) {
      let x = ipts[i + j * 2];
      let y = ipts[i + j * 2 + 1];
      if (x < minx) minx = x;
      if (x > maxx) maxx = x;
      if (y < miny) miny = y;
      if (y > maxy) maxy = y;
      poly.AddDot(x, y);
    }
    i += nbrSides * 2;
    polys.push(poly);
  }
  
  console.log("loaded " + polys.length + " polys, and " + vipts.length + " points");
  dxs = (width - lm * 2) / (maxx - minx);
  dys = (height - tm * 2) / (maxy - miny);
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
  // console.log("slider recieved ", slider_index, "value", value);
  switch (slider_index) {
    case 0:
      let last_currentTile = currentTile;
      currentTile = int(map(value, 0, 1.01, 0, tiling_data.length));
      if (currentTile !== last_currentTile) {
        console.log("current tile is ", currentTile, tiling_data[currentTile].name);
        myLoadFile(tiling_data[currentTile].data);
      }
      break;
    case 1:
      mx = value;
      console.log("mx is ", mx);
      break;
    case 2:
      my = value;
      console.log("my is ", my);
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
  console.log("button recieved ", index, "value", value);
}

function tx(x) {
  return (x - minx) * dxs + lm;
}

function ty(y) {
  return (y - miny) * dys + tm;
}

function myLine(x1, y1, x2, y2) {
  line(tx(x1), ty(y1), tx(x2), ty(y2));
}
function draw() {
  empty_slider_queue();
  empty_button_queue();
  background(0);

  angStar = 0.001 + mx * PI;
  edgeDist = my;
  // console.log("angstar = " + angStar + " lm = " + lm);
  // console.log("ratio = " + ratio);
  background(0);
  push();
  for (let i = 0; i < polys.length; ++i) {
    let poly = polys[i];
    poly.doDraw();
  }
  pop();
  fill(255);
  textSize(16);
  text(tiling_data[currentTile].name, 10, height-10);
  
}

let small_size = 512;
let large_size = 900;

function toggle_sketch_size() {
  let kWidth = width === small_size ? large_size : small_size;
  resizeCanvas(kWidth, kWidth);
}

function keyPressed() {
  if (key === 'x' || key === 'X') { 
    toggle_slider_visibility();
  } else if (key === 's' || key === 'S') {
    toggle_sketch_size();
  }
}