const sliders_cfg = [
    { minVal: 0, maxVal: 1, defaultVal: 0.0, name: "Gravity" },
    { minVal: 0, maxVal: 1, defaultVal: 0.75, name: "Gravity Angle" },
    { minVal: 0, maxVal: 1, defaultVal: 0.0, name: "Friction" },
    { minVal: 0, maxVal: 1, defaultVal: 0.6, name: "Restitution" },
    { minVal: 0, maxVal: 1, defaultVal: 0.5, name: "Slider 6" },
    { minVal: 0, maxVal: 1, defaultVal: 0.5, name: "Slider 7" },
    { minVal: 0, maxVal: 1, defaultVal: 0.5, name: "Slider 8" }
];

const buttons_cfg = [
    { defaultVal: 0, name: "b1" },
    { defaultVal: 0, name: "b2" },
    { defaultVal: 0, name: "b3" },
    { defaultVal: 0, name: "b4" },
    { defaultVal: 0, name: "b5" },
    { defaultVal: 0, name: "b6" },
    { defaultVal: 0, name: "b7" },
    { defaultVal: 0, name: "b8" }
];

// these are the presets that are available in the factory
const factory_presets = [
    {'name': 'default', 'slider_values': [0.0, 0.75, 0.0, 0.6, 0.5, 0.5, 0.5], 'button_values': [0, 0, 0, 0, 0, 0, 0, 0]}
]; 