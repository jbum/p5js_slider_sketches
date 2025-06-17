let radii = [];
let values = [64,64,0,0,0,0,0,0];
let button_values = [0, 0, 0, 0, 0, 0, 0, 0];
const k_max_voices = 256;
const k_max_channels = 8;
const kDefaultVelocity = 64;
const maxPoints = k_max_voices;
const minPoints = 1;

// flags controlled by buttons
let is_sound_on = false; // button 1
let is_Rose = false; // button 2
let reversePitches = false; // button 3
let use_harmonics = false; // button 4
let use_blur = false; // button 5
let use_trails = false; // button 6

// gSpeed is slider 1
let gSpeed; // velocity of slowest dot, in radians per millisecond, slider 1
let nbrPoints = 32;   // slider 2
let blur_amount = 2; // slider 3
let trail_alpha = 0.1; // slider 4

let midNoteNumberF = 54;
let midNoteNumber = 54;
let nbrPointsF = nbrPoints;
let lowestNoteNumber = midNoteNumber - nbrPoints/2;    // lowest MIDI pitch

let cycleLength = 3 * 60;   // Length of the full cycle in seconds
let durRange = cycleLength * 1000/nbrPoints;        // Duration range
let minDur = durRange/2;    // Minimum duration

let kWidth = 512;             // width of graphics
let kHeight = 512;            // height of graphics

let tines = [];        // keeps track of current position of note, by angle
let lastSound = [];     // keeps track of time last note sounded
// let isOn = [];
let energy = [];
let isMute = false;
let lastMS;

let gA;     // position of slowest dot, in radians
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
let myCanvas;


