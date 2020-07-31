module.exports = {
    mode: "none",
    module:{
        rules:[
            {
                test: /\.ts$/,
                use:"ts-loader"
            }
        ]
    },
    entry:{
        webviews: [
            "./resources/html/scripts/inputManager.ts"
        ]
    },
    output:{
        filename:"bundle.js",
        path:__dirname+"/resources/html/"
    },
    resolve:{
        extensions: ['.ts']
    },
    devtool: 'source-map'
};