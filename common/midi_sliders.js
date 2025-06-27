// SLIDERS
//
// I'm aware that p5.js has a built-in slider object, but I don't like making sliders part of the
//  sketch - I wanted a single slider panel that I can reuse for all the projects.
//
// Each project has a slider_config.js file used to set the labels and ranges, and so on.
//
// This is NOT implemented in P5.js.  It could have been, but I wanted the actual sketch (that
//  these sliders control) to function as a standalone sketch, and while p5.js supports multiple 
// sketches, it is not pretty.  So this is implemented in basic javascript. This means that when
//  it calls the slider_hook and button_hook functions within the controlled sketch, the p5.js
//  context is not active.  So most of these sketches use queues to handle the slider/button
//  events, so that the actual processing of the value changes can occur inside the p5.js context.
//
// If you have MIDI control working, you can use X to hide the sliders, and then control your
//  sketch with your midi control surface without having to look at the sliders.
//

let midi = null; // global MIDIAccess object
let midiOutput = null; // global MIDI output port
let nbr_sliders = sliders_cfg.length;
console.log("init sliders nbr", nbr_sliders);

let sliders = [];
let buttons = [];
let lastRefreshTime = 0;
let animationFrameId = null;
let midi_mappings_cookie_name = "midi_mappings"; // Global cookie for MIDI mappings
let sliders_are_hidden = false;
let slider_bank = 0;
const sliders_per_bank = 8;
let nbr_slider_banks = 1 + Math.floor((sliders_cfg.length - 1) / sliders_per_bank);
let debug_verbose = false;

const max_visible_sliders = 8;
const kDefaultControlStart = 0x15;
let slider_controlNumbers = [kDefaultControlStart, kDefaultControlStart + 1, kDefaultControlStart + 2, kDefaultControlStart + 3,
                      kDefaultControlStart+4, kDefaultControlStart + 5, kDefaultControlStart + 6, kDefaultControlStart + 7];

// novation launch control specific colors
// this is obviously too specific for my specific device.  But I wanted button feedback :)
// this is why I don't do a ton of open-source software.  I don't have the time to make it work
// for everybody else...
const LC_COLOR_OFF = 0x0C;
const LC_COLOR_RED_LO = 0x0D;
const LC_COLOR_RED_HI = 0x0F;
const LC_COLOR_AMB_LO = 0x1D;
const LC_COLOR_AMB_HI = 0x3F;
const LC_COLOR_YEL_HI = 0x3E;
const LC_COLOR_GRN_LO = 0x1C;
const LC_COLOR_GRN_HI = 0x3C;
const lc_button_colors = [LC_COLOR_OFF, LC_COLOR_GRN_LO, LC_COLOR_RED_LO, LC_COLOR_AMB_LO];
const lc_draw_colors = ['none', 'rgba(0,255,0,0.5)', 'rgba(255,0,0,0.5)', 'rgba(255,255,0,0.5)'];

function toggle_slider_visibility() {
  sliders_are_hidden = !sliders_are_hidden;
  if (debug_verbose) {
    console.log("Sliders are now", sliders_are_hidden ? "hidden" : "visible");
  }
  // toggle display of sliders-canvas
  let sliders_canvas = document.getElementById('sliders-canvas');
  if (sliders_are_hidden) {
    sliders_canvas.style.display = 'none';
  } else {
    sliders_canvas.style.display = 'block';
  }
}

// Automatically determine the project-specific cookie name if not already defined
function determineProjectCookieName() {
  // If cookie_name is already defined in index.html, use that
  if (typeof cookie_name !== 'undefined') {
    return cookie_name;
  }
  
  // Otherwise, derive it from the URL path
  const pathname = window.location.pathname;
  
  // Extract the project name from the path
  // Example: "/rose_synth/" -> "rose_synth"
  let projectName = "";
  
  // Handle both root path and subdirectory paths
  if (pathname === "/" || pathname === "") {
    projectName = "root";
  } else {
    // Remove leading and trailing slashes, then split by slash
    const pathParts = pathname.replace(/^\/|\/$/g, "").split("/");
    // Use the first part as the project name
    projectName = pathParts[0] || "unknown";
  }
  
  // Create a consistent cookie name format
  return `${projectName}_settings_v1`;
}

function myMap(v, min, max, out_min, out_max) {
  return (v - min) * (out_max - out_min) / (max - min) + out_min;
}

