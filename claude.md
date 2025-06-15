This is a set of p5.js projects.

Each project uses a panel on the right side of sliders and buttons to control it.
The panel settings are saved in a local cookie whose name is determined by the index.html file.
The panels can be controled from a MIDI control surface.

At the moment, the panel code midi_sliders.js is repeated for each project, but I'd like to keep it in a common directory.

Each project has it's own sketch.js file, which is p5.js code. Skeleton code is provided to use as the basis for new projects.

The sketch code contains listeners for the sliders and buttons, so the sketch can respond to them.

The listening hooks cause errors if you attempt to call processing functions (since they are not called within the p5 context), so I have written code to push them into a queue, and then I process the queues inside the processing context at the beginning of the draw function.
