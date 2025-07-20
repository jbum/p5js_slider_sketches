const sliders_cfg = [
    { minVal: kMinSides, maxVal: kMaxSides, type: 'int', defaultVal: 5, name: "sides" },
    { minVal: kMinDots, maxVal: kMaxDots, type: 'int', defaultVal: 512, name: "nbr dots" },
    { minVal: 0, maxVal: 1, defaultVal: 0.273, name: "dot radius" },
    { minVal: 0, maxVal: 1, defaultVal: 0.257, name: "blur amt" },
    { minVal: 0, maxVal: 1, defaultVal: 0.765, name: "trails" },
    { minVal: 0, maxVal: 1, defaultVal: 0.078, name: "speed" },
    { minVal: 0, maxVal: 5, type: 'int', defaultVal: 0, name: "feedback levels" },
    { minVal: 0, maxVal: 1, defaultVal: 0.5, name: "phase" },

    { minVal: 0, maxVal: 1, defaultVal: 1.0, name: "recurse scale" },
    { minVal: 0, maxVal: 1, defaultVal: 0.5, name: "unused" },
];

const buttons_cfg = [
    { defaultVal: 1, name: "mirror" },
    { defaultVal: 0, name: "unused" },
    { defaultVal: 0, name: "wedge" },
    { defaultVal: 0, name: "fr" },
    { defaultVal: 1, name: "tube_r" },
    { defaultVal: 1, name: "bisect" },
    { defaultVal: 0, name: "b7" },
    { defaultVal: 0, name: "sbank", states:2, set_slider_bank: true }
];

// these are the presets that are available in the factory
const factory_presets = [
    {'name': 'default', 'slider_values': [0.4, 0.464, 0.273, 0.257, 0.765, 0.078, 0.0, 0.5, 1.0, 0.5], 'button_values': [1, 0, 0, 0, 1, 1, 0, 0]}
]; 