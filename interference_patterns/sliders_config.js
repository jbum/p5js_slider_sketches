const sliders_cfg = [
    { minVal: 0, maxVal: NBR_MODES-1, type: 'int', defaultVal: 0, name: "display mode" },
    { minVal: 0, maxVal: 1, defaultVal: 0.43, name: "rotation speed" },
    { minVal: 0, maxVal: NBR_SHAPES-1, type: 'int', defaultVal: 8, name: "A graphic" },
    { minVal: 0, maxVal: NBR_SHAPES-1, type: 'int', defaultVal: 8, name: "B graphic" },
    { minVal: 0, maxVal: NBR_GELS-1, type: 'int', defaultVal: 3, name: "color gel" },
    { minVal: 0, maxVal: 1, defaultVal: 0.0, name: "unused" },
    { minVal: 0, maxVal: 10, type: 'int', defaultVal: 0, name: "blur" },
    { minVal: 0, maxVal: 1, defaultVal: 0.0, name: "unused" }
];

const buttons_cfg = [
    { defaultVal: 0, name: "monitor" },
    { defaultVal: 0, name: "displace" },
    { defaultVal: 0, name: "b3" },
    { defaultVal: 0, name: "b4" },
    { defaultVal: 0, name: "b5" },
    { defaultVal: 0, name: "b6" },
    { defaultVal: 0, name: "b7" },
    { defaultVal: 0, name: "b8" }
];

// these are the presets that are available in the factory
const factory_presets = [
    {'name': 'tos tricorder', 'slider_values': [0,0.43,7,7,3,0,0,0], 'button_values': [0, 0, 0, 0, 0, 0, 0, 0]},
    {'name': 'tos communicator', 'slider_values': [0,0.43,8,8,3,0,0,0], 'button_values': [0, 0, 0, 0, 0, 0, 0, 0]},
    {'name': 'rowe/ami L-200 jukebox', 'slider_values': [0,0.43,0,0,0,0,1,0], 'button_values': [0, 0, 0, 0, 0, 0, 0, 0]},
    {'name': 'expanding spiral', 'slider_values': [0,1.0,1,2,1,0,1,0], 'button_values': [0, 0, 0, 0, 0, 0, 0, 0]},
    {'name': 'starburst', 'slider_values': [0,0.43,2,2,0,0,1,0], 'button_values': [0, 0, 0, 0, 0, 0, 0, 0]},
    {'name': 'banded star', 'slider_values': [0,0.43,3,3,1,0,1,0], 'button_values': [0, 0, 0, 0, 0, 0, 0, 0]},
    {'name': 'slow expand', 'slider_values': [0,0.43,1,3,1,0,1,0], 'button_values': [0, 0, 0, 0, 0, 0, 0, 0]},
    {'name': 'spoke/rowe', 'slider_values': [0,0.43,2,0,0,0,1,0], 'button_values': [0, 0, 0, 0, 0, 0, 0, 0]},
]