function myConstrain(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function myMapConstrain(v, min, max, out_min, out_max) {
  return myConstrain(myMap(v, min, max, out_min, out_max), out_min, out_max);
}


class Button {
    constructor(b_config, idx, x, y, width = 40, height = 40, nbr_states = 2) {
        this.idx = idx;
        this.x = x;
        this.y = y;
        this.nbr_states = nbr_states;
        this.width = width;
        this.height = height;
        this.value = b_config.defaultVal;
        this.noteNumber = idx < 4? 9 + idx : 25 + (idx-4);
        this.isLearning = false;
        this.b_config = b_config;
        this.set_slider_bank = b_config.set_slider_bank === true;
    }

    render(ctx) {
        // Draw button background
        ctx.fillStyle = this.value ? 'rgba(100,100,255,0.5)' : '#444444';
        
        // Draw rounded rectangle
        const radius = this.width/2*.45;
        ctx.beginPath();
        ctx.moveTo(this.x + radius, this.y);
        ctx.lineTo(this.x + this.width - radius, this.y);
        ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + radius);
        ctx.lineTo(this.x + this.width, this.y + this.height - radius);
        ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - radius, this.y + this.height);
        ctx.lineTo(this.x + radius, this.y + this.height);
        ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - radius);
        ctx.lineTo(this.x, this.y + radius);
        ctx.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
        ctx.closePath();
        ctx.fill();
      
        if (this.value) {
          ctx.fillStyle = lc_draw_colors[this.value];
          ctx.fill();
        }

        if (this.isLearning) {
            ctx.fillStyle = 'rgba(0,255,0,0.5)';
            ctx.fill();
        }

      // Draw button name
      
        ctx.save();
        ctx.font = '16px LadylikeBB';
        ctx.fillStyle = '#AAAAAA';
        ctx.textAlign = 'center';
        ctx.fillText(this.b_config.name, this.x + this.width/2, this.y + this.height + 12);
        ctx.restore();
    }

    isPointInside(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    handleMouseEvent(x, y, isShiftDown) {
      if (isShiftDown) {
        // Enter learning mode
        this.isLearning = true;
        // Turn off learning mode for all other buttons
        for (let button of buttons) {
            if (button !== this) {
                button.isLearning = false;
            }
        }
        refreshCanvas();
        return;
      }

      this.value = (this.value + 1) % this.nbr_states;
      if (this.set_slider_bank) {
        slider_bank = this.value;
        refreshCanvas();
        if (debug_verbose) {
          console.log("slider_bank", slider_bank);
        }
      }
      button_hook(buttons.indexOf(this), this.value);
      sendNoteOn(this.noteNumber, lc_button_colors[this.value]);
      if (debug_verbose) {
        console.log("button_idx", this.idx, "value", this.value);
      }
    }

    setNoteNumber(note) {
        this.noteNumber = note;
        this.isLearning = false;
    }
}

class Slider {
    static kAdjustFade = 2000; // milliseconds
    static kDefaultControlStart = 0x15;

    constructor(s_config, idx, x, y, bank=0, width = 128, height = 10, index = 0) {
      this.idx = idx;
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.value = s_config.defaultVal;
      this.lastAdjusted = new Date();
      // this.controlNumber = Slider.kDefaultControlStart + index;
      this.isLearning = false;
      this.s_config = s_config;
      this.bank = bank;
    }

  render(ctx) {
      // console.log("sliders nbr", sliders.length);
      if (this.bank != slider_bank) {
        return;
      }
      // Draw slider background with rounded caps
      ctx.fillStyle = '#444444';
      // Draw the main bar
      ctx.fillRect(this.x, this.y, this.width, this.height);
      // Draw rounded caps
      ctx.beginPath();
      ctx.arc(this.x, this.y + this.height/2, this.height/2, 0, 2 * Math.PI);
      ctx.arc(this.x + this.width, this.y + this.height/2, this.height/2, 0, 2 * Math.PI);
      ctx.fill();
      
      // Calculate fade based on time since adjustment
      let timeSince = this.timeSinceAdjusted();
      let alpha = Math.max(0.55, 1.0 - (timeSince / Slider.kAdjustFade));
      
      // Draw slider thumb with fade effect
      if (this.isLearning) {
          ctx.fillStyle = `rgba(0,255,0,${alpha})`; // Green for learning mode
      } else {
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      }
      ctx.beginPath();
      ctx.ellipse(this.x + myMapConstrain(this.value, this.s_config.minVal, this.s_config.maxVal, 0, this.width), this.y + this.height/2, 8, 8, 0, 0, 2 * Math.PI);
      ctx.fill();

      // Draw slider name
      ctx.save();
      ctx.font = '16px LadylikeBB';
      ctx.fillStyle = '#AAAAAA';
      ctx.textAlign = 'center';
      ctx.fillText(this.s_config.name, this.x + this.width/2, this.y + this.height + 12);
      ctx.restore();
    }