function setup() {
  let min_window_dimension = Math.min(windowWidth, windowHeight);
  userStartAudio();
  myCanvas = createCanvas(kWidth, kWidth, document.getElementById('sketch-canvas'));
  background(0);
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

function reinit_Sound() {
  if (is_sound_on) {
    // repitch the oscillators
    for (let i = 0; i < max_oscillators; ++i) {
      oscillators[i].freq(freqAssign(i));
    }
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
    this.env = new p5.Envelope(0.01, 0.5, 4.0, 0.05);
  }
  
  noteOn() {
    if (this.idx < max_oscillators && is_sound_on) {
      let env = new p5.Envelope(0.01, 0.5, 4.0, 0.1);
      env.play(oscillators[this.idx]);
    }
    // console.log("sound the note");
  }
  
  noteOff() {
    // if (this.idx < max_oscillators && is_sound_on) {
    //   oscillators[this.idx].amp(0);
    // }
  }
}

function pitchAssign(i) {
  if (reversePitches) {
    return (nbrPoints - 1) - i;
  }
  else {
    return i;
  }
}

function freqAssign(i) {
  if (use_harmonics) {
    return 55 * (pitchAssign(i)+1);
  } else {
    let midiPitch = pitchAssign(i) + lowestNoteNumber;
    let freq = 440 * Math.pow(2, (midiPitch - 69) / 12);
    return freq;
  }
}

function velAssign(i) {
  return kDefaultVelocity;
}

function channelAssign(i) {
  let chan = curChannel;
  curChannel = (curChannel + 1) % k_max_channels;
  return chan;
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
  switch (slider_index) {
    case 0: // speed
      let easedValue = (value * value) * (value < 0? -1 : 1);
      gSpeed = map(easedValue, -1, 1, minSpeed, maxSpeed);
      // saveVars()
      break;
    case 1:
      let v = value ;
      nbrPoints = int(map(v * v, 0, 1, minPoints, maxPoints));
      lowestNoteNumber = midNoteNumber - nbrPoints / 2;
      console.log("nbrPoints " + nbrPoints);
      // saveVars()
      break;
    case 2:
      blur_amount = map(value, 0, 1, 0, 10);
      break;
    case 3:
      let fValue = value;
      fValue = fValue * fValue;
      trail_alpha = fValue;
      // console.log("trail_alpha " + trail_alpha);
      break;
    case 6: // phase currently unused, not much effect
      // sendKnob(7, value);
      break;
    case 7:
      gDamp = map(value, 0, 1, minDamp, maxDamp);
      // saveVars()
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
  console.log("recv button_hook", index, value);
  if (index >= 0 && index < button_values.length) {
    button_values[index] = value;
  }
  switch (index) {
    case 0:
      if (value > 0) {
        // myCanvas.mousePressed(beginSound);
        beginSound();
      } else {
        endSound();
      }
      break;
    case 1:
      is_Rose = value > 0;
      background(0, 0, 0);
      console.log("is_Rose", is_Rose);
      break;
    case 2:
      reversePitches = value > 0;
      reinit_Sound();
      // console.log("reversePitches " + reversePitches);
      // saveVars()
      break;
    case 3:
      use_harmonics = value > 0;
      reinit_Sound();
      break;
    case 4:
      use_blur = value > 0;
      break;
    case 5:
      use_trails = value > 0;
      break;
  }
}

function draw() {
  empty_slider_queue();
  empty_button_queue();
  let circleRadius = (min(width,height)/2) * 0.95;
  let cx = width/2, cy = height/2;          // center coordinates

  // console.log("draw");
  if (use_blur) {
    // apply blur filter
    filter(BLUR, blur_amount);
    if (use_trails) {
      background(0,0,0,trail_alpha);
    }
  } else if (use_trails) {
    background(0,0,0,trail_alpha);
  } else {
    background(0,0,0);
  }
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
  // console.log("nbrPoints " + nbrPoints);
  for (let i = 0; i < nbrPoints; ++i) {
    let r = (i + 1) / nbrPoints;
    let a = gA * (i + 1);
    let len = circleRadius * (1 + 1.0 / nbrPoints - r);
    // let sounded = false;
    if (Math.floor(a / pi2) != Math.floor(tines[i] / pi2) ||
        (is_Rose && Math.floor(a / PI) != Math.floor(tines[i] / PI))) {
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
    // if (is_sound_on && is_Rose && i < max_oscillators) {
    //   let oscAmp = (roseAmp + 1) / 2;
    //   oscillators[i].amp(oscAmp);
    // }
    if (is_Rose) {
      x = cx + cos(roseAng) * circleRadius*roseAmp;
      y = cy + sin(roseAng) * circleRadius*roseAmp;
    } else {
      x = cx + cos(a) * len;
      y = cy + sin(a) * len;
    }
    let mRad = map(r, 0, 1, maxRad, minRad); // maxRad*(width/500.0)-r*(16*width/500.0);
    if (is_Rose) {
      mRad = 3;
    }
    let radv = map(energy[i], 255, 0, mRad + (is_Rose? 2 : 7), mRad); // max( (mRad+12)-12*(cMillis-lastSound[i])/500.0 , mRad);

    let huev = r;
    let satv = map(energy[i], 255, 0, 0, 1); // min(.5, (cMillis-lastSound[i])/1000.0);
    let valv = 1;
    
    fill(color(huev, satv, valv));
    ellipse(x, y, radv, radv);
    tines[i] = a;
  }
  lastMS = cMillis;
  
  // Line
  if (!is_Rose) {
    strokeWeight(0.5);
    stroke(0, 0, 1, .5);
    line(width / 2, height / 2, width, height / 2);
  }
}

let small_size = 512;
let large_size = 900;

function toggle_sketch_size() {
  kWidth = kWidth === small_size ? large_size : small_size;
  kHeight = kWidth;

  resizeCanvas(kWidth, kHeight);
}


function keyPressed() {
  if (key === ' ') {
    isMute = !isMute;
    console.log(isMute ? "MUTED" : "UNMUTED");
  }
  if (key === 'x' || key === 'X') {
    toggle_slider_visibility();
  } else if (key === 's' || key === 'S') {
    toggle_sketch_size();
  }
}