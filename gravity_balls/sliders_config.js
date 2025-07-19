const sliders_cfg = [
    { minVal: 0, maxVal: 1, defaultVal: 0.5, name: "gravity" },
    { minVal: 0, maxVal: 1, defaultVal: 0.5, name: "bounce" },
    { minVal: 0, maxVal: 1, defaultVal: 0.5, name: "friction" },
    { minVal: 0, maxVal: 1, defaultVal: 0.5, name: "restitution" },
    { minVal: 0, maxVal: 1, defaultVal: 0.5, name: "density" },
    { minVal: 0, maxVal: 1, defaultVal: 0.5, name: "size" },
    { minVal: 0, maxVal: 1, defaultVal: 0.5, name: "speed" },
    { minVal: 0, maxVal: 1, defaultVal: 0.5, name: "count" }
];

const buttons_cfg = [
    { defaultVal: 0, name: "reset" },
    { defaultVal: 0, name: "add" },
    { defaultVal: 0, name: "remove" },
    { defaultVal: 0, name: "pause" },
    { defaultVal: 0, name: "b5" },
    { defaultVal: 0, name: "b6" },
    { defaultVal: 0, name: "b7" },
    { defaultVal: 0, name: "b8" }
];

// these are the presets that are available in the factory
const factory_presets = [
    {'name': 'default', 'slider_values': [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], 'button_values': [0, 0, 0, 0, 0, 0, 0, 0]}
]; 