    setValue(value) {
        this.value = value;
        this.lastAdjusted = new Date();
    }

    timeSinceAdjusted() {
        return new Date() - this.lastAdjusted;
    }

    isPointInThumb(x, y) {
        const thumbX = this.x + myMap(this.value, this.s_config.minVal, this.s_config.maxVal, 0, this.width);
        const thumbY = this.y + this.height/2;
        const dx = x - thumbX;
        const dy = y - thumbY;
        return (dx * dx + dy * dy) <= 64; // 8 * 8 = 64 (thumb radius squared)
    }

    handleMouseEvent(x, y, isShiftDown) {
      if (this.bank != slider_bank) {
        return;
      }
      if (isShiftDown) {
        // Enter learning mode
        this.isLearning = true;
        // Turn off learning mode for all other sliders
        for (let slider of sliders) {
            if (slider !== this) {
                slider.isLearning = false;
            }
        }
        refreshCanvas();
        return; // Don't update value in learning mode
      }

      // Convert mouse x to slider value
      if (debug_verbose) {
        console.log("x", x, "this.x", this.x, "this.x + this.width", this.x + this.width);
      }
      let newValue = myMapConstrain(x, this.x, this.x + this.width, this.s_config.minVal, this.s_config.maxVal);
      this.setValue(newValue);
    }

    setControlNumber(controlNumber) {
      slider_controlNumbers[self.idx % max_visible_sliders] = controlNumber;
      // this.controlNumber = controlNumber;
      this.isLearning = false;
    }
}

function onMIDISuccess(midiAccess) {
  console.log("MIDI ready!");
  midi = midiAccess;
  listInputsAndOutputs(midiAccess);
  startLoggingMIDIInput(midiAccess);
  
  // get the portID of the output that has 'Novation' somewhere in it's name.
  let novation_port_id = null;
  for (const entry of midiAccess.outputs) {
    if (entry[1].name.includes('Novation') || entry[1].name.includes('Launch Control')) {
      novation_port_id = entry[1].id;
      break;
    }
  }

  if (novation_port_id) {
    midiOutput = midiAccess.outputs.get(novation_port_id);
    if (debug_verbose) {
      console.log("Using Novation MIDI output:", midiOutput.name);
    }
  } else {
    // Store the first available output port
    for (const entry of midiAccess.outputs) {
      midiOutput = entry[1];
      if (debug_verbose) {
        console.log("Using MIDI output:", midiOutput.name);
      }
    }
  }
  read_slider_values_from_cookie();
}

function onMIDIFailure(msg) {
    console.error(`Failed to get MIDI access - ${msg}`);
}

// Helper function to get cookie by name
function getCookie(name) {
  const cookieStr = document.cookie;
  const cookieParts = cookieStr.split(';');
  for (let part of cookieParts) {
    const [cookieName, cookieValue] = part.trim().split('=');
    if (cookieName === name) {
      return cookieValue;
    }
  }
  return null;
}

