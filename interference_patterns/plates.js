// Port of plates.py to JavaScript for p5.js
// Original code was for Processing/Python mode

const NBR_SHAPES = 7;

function getColorMask(n, gelD) {
  if (n < 0) {
    n = 0;
  }
  n %= NBR_SHAPES;
  if (n === 0) {
    console.log("plate rowe_ami");
    return makeRoweJALColorPlate();
  } else if (n === 1) {
    console.log("plate spiral");
    return makeSpiral(n, gelD);
  } else if (n === 2) {
    console.log("plate spokes");
    return makeSpokes(n, gelD);
  } else if (n === 3) {
    console.log("plate swirl");
    return makeSwirl(n, gelD);
  } else if (n === 4) {
    console.log("plate fib");
    return makeFib(n, gelD);
  } else if (n === 5) {
    console.log("plate whit");
    return makeWhitney(n, gelD);
  } else if (n === 6) {
    console.log("zinnia");
    return makeZinnia(n, gelD);
  }
}

function getGrille(n) {
  if (n < 0) {
    n = 0;
  }
  n %= NBR_SHAPES;
  if (n === 0) {
    console.log("grille rowe_ami");
    return makeRoweJALGrille();
  } else if (n === 1) {
    console.log("grille spiral");
    return makeSpiral(n);
  } else if (n === 2) {
    console.log("grille spokes");
    return makeSpokes(n);
  } else if (n === 3) {
    console.log("grille swirl");
    return makeSwirl(n);
  } else if (n === 4) {
    console.log("grille fib");
    return makeFib(n);
  } else if (n === 5) {
    console.log("grille whit");
    return makeWhitney(n);
  } else if (n === 6) {
    console.log("zinnia");
    return makeZinnia(n);
  }
}

function getColorGel(stripeNbr) {
  if (stripeNbr < 0) {
    stripeNbr = 0;
  }
  stripeNbr %= 3;
  let elem;
  if (stripeNbr === 0) {
    elem = makeColorSpokes();
  } else if (stripeNbr === 1) {
    elem = makeColorRings();
  } else if (stripeNbr === 2) {
    elem = makeColorSpiral();
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

const SLOT_WIDTH = 7;

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
  for (let i = 1; i <= spiralPoints; i++) {
    let rr = map(i, 1, spiralPoints, 0, 1);
    rr = rr * rr;
    const rad = map(rr, 0, 1, 0, width * 0.5);
    const ang = map(i, 0, spiralPoints, 0, TWO_PI * winds);
    graf.curveVertex(cos(ang) * rad, sin(ang) * rad);
  }
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