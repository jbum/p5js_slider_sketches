const sliders_cfg = [
    { minVal: 0, maxVal: 1, defaultVal: 0.78, name: "sides" },
    { minVal: 0, maxVal: 1, defaultVal: 0.1, name: "blur amt" }, // was higher
    { minVal: 0, maxVal: 1, defaultVal: 0.14, name: "speed" },
    { minVal: 0, maxVal: 1, defaultVal: 0.78, name: "m1 sides" },
    { minVal: 0, maxVal: 1, defaultVal: 0.67, name: "m2 sides" },
    { minVal: 0, maxVal: 1, defaultVal: 0.32, name: "pic" },
    { minVal: 0, maxVal: 1, defaultVal: 0.25, name: "feedback levels" },
    { minVal: 0, maxVal: 1, defaultVal: 1.0, name: "recurse scale" },
];

const buttons_cfg = [
    { defaultVal: 1, name: "mirror" },
    { defaultVal: 0, name: "pan/rot" },
    { defaultVal: 0, name: "wedge" },
    { defaultVal: 0, name: "fr" },
    { defaultVal: 0, name: "tube_r" },
    { defaultVal: 1, name: "bisect" },
    { defaultVal: 0, name: "b7" },
    { defaultVal: 0, name: "b8" }
];

// these are the presets that are available in the factory
const factory_presets = 

[{"name":"default","slider_values":[0.78,0.13,0.21,0,0.87,0.46,0.20,0.99],"button_values":[1,0,0,0,0,1,0,0]},
 {"name":"Physic","slider_values":[0.56,0.13,0.32,0.20,0.50,0.46,0.61,0.65],"button_values":[1,1,0,0,0,1,0,0]},
 {"name":"Ornate","slider_values":[0.79,0.13,0.21,0,0.87,0.46,0.75,0.68],"button_values":[1,0,0,0,0,1,0,0]}];
