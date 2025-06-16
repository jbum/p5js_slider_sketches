# P5.js Projects Collection

This is a set of p5.js projects organized as a single website with multiple sub-pages.

## Project Structure

- `/common/` - Shared resources used by all projects
  - `midi_sliders.js` - Control panel for sliders and buttons
  - `/library/` - P5.js library files
  - `favicon.ico` - Common favicon

- Individual project directories (e.g., `/rose_synth/`, `/rotating_animation_box/`, etc.)
  - Each contains its own `sketch.js` for the specific project functionality
  - `index.html` imports common resources
  - `style.css` for project-specific styles

## Cookie System

The projects use two types of cookies:
1. **Global MIDI mappings cookie** (`midi_mappings`) - Stores MIDI controller assignments across all projects
   - Control numbers for sliders
   - Note numbers for buttons
   - Stored at root path (`/`)

2. **Project-specific values cookies** - Each project uses its own cookie to store:
   - Slider values
   - Button states (on/off)
   - Cookie name automatically generated from project directory name
   - Format: `{projectName}_settings_v1`
   - Stored at project-specific paths

### Automatic Cookie Naming

The system now automatically determines the appropriate cookie name for each project:

1. It extracts the project name from the URL path (e.g., `/rose_synth/` → `rose_synth`)
2. Creates a standardized cookie name in the format `{projectName}_settings_v1`
3. No manual configuration needed in index.html (though you can still override by defining `cookie_name` explicitly)

## MIDI Control

All projects can be controlled from a MIDI control surface:
- Sliders can be mapped to MIDI CC controls (Control Change messages)
- Buttons can be mapped to MIDI notes
- Mapping is done by shift-clicking on a slider/button and sending a MIDI message
- MIDI mappings are shared across all projects

## Creating New Projects

1. Copy the `/skeleton/` directory as a starting point
2. Modify the `sketch.js` file to create your custom visualization/interaction
3. Update the cookie name in `index.html`
4. The new project will automatically use the common control panel and MIDI system

## Implementation Notes

- The control panel supports 8 sliders and 8 buttons by default
- The listening hooks from MIDI or UI may cause errors if you attempt to call p5.js functions directly (since they are not called within the p5 context)
- To avoid this, push the changes into a queue, and process the queue inside the p5 draw function
