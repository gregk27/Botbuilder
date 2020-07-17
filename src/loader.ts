import * as fs from 'fs';
import { Subsystem, Command } from './treeType';
import { parse } from './javaParser/javaParser';

export var subsystems:Subsystem[] = [];
export var commands:Command[] = [];
let basePath = "";

export async function load(workspaceRoot:string){
    console.log("Loading");
    basePath = workspaceRoot+"/src/main/java/";
    subsystems = [];
    commands = [];

    await(parseDir(basePath, fs.readdirSync(basePath)));
    console.log("Done");
}


async function parseDir(root:string, files: string[]){
    console.log("Parsing");
    console.log(root);
    console.log(files);
    if(files === undefined){
        console.log("files undefined");
        return;
    }
    let promises:Promise<void>[] = [];
    for(let fileName of files){
        let filePath = root+fileName;
        if(fs.lstatSync(filePath).isDirectory()){
            promises.push(parseDir(filePath+"/", fs.readdirSync(filePath)));
        } else if (filePath.endsWith(".java")) {
            let content = fs.readFileSync(filePath).toString();
            let cls = parse(filePath, filePath.replace("src/main/java/", "build/classes/java/main/").replace(".java", ".class"));
            if(cls.superClass === "edu/wpi/first/wpilibj2/command/SubsystemBase"){
                subsystems.push(new Subsystem(cls));
            }else if (cls.superClass === "edu/wpi/first/wpilibj2/command/CommandBase" && cls.pckg.includes("auto")){
                commands.push(new Command(cls, Command.AUTO));
            } else if (cls.superClass === "edu/wpi/first/wpilibj2/command/InstantCommand" && cls.pckg.includes("auto")){
                commands.push(new Command(cls, Command.AUTO | Command.INSTANT));
            } else if (cls.superClass === "edu/wpi/first/wpilibj2/command/CommandBase"){
                commands.push(new Command(cls));
            } else if (cls.superClass === "edu/wpi/first/wpilibj2/command/InstantCommand"){
                commands.push(new Command(cls, Command.INSTANT));
            } 
       }
    }
    await Promise.all(promises);
}