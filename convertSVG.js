// This is a nodejs script that will convert all .svg files to .png files for vscode publishing
const { convertFile } = require('convert-svg-to-png');
const fs = require("fs");

let basedir = __dirname+"/resources";

async function parseDir(path){
    let files = fs.readdirSync(path);
    for(let name of files){
        let f = path+"/"+name;
        let stat = fs.lstatSync(f);
        if(stat.isDirectory()){
            parseDir(f);
        } else if(name.endsWith(".svg")) {
            let png = f.replace(/\.svg$/, ".png");
            if(!fs.existsSync(png) || stat.mtime.getTime() > fs.lstatSync(png).mtime.getTime()){
                console.log("Convert: "+f.replace(basedir+"/", ""));
                try{
                    await(convertFile(f));
                } catch(e){
                    console.warn(e+"\n");
                }
            } else {
                console.log("Skipped: "+f.replace(basedir+"/", ""));
            }
        }
    }
}

parseDir(basedir);
