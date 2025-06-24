# P5.js Interactive Projects Collection

A collection of interactive p5.js projects with a unified control interface and MIDI integration.

## Overview

This repository contains multiple p5.js-based creative coding projects that share a common control panel interface. Each project features sliders and buttons that can be manipulated through:

1. Direct mouse interaction
2. MIDI controllers (hardware control surfaces)

The projects have been restructured to use a shared codebase for controls, while maintaining individual project implementations.

## Live Demo

<a href="https://jbum.github.io/p5js_slider_sketches/">LINK</a>
(currently still janky)

## Features

- **Unified Control Interface**: All projects use the same control panel design
- **MIDI Controller Support**: Map hardware MIDI controllers to sliders and buttons
- **Persistent Settings**: Project settings saved between sessions via cookies
- **Shared MIDI Mappings**: Configure your MIDI controller once, use it across all projects
- **Component-Based Structure**: Easy to add new projects that leverage the same control system

## Project Structure

- `/common/` - Shared resources
  - `midi_sliders.js` - Control panel implementation
  - `/library/` - p5.js library files
- Individual project directories
  - Each with its own implementation, using the common resources

## Creating New Projects

1. Copy the `/skeleton/` directory
2. Modify the `sketch.js` file to create your custom visualization
3. The new project will automatically use the common control panel system and detect the appropriate cookie name

### MIDI Control

To map MIDI controls:

1. Shift+click on a slider or button to enter "learning mode"
2. Send a MIDI message from your controller
3. The control will be mapped to that MIDI message
4. MIDI mappings are stored globally and shared between all projects

## License

MIT License

## Author

Jim Bumgardner
