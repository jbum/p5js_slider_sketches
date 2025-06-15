let midi = null; // global MIDIAccess object
let midiOutput = null; // global MIDI output port
let nbr_sliders = 8;
let sliders = [];
let buttons = [];
let lastRefreshTime = 0;
let animationFrameId = null;

class Button {
    constructor(x, y, width = 40, height = 40) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.value = false;
        this.noteNumber = 0;
        this.isLearning = false;
    }

    render(ctx) {
        // Draw button background
        ctx.fillStyle = this.value ? 'rgba(100,100,255,0.5)' : '#444444';
        
        // Draw rounded rectangle
        const radius = 8;
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

        if (this.isLearning) {
            ctx.fillStyle = 'rgba(0,255,0,0.5)';
            ctx.fill();
        }
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
            return false;
        }

        this.value = !this.value;
        if (this.value) {
            button_hook(buttons.indexOf(this), 127);
            sendNoteOn(this.noteNumber, 0x7F);
        } else {
            button_hook(buttons.indexOf(this), 0);
            sendNoteOn(this.noteNumber, 0x00);
        }
        return true;
    }

    setNoteNumber(note) {
        this.noteNumber = note;
        this.isLearning = false;
    }
}

class Slider {
    static kAdjustFade = 2000; // milliseconds
    static kDefaultControlStart = 0x15;

    constructor(x, y, width = 128, height = 10, index = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.value = 0;
        this.lastAdjusted = new Date();
        this.controlNumber = Slider.kDefaultControlStart + index;
        this.isLearning = false;
    }

    render(ctx) {
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
        let alpha = Math.max(0.25, 1.0 - (timeSince / Slider.kAdjustFade));
        
        // Draw slider thumb with fade effect
        if (this.isLearning) {
            ctx.fillStyle = `rgba(0,255,0,${alpha})`; // Green for learning mode
        } else {
            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        }
        ctx.beginPath();
        ctx.ellipse(this.x + this.value, this.y + this.height/2, 8, 8, 0, 0, 2 * Math.PI);
        ctx.fill();
    }

    setValue(value) {
        this.value = value;
        this.lastAdjusted = new Date();
    }

    timeSinceAdjusted() {
        return new Date() - this.lastAdjusted;
    }

    isPointInThumb(x, y) {
        const thumbX = this.x + this.value;
        const thumbY = this.y + this.height/2;
        const dx = x - thumbX;
        const dy = y - thumbY;
        return (dx * dx + dy * dy) <= 64; // 8 * 8 = 64 (thumb radius squared)
    }

    handleMouseEvent(x, y, isShiftDown) {
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
            return false; // Don't update value in learning mode
        }

        // Convert mouse x to slider value
        let newValue = Math.max(0, Math.min(127, Math.round(x - this.x)));
        this.setValue(newValue);
        return true;
    }

    setControlNumber(controlNumber) {
        this.controlNumber = controlNumber;
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
    console.log("Checking against ", entry[1].name);
    if (entry[1].name.includes('Novation') || entry[1].name.includes('Launch Control')) {
      novation_port_id = entry[1].id;
      break;
    }
  }

  if (novation_port_id) {
    midiOutput = midiAccess.outputs.get(novation_port_id);
    console.log("Using Novation MIDI output:", midiOutput.name);
  } else {
    // Store the first available output port
    for (const entry of midiAccess.outputs) {
      midiOutput = entry[1];
      console.log("Using MIDI output:", midiOutput.name);
    }
  }
}

function onMIDIFailure(msg) {
    console.error(`Failed to get MIDI access - ${msg}`);
}

function read_slider_values_from_cookie()
{
  let cookie_str = document.cookie;
  let cookie_parts = cookie_str.split(';');
  for (let part of cookie_parts) {
    let [name, value] = part.trim().split('=');
    if (name === cookie_name) {
      try {
        let data = JSON.parse(value);
          console.log("cookie data", data);  
        // Handle both old format (just values) and new format (values + controls)
        if (Array.isArray(data)) {
            // Old format
            for (let i = 0; i < data.length && i < sliders.length; ++i) {
                sliders[i].setValue(data[i]);
                slider_hook(i, data[i]);
            }
        } else {
            // New format with controls
            for (let i = 0; i < data.values.length && i < sliders.length; ++i) {
                sliders[i].setValue(data.values[i]);
                sliders[i].setControlNumber(data.controls[i]);
                slider_hook(i, data.values[i]);
            }
            // Load button notes and states if available
            if (data.buttonNotes) {
                for (let i = 0; i < buttons.length; ++i) {
                    // Set note number if available, otherwise keep default
                    if (i < data.buttonNotes.length) {
                        buttons[i].setNoteNumber(data.buttonNotes[i]);
                    }
                    // Set button state if available, otherwise keep default (false)
                    if (data.buttonStates && i < data.buttonStates.length) {
                        buttons[i].value = data.buttonStates[i];
                        if (buttons[i].value) {
                            button_hook(i, 127);
                        }
                    }
                }
            }
        }
      } catch (e) {
        console.error('Error parsing cookie value:', e);
      }
      break;
    }
  }
}