// Read both cookies: local values and global MIDI mappings
function read_slider_values_from_cookie() {
  // Get the project-specific cookie name
  const projectCookieName = determineProjectCookieName();
  
  // First try to read MIDI mappings (global)
  const mappingsCookieValue = getCookie(midi_mappings_cookie_name);
  if (mappingsCookieValue) {
    try {
      const mappingsData = JSON.parse(mappingsCookieValue);
      if (debug_verbose) {
        console.log("MIDI mappings cookie data", mappingsData);
      }
      
      // Apply MIDI control mappings
      if (mappingsData.controls && mappingsData.controls.length) {
        for (let i = 0; i < mappingsData.controls.length && i < sliders.length; ++i) {
          sliders[i].setControlNumber(mappingsData.controls[i]);
        }
      }
      
      // Apply button note mappings
      if (mappingsData.buttonNotes && mappingsData.buttonNotes.length) {
        for (let i = 0; i < mappingsData.buttonNotes.length && i < buttons.length; ++i) {
          buttons[i].setNoteNumber(mappingsData.buttonNotes[i]);
        }
      }
    } catch (e) {
      console.error('Error parsing MIDI mappings cookie:', e);
    }
  }
  
  // Then read local project values
  const valuesCookieValue = getCookie(projectCookieName);

  if (valuesCookieValue) {
    try {
      const valuesData = JSON.parse(valuesCookieValue);
      if (debug_verbose) {
        console.log("Values cookie data", valuesData);
      }
      
      // Handle both old format (just values) and new format (values + controls)
      if (Array.isArray(valuesData)) {
        // Old format - just an array of values
        for (let i = 0; i < valuesData.length && i < sliders.length; ++i) {
          sliders[i].setValue(valuesData[i]);
          slider_hook(i, valuesData[i]);
        }
      } else {
        // New format with separate fields
        if (valuesData.values && valuesData.values.length) {
            valuesData.values.forEach((value, index) => {
              if (debug_verbose) {
                console.log(`slider ${index}: ${value}`);
              }
            });
        }
        if (valuesData.values && valuesData.values.length) {
          for (let i = 0; i < valuesData.values.length && i < sliders.length; ++i) {
            let v = valuesData.values[i];
            v = myConstrain(v, sliders[i].s_config.minVal, sliders[i].s_config.maxVal);
            sliders[i].setValue(v);
            slider_hook(i, v);
          }
        }
        
        // Load button states if available (only from local cookie)
        if (valuesData.buttonStates && valuesData.buttonStates.length) {
          for (let i = 0; i < valuesData.buttonStates.length && i < buttons.length; ++i) {
            buttons[i].value = valuesData.buttonStates[i];
            if (buttons[i].set_slider_bank) {
              slider_bank = buttons[i].value;
              refreshCanvas();
              if (debug_verbose) {
                console.log("slider_bank", slider_bank);
              }
            }
            button_hook(i, buttons[i].value);
            sendNoteOn(buttons[i].noteNumber, lc_button_colors[buttons[i].value]);
          }
        }
      }
    } catch (e) {
      console.error('Error parsing values cookie:', e);
    }
  } else {
    // Initialize all sliders and buttons with their default values
    for (let i = 0; i < sliders.length; ++i) {
      slider_hook(i, sliders[i].value);
    }
    
    for (let i = 0; i < buttons.length; ++i) {
      button_hook(i, buttons[i].value);
      sendNoteOn(buttons[i].noteNumber, lc_button_colors[buttons[i].value]);
    }
  }
}

// Save slider and button values to the local cookie
function save_values_to_cookie() {
  // Get the project-specific cookie name
  const projectCookieName = determineProjectCookieName();
  
  const data = {
    values: sliders.map(slider => slider.value),
    buttonStates: buttons.map(button => button.value)
  };
  const valuesStr = JSON.stringify(data);
  
  // Get the current path from window.location.pathname
  let currentPath = window.location.pathname;
  // Ensure the path ends with a slash
  if (!currentPath.endsWith('/')) {
    currentPath += '/';
  }
  document.cookie = projectCookieName + "=" + valuesStr + ";path=" + currentPath;
}

// Save MIDI mappings to the global cookie
function save_midi_mappings_to_cookie() {
  const data = {
    controls: slider_controlNumbers,
    buttonNotes: buttons.map(button => button.noteNumber)
  };
  const mappingsStr = JSON.stringify(data);
  
  // Use root path for global cookie
  document.cookie = midi_mappings_cookie_name + "=" + mappingsStr + ";path=/";
}

function listInputsAndOutputs(midiAccess) {
    for (const entry of midiAccess.inputs) {
      const input = entry[1];
      if (debug_verbose) {
        console.log(
        `Input port [type:'${input.type}']` +
          ` id:'${input.id}'` +
          ` manufacturer:'${input.manufacturer}'` +
          ` name:'${input.name}'` +
          ` version:'${input.version}'`,
        );
      }
    }
  
    for (const entry of midiAccess.outputs) {
      const output = entry[1];
      if (debug_verbose) {
        console.log(
          `Output port [type:'${output.type}'] id:'${output.id}' manufacturer:'${output.manufacturer}' name:'${output.name}' version:'${output.version}'`,
        );
      }
    }
}

