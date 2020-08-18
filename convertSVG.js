// This is a nodejs script that will convert all .svg files to .png files for vscode publishing
const { convertFile } = require('convert-svg-to-png');
const fs = require("fs");
const { exit } = require('process');

let basedir = __dirname+"/resources";

let verbose = process.argv.includes("-v") || process.argv.includes("--verbose");

if(process.argv.includes("--help") || process.argv.includes("-h")){
    console.log(
`CLI Options
    -v --verbose    Enable verbose output
    -h --help       Display this information
`);
    exit(0);
}

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
                if(verbose){console.log("Skipped: "+f.replace(basedir+"/", ""));}
            }
        }
    }
}

parseDir(basedir);