function save_slider_values_to_cookie()
{
  let data = {
    values: sliders.map(slider => slider.value),
    controls: sliders.map(slider => slider.controlNumber),
    buttonNotes: buttons.map(button => button.noteNumber),
    buttonStates: buttons.map(button => button.value)
  };
  let values_str = JSON.stringify(data);
  document.cookie = cookie_name + "=" + values_str + ";path=/";
}

function listInputsAndOutputs(midiAccess) {
    for (const entry of midiAccess.inputs) {
      const input = entry[1];
      console.log(
        `Input port [type:'${input.type}']` +
          ` id:'${input.id}'` +
          ` manufacturer:'${input.manufacturer}'` +
          ` name:'${input.name}'` +
          ` version:'${input.version}'`,
      );
    }
  
    for (const entry of midiAccess.outputs) {
      const output = entry[1];
      console.log(
        `Output port [type:'${output.type}'] id:'${output.id}' manufacturer:'${output.manufacturer}' name:'${output.name}' version:'${output.version}'`,
      );
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
            slider_hook(sliders.indexOf(learningSlider), data2);
            save_slider_values_to_cookie();
            refreshCanvas();
            return;
        }

        // Normal operation - find slider by control number
        let targetSlider = sliders.find(slider => slider.controlNumber === data1);
        if (targetSlider) {
            targetSlider.setValue(data2);
            slider_hook(sliders.indexOf(targetSlider), data2);
            save_slider_values_to_cookie();
            refreshCanvas();
        }
    } else if (command == 0x90 || command == 0x80) {
        // Handle both note-on and note-off
        let velocity = command == 0x80 ? 0 : data2;
        
        // Check for learning mode first
        let learningButton = buttons.find(button => button.isLearning);
        if (learningButton) {
            learningButton.setNoteNumber(data1);
            save_slider_values_to_cookie();
            refreshCanvas();
            return;
        }

        // Normal operation - find button by note number
        let targetButton = buttons.find(button => button.noteNumber === data1);
        if (targetButton && command == 0x90) {  // Only handle note-on messages
            targetButton.value = !targetButton.value;  // Toggle the state
            if (targetButton.value) {
                button_hook(buttons.indexOf(targetButton), velocity);
                sendNoteOn(targetButton.noteNumber, 0x7F);
            } else {
                button_hook(buttons.indexOf(targetButton), 0);
                sendNoteOn(targetButton.noteNumber, 0x00);
            }
            save_slider_values_to_cookie();
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
            button.handleMouseEvent(x, y, isShiftDown);
            save_slider_values_to_cookie();
            refreshCanvas();
            return;
        }
    }

    // Then check sliders
    for (let slider of sliders) {
        if (slider.isPointInThumb(x, y)) {
            activeSlider = slider;  // Set the active slider for dragging
            slider.handleMouseEvent(x, y, isShiftDown);
            slider_hook(sliders.indexOf(slider), slider.value);
            save_slider_values_to_cookie();
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

        activeSlider.handleMouseEvent(x, y, isShiftDown);
        slider_hook(sliders.indexOf(activeSlider), activeSlider.value);
        save_slider_values_to_cookie();
        refreshCanvas();
    }
}

function handleMouseUp() {
    activeSlider = null;
}

function sendNoteOn(note, velocity) {
    if (midiOutput) {
      // Note On message: 0x90 (note on) + channel 0
        let sendMessage = [0x90, note, velocity];
        console.log("Sending MIDI message:", sendMessage);
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
    
    // Initialize sliders (moved up by 50 pixels)
    let slider_x = (150-128)/2;
    let slider_top_y = 10;  // Changed from 60 to 10
    for (let i = 0; i < nbr_sliders; i++) {
        sliders.push(new Slider(slider_x, i * 50 + slider_top_y));
    }

    // Initialize buttons (2 rows of 4)
    let button_spacing = 8;
    let button_size = 30;
    let side_margin = 4;
    let button_start_x = side_margin + (150 - side_margin * 2 - (4 * (button_size + button_spacing) - button_spacing)) / 2;
    let button_start_y = 420;  // Position below sliders

    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 4; col++) {
            let x = button_start_x + col * (button_size + button_spacing);
            let y = button_start_y + row * (button_size + button_spacing);
            buttons.push(new Button(x, y, button_size, button_size));
        }
    }
    
    read_slider_values_from_cookie();
    // Request MIDI access with both input and output permissions
    navigator.requestMIDIAccess({ sysex: true, software: true }).then(onMIDISuccess, onMIDIFailure);
    refreshCanvas();
});