function onMIDIMessage(event) {
    let str = `MIDI message received at timestamp ${event.timeStamp}[${event.data.length} bytes]: `;
    let channel = event.data[0] & 0x0F;
    let command = event.data[0] & 0xF0;
    let data1 = event.data[1];
    let data2 = event.data[2];

    if (command == 0xB0) {
      // console.log("control change", channel, data1, data2);
      
      // Check for learning mode first
      let learningSlider = sliders.find(slider => slider.isLearning);
      if (learningSlider) {
          learningSlider.setControlNumber(data1);
          learningSlider.setValue(data2);
          // slider_hook(sliders.indexOf(learningSlider), data2);
          save_midi_mappings_to_cookie(); // Only save MIDI mappings when learning
          save_values_to_cookie();        // Also save the new value
          refreshCanvas();
          return;
      }

      // Normal operation - find slider by control number
      let slider_idx = slider_controlNumbers.indexOf(data1);
      let targetSlider = sliders.find(slider => slider.idx % max_visible_sliders === slider_idx && slider.bank == slider_bank);
      if (debug_verbose) {
        console.log("slider tweak slider_idx, targetSlider", slider_idx, targetSlider);
      }
      if (targetSlider) {
        // convert from MIDI value to slider value
        let v = myMapConstrain(data2, 0, 127, targetSlider.s_config.minVal, targetSlider.s_config.maxVal);
        targetSlider.setValue(v);
        slider_hook(targetSlider.idx, v);
        save_values_to_cookie(); // Only save values during normal operation
        refreshCanvas();
      }
    } else if (command == 0x90 || command == 0x80) {
      // Handle both note-on and note-off
      // let velocity = command == 0x80 ? 0 : data2;
      
      // Check for learning mode first
      let learningButton = buttons.find(button => button.isLearning);
      if (learningButton) {
        learningButton.setNoteNumber(data1);
        save_midi_mappings_to_cookie(); // Only save MIDI mappings when learning
        refreshCanvas();
        return;
      }

      // Normal operation - find button by note number
      let targetButton = buttons.find(button => button.noteNumber === data1);
      if (targetButton && command == 0x90) {  // Only handle note-on messages
        targetButton.value = (targetButton.value + 1) % targetButton.nbr_states;  // Toggle the state
        if (targetButton.set_slider_bank) {
          slider_bank = targetButton.value;
          if (debug_verbose) {
            console.log("slider_bank", slider_bank);
          }
        }
        button_hook(buttons.indexOf(targetButton), targetButton.value);
        sendNoteOn(targetButton.noteNumber, lc_button_colors[targetButton.value]);
        save_values_to_cookie(); // Only save values during normal operation
        refreshCanvas();
      }
    } else if (command == 0xC0) {
      console.log("program change", channel, data1);
    } else if (command == 0xD0) {
      console.log("channel pressure", channel, data1);
    } else if (command == 0xE0) {
      console.log("pitch bend", channel, data1, data2);
    } else if (command == 0xF0) {
      console.log("sysex", channel, data1, data2);
    }
}
  
function startLoggingMIDIInput(midiAccess) {
    midiAccess.inputs.forEach((entry) => {
      entry.onmidimessage = onMIDIMessage;
    });
}
let myDC = undefined;

function refreshCanvas() {
    if (myDC == undefined) {
        return;
    }
    myDC.save();
    myDC.fillStyle = '#000000';
    myDC.fillRect(0, 0, myDC.canvas.width, myDC.canvas.height);
    
    // Find most recently adjusted slider
    let mostRecentTime = 10000;
    for (let slider of sliders) {
        let adjustTime = slider.timeSinceAdjusted();
        mostRecentTime = Math.min(mostRecentTime, adjustTime);
    }
    
    // Render all sliders
  for (let slider of sliders) {
        slider.render(myDC);
    }

    // Render all buttons
    for (let button of buttons) {
        button.render(myDC);
    }
    
    myDC.fillStyle = 'none';
    myDC.restore();

    // If any slider was adjusted recently, schedule another refresh
    if (mostRecentTime < 2000) {
        if (animationFrameId === null) {
            animationFrameId = requestAnimationFrame(() => {
                animationFrameId = null;
                refreshCanvas();
            });
        }
    }
}

let activeSlider = null;

