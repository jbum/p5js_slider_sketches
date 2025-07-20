const sliders_cfg = [
    { minVal: kMinSides, maxVal: kMaxSides, type: 'int', defaultVal: 5, name: "sides" },
    { minVal: 0, maxVal: 1, defaultVal: 0.0, name: "blur" },
    { minVal: 0, maxVal: 1, defaultVal: 0.8, name: "trails" },
    { minVal: 0, maxVal: 1, defaultVal: 0.075, name: "rotation angle" },
    { minVal: 0, maxVal: 5, type: 'int', defaultVal: 1, name: "feedback levels" },
    { minVal: 0, maxVal: 1, defaultVal: 1.0, name: "recurse scale" },
    { minVal: 0, maxVal: 1, defaultVal: 0.25, name: "Gravity" },
    { minVal: 0, maxVal: 1, defaultVal: 0.1, name: "Rotation Speed" },
];

const buttons_cfg = [
    { defaultVal: 1, name: "mirror" },
    { defaultVal: 0, name: "wedge" },
    { defaultVal: 1, name: "down" },
    { defaultVal: 0, name: "fr" },
    { defaultVal: 0, name: "clrs" },
    { defaultVal: 1, name: "bisect" },
    { defaultVal: 0, name: "b7" },
    { defaultVal: 0, name: "b8" }
];

// these are the presets that are available in the factory
const factory_presets = [
    {'name': 'default', 'slider_values': [0.4, 0.0, 0.8, 0.075, 0.3, 1.0, 0.25, 0.1], 'button_values': [1, 0, 1, 0, 0, 1, 0, 0]}
]; 
