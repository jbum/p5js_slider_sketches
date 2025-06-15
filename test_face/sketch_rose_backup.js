let radii = [];
let values = [64,64,0,0,0,0,0,0];
let button_values = [0, 0, 0, 0, 0, 0, 0, 0];
const k_max_voices = 256;
const k_max_channels = 8;
const kDefaultVelocity = 64;
const maxPoints = k_max_voices;
const minPoints = 1;
let reversePitches = false;
let is_Rose = true;
let midNoteNumberF = 64;
let midNoteNumber = 64;
let nbrPoints = 32;         // Number of notes - current patch has 16 voice polyphony
let nbrPointsF = nbrPoints;
let lowestNoteNumber = midNoteNumber - nbrPoints/2;    // lowest MIDI pitch

let cycleLength = 3 * 60;   // Length of the full cycle in seconds
let durRange = cycleLength * 1000/nbrPoints;        // Duration range
let minDur = durRange/2;    // Minimum duration

const kWidth = 512;             // width of graphics
const kHeight = 512;            // height of graphics

let cx = kWidth/2, cy = kHeight/2;          // center coordinates
let circleRadius;  
let tines = [];        // keeps track of current position of note, by angle
let lastSound = [];     // keeps track of time last note sounded
// let isOn = [];
let energy = [];
let isMute = false;
let lastMS;

let gA;     // position of slowest dot, in radians
let gSpeed; // velocity of slowest dot, in radians per millisecond
let gDamp = 0.9;
let maxSpeed = 0.001; // 2*PI/((.5*60)*1000);
let minSpeed = -maxSpeed;
let minDamp = 0.5;
let maxDamp = 0.9999;
let gAlpha = .25;
let myRotation;
let tineQueue = [];
let curChannel = 0;
let max_oscillators = 48;
let oscillators = [];
let is_sound_on = false;
let myCanvas;


function setup() {
  let min_window_dimension = Math.min(windowWidth, windowHeight);
  userStartAudio();
  myCanvas = createCanvas(kWidth, kWidth, document.getElementById('sketch-canvas'));
  background(0);// noLoop();
  circleRadius = (Math.min(width, height) / 2) * 0.95;
  colorMode(HSB, 1);
  ellipseMode(RADIUS);
  // load vars here...
  circleRadius = (min(width,height)/2) * 0.95;
  colorMode(HSB,1);
  ellipseMode(RADIUS);
  gA = 0;
  gSpeed = 2 * Math.PI / (cycleLength * 1000);
  tines = new Array(maxPoints).fill(0);
  lastSound = new Array(maxPoints).fill(0);
  energy = new Array(maxPoints).fill(0);
  // isOn = new Array(maxPoints).fill(false);
  console.log("F");
  for (let i = 0; i < maxPoints; ++i) {
    tines[i] = -10;
    lastSound[i] = millis();
    // isOn[i] = false;
    energy[i] = 0;
  }
  lastMS = millis();
}

function beginSound() {
  if (!is_sound_on) {
    userStartAudio();
    console.log("starting sound");
    for (let i = 0; i < max_oscillators; ++i) {
      oscillators[i] = new p5.Oscillator('sine');
      oscillators[i].amp(0.0);
      oscillators[i].freq(freqAssign(i));
      oscillators[i].start();
    }
    is_sound_on = true;
  }
}

function endSound() {
  if (is_sound_on) {
    for (let i = 0; i < max_oscillators; ++i) {
      oscillators[i].amp(0.0);
    }
    is_sound_on = false;
  }
}

class Tine {
  constructor(idx, channel, pitch, vel) {
    this.idx = idx;
    this.pitch = pitch;
    this.channel = channel;
    this.vel = vel;
  }
  
  noteOn() {
    // console.log("sound the note");
  }
  
  noteOff() {
    // console.log("unsound the note");
  }
}

function pitchAssign(i) {
  if (reversePitches)
    return lowestNoteNumber+(nbrPoints-1)-i;
  else
    return lowestNoteNumber+i; 
}

function freqAssign(i) {
  let midiPitch = pitchAssign(i);
  let freq = 440 * Math.pow(2, (midiPitch - 69) / 12);
  return 55 * i;  freq;
}

function velAssign(i) {
  return kDefaultVelocity;
}

function channelAssign(i) {
  let chan = curChannel;
  curChannel = (curChannel + 1) % k_max_channels;
  return chan;
}

