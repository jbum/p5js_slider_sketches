const sliders_cfg = [
    { minVal: 0, maxVal: 1, defaultVal: 0.175, name: "sides" },
    { minVal: 0, maxVal: 1, defaultVal: 0.464, name: "nbr dots" },
    { minVal: 0, maxVal: 1, defaultVal: 0.253, name: "dot radius" },
    { minVal: 0, maxVal: 1, defaultVal: 0.332, name: "blur amt" },
    { minVal: 0, maxVal: 1, defaultVal: 0.558, name: "darken amt" },
    { minVal: 0, maxVal: 1, defaultVal: 0.152, name: "speed" },
    { minVal: 0, maxVal: 1, defaultVal: 0.5, name: "feedback levels" },
    { minVal: 0, maxVal: 1, defaultVal: 0.5, name: "phase" },

    { minVal: 0, maxVal: 1, defaultVal: 0.5, name: "recurse scale" },
    { minVal: 0, maxVal: 1, defaultVal: 0.5, name: "angle offset" },
    { minVal: 0, maxVal: 1, defaultVal: 0.5, name: "unused" },
    { minVal: 0, maxVal: 1, defaultVal: 0.5, name: "unused" },
    { minVal: 0, maxVal: 1, defaultVal: 0.5, name: "unused" },
    { minVal: 0, maxVal: 1, defaultVal: 0.5, name: "unused" },
    { minVal: 0, maxVal: 1, defaultVal: 0.5, name: "unused" },
    { minVal: 0, maxVal: 1, defaultVal: 0.5, name: "unused" }
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