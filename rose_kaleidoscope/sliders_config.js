const sliders_cfg = [
    { minVal: 0, maxVal: 1, defaultVal: 0.25, name: "sides" },
    { minVal: 0, maxVal: 1, defaultVal: 0.464, name: "nbr dots" },
    { minVal: 0, maxVal: 1, defaultVal: 0.273, name: "dot radius" },
    { minVal: 0, maxVal: 1, defaultVal: 0.257, name: "blur amt" },
    { minVal: 0, maxVal: 1, defaultVal: 0.765, name: "darken amt" },
    { minVal: 0, maxVal: 1, defaultVal: 0.078, name: "speed" },
    { minVal: 0, maxVal: 1, defaultVal: 0.234, name: "feedback levels" },
    { minVal: 0, maxVal: 1, defaultVal: 0.5, name: "phase" },

    { minVal: 0, maxVal: 1, defaultVal: 0.0, name: "recurse scale" },
    { minVal: 0, maxVal: 1, defaultVal: 0.5, name: "angle offset" },
];

const buttons_cfg = [
    { defaultVal: 1, name: "mirror" },
    { defaultVal: 0, name: "unused" },
    { defaultVal: 0, name: "wedge" },
    { defaultVal: 0, name: "b4" },
    { defaultVal: 0, name: "b5" },
    { defaultVal: 0, name: "b6" },
    { defaultVal: 0, name: "b7" },
    { defaultVal: 0, name: "sbank", states:2, set_slider_bank: true }
]; 