function slider_hook(slider_index, value) {
  if (slider_index >= 0 && slider_index < values.length) {
    values[slider_index] = value;
  }
  switch (slider_index) {
    case 0:
      gSpeed = map(value, 0, 127, minSpeed, maxSpeed);
      // saveVars()
      break;
    case 1:
      let v = value / 127.0;
      nbrPoints = Math.floor(map(v * v, 0, 1, minPoints, maxPoints));
      lowestNoteNumber = midNoteNumber - nbrPoints / 2;
      console.log("nbrPoints " + nbrPoints);
      // saveVars()
      break;
    case 6: // phase currently unused, not much effect
      // sendKnob(7, value);
      break;
    case 7:
      gDamp = map(value, 0, 127, minDamp, maxDamp);
      // saveVars()
      break;
  }

}

function button_hook(index, value) {
  console.log("button_hook", index, value);
  if (index >= 0 && index < button_values.length) {
    button_values[index] = value;
  }
  switch (index) {
    case 0:
      if (value > 64) {
        // myCanvas.mousePressed(beginSound);
        beginSound();
      } else {
        endSound();
      }
      break;
    case 1:
      is_Rose = value > 64;
      break;
    case 2:
      reversePitches = value > 64;
      // saveVars()
      break;
  }
}

function draw() {
  background(0,0,0,.05);
  // fill(0,0,0,gAlpha);
  // rect(0,0,width,height);
  // stroke(0.2);
  // line(cx, cy, width, cy); // delete this line of code to get rid of the graphical line
  let cMillis = millis();
  let elapsed = cMillis - lastMS;

  // Determine position of dots here...
  gA += gSpeed * elapsed;

  let pi2 = 2 * PI;
  noStroke();
  
  let maxRad = 10 * height / 500.0;
  let minRad = 2 * height / 500.0;
  
  // Empty the queue and process the note offs
  while (tineQueue.length > 0) {
    let tine = tineQueue.shift();
    tine.noteOff();
  }

  for (let i = 0; i < nbrPoints; ++i) {
    let r = (i + 1) / nbrPoints;
    let a = gA * (i + 1);
    let len = circleRadius * (1 + 1.0 / nbrPoints - r);
    // let sounded = false;
    if (!is_Rose && Math.floor(a / pi2) != Math.floor(tines[i] / pi2)) {
      // Sound Note Here...
      if (!isMute) {
        // console.log("Sending note " + i + ": " + pitchAssign(i));
        let tine = new Tine(i, channelAssign(i), pitchAssign(i), velAssign(i));
        tine.noteOn();
        tineQueue.push(tine);
        
        energy[i] = 255;
      }
      lastSound[i] = millis();
    }
    if (energy[i] >= 1.0) {
      energy[i] *= gDamp; // damping
    }

    // swap sin & cos here if you want the notes to sound on the top or bottom, instead of left or right
    // use -cos or -sin to flip the bar from right to left, or bottom to top
    let x;
    let y;
    let roseAng = i * 2 * PI / nbrPoints;
    let roseAmp = sin(gA * (i + 1));
    if (is_sound_on && i < max_oscillators) {
      let oscAmp = (roseAmp + 1) / 2;
      oscillators[i].amp(oscAmp);
    }
    if (is_Rose) {
      x = cx + cos(roseAng) * circleRadius*roseAmp;
      y = cy + sin(roseAng) * circleRadius*roseAmp;
    } else {
      x = cx + cos(a) * len;
      y = cy + sin(a) * len;
    }
    let mRad = map(r, 0, 1, maxRad, minRad); // maxRad*(width/500.0)-r*(16*width/500.0);
    let radv = map(energy[i], 255, 0, mRad + 12, mRad); // max( (mRad+12)-12*(cMillis-lastSound[i])/500.0 , mRad);
    if (is_Rose) {
      radv = 3;
    }

    let huev = r;
    let satv = map(energy[i], 255, 0, 0, 1); // min(.5, (cMillis-lastSound[i])/1000.0);
    let valv = 1;
    if (is_Rose) {
      satv = (roseAmp + 1) / 2;
      valv = 0.25 + 0.75 * ((roseAmp + 1) / 2);
    }
    
    fill(color(huev, satv, valv));
    ellipse(x, y, radv, radv);
    tines[i] = a;
  }
  lastMS = cMillis;
  
  // Feedback
  if (!is_Rose) {
    strokeWeight(3);
    stroke(255, 127);
    line(width / 2, height / 2, width, height / 2);
  }
}

function keyPressed() {
  if (key === ' ') {
    isMute = !isMute;
    console.log(isMute ? "MUTED" : "UNMUTED");
  }
}