function handleMouseDown(event) {
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const isShiftDown = event.shiftKey;

    // Check buttons first
    for (let button of buttons) {
        if (button.isPointInside(x, y)) {
            const wasLearningMode = isShiftDown;
            button.handleMouseEvent(x, y, isShiftDown);
            
            if (wasLearningMode) {
                save_midi_mappings_to_cookie(); // Save MIDI mappings if in learning mode
            } else {
                save_values_to_cookie(); // Save values in normal operation
            }
            
            refreshCanvas();
            return;
        }
    }

    // Then check sliders
    for (let slider of sliders) {
        if (slider.bank == slider_bank && slider.isPointInThumb(x, y)) {
          activeSlider = slider;  // Set the active slider for dragging
          if (debug_verbose) {
            console.log("pressed active slider", activeSlider);
          }
            const wasLearningMode = isShiftDown;
            slider.handleMouseEvent(x, y, isShiftDown);
            slider_hook(activeSlider.idx, slider.value);
           
            if (wasLearningMode) {
                save_midi_mappings_to_cookie(); // Save MIDI mappings if in learning mode
            } else {
                save_values_to_cookie(); // Save values in normal operation
            }
            
            refreshCanvas();
            break;
        }
    }
}

function handleMouseMove(event) {
    if (activeSlider) {
        const rect = event.target.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const isShiftDown = event.shiftKey;

        const wasLearningMode = isShiftDown;
        activeSlider.handleMouseEvent(x, y, isShiftDown);
        slider_hook(activeSlider.idx, activeSlider.value);
        
        if (wasLearningMode) {
            save_midi_mappings_to_cookie(); // Save MIDI mappings if in learning mode
        } else {
            save_values_to_cookie(); // Save values in normal operation
        }
        
        refreshCanvas();
    }
}

function handleMouseUp() {
    activeSlider = null;
}

function sendNoteOn(note, velocity) {
  if (midiOutput) {
    // Note On message: 0x90 (note on) + channel 0
    let sendMessage = [0x98, note, velocity];
    if (debug_verbose) {
      console.log("Sending MIDI message:", sendMessage);
    }
    midiOutput.send(sendMessage);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  let myCanvas = document.getElementById('sliders-canvas');
  myCanvas.width = 150;
  myCanvas.height = 500;
  myDC = myCanvas.getContext('2d');
  
  // Add mouse event listeners
  myCanvas.addEventListener('mousedown', handleMouseDown);
  myCanvas.addEventListener('mousemove', handleMouseMove);
  myCanvas.addEventListener('mouseup', handleMouseUp);
  myCanvas.addEventListener('mouseleave', handleMouseUp);
  myCanvas.addEventListener('touchstart', handleMouseDown);
  myCanvas.addEventListener('touchmove', handleMouseMove);
  myCanvas.addEventListener('touchend', handleMouseUp);
  
  // Initialize sliders (moved up by 50 pixels)
  let slider_x = (150-128)/2;
  let slider_top_y = 10;  // Changed from 60 to 10

  if (debug_verbose) {
    console.log("initialing # sliders", nbr_sliders);
  }
  for (let i = 0; i < nbr_sliders; i++) {
    let s_config = sliders_cfg[i];
    let bank = Math.floor(i / sliders_per_bank);
    let slider_y = (i % sliders_per_bank) * 50 + slider_top_y;
    if (debug_verbose) {
      console.log("slider_y i=", i, slider_y);
    }
    sliders.push(new Slider(s_config, i, slider_x, slider_y, bank));
  }
  console.log("initialized sliders", sliders.length);

  // Initialize buttons (2 rows of 4)
  let button_spacing_x = 8;
  let button_spacing_y = 16;
  
  let button_size = 30;
  let side_margin = 4;
  let button_start_x = side_margin + (150 - side_margin * 2 - (4 * (button_size + button_spacing_x) - button_spacing_x)) / 2;
  let button_start_y = 406;  // Position below sliders

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      let button_idx = row * 4 + col;
      let b_config = buttons_cfg[button_idx];
      let nbr_states = b_config.states || 2;
      let x = button_start_x + col * (button_size + button_spacing_x);
      let y = button_start_y + row * (button_size + button_spacing_y + 4);
      if (debug_verbose) {
        console.log("button_idx", button_idx, "x", x, "y", y, "nbr_states", nbr_states);
      }
      buttons.push(new Button(b_config, button_idx, x, y, button_size, button_size, nbr_states));
      }
  }
  
  // Request MIDI access with both input and output permissions
  try {
    navigator.requestMIDIAccess({ sysex: true, software: true }).then(onMIDISuccess, onMIDIFailure);
  } catch (error) {
    console.warn('MIDI access request failed:', error);
    // Continue without MIDI functionality
  }
  read_slider_values_from_cookie(); // This now reads both cookies
  refreshCanvas();
});

