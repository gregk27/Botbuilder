module.exports = {
    mode: "none",
    entry:{
        webviews: [
            "./resources/html/scripts/argumentSelector.js",
            "./resources/html/scripts/inputLineManager.js"
        ]
    },
    output:{
        filename:"bundle.js",
        path:__dirname+"/resources/html/"
    }
};