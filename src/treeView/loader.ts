import { Subsystem, Command } from "./treeType";
import { parseFolder } from "../javaParser/javaParser";
import { JavaClass } from "../javaParser/JavaClasses";
import getConfig from "src/config";

export class Loader{

    classes:JavaClass[];
    subsystems:Subsystem[];
    commands:Command[];

    constructor(
        private workspaceRoot:string
    ){

    }

    async load(): Promise<{subsystems: Subsystem[], commands: Command[]}> {
        console.log("Loading");
        let subsystems:Subsystem[] = [];
        let commands:Command[] = [];
    
        this.classes = await parseFolder(this.workspaceRoot+"/"+getConfig().buildFolder, this.workspaceRoot+"/"+getConfig().srcFolder, true, (cls:JavaClass)=>{
            if(cls.superClass.full === "edu/wpi/first/wpilibj2/command/SubsystemBase"){
                subsystems.push(new Subsystem(cls));
            }else if (cls.superClass.full === "edu/wpi/first/wpilibj2/command/CommandBase" && cls.pckg.includes("auto")){
                commands.push(new Command(cls, Command.AUTO));
            } else if (cls.superClass.full === "edu/wpi/first/wpilibj2/command/InstantCommand" && cls.pckg.includes("auto")){
                commands.push(new Command(cls, Command.AUTO | Command.INSTANT));
            } else if (cls.superClass.full === "edu/wpi/first/wpilibj2/command/CommandBase"){
                commands.push(new Command(cls));
            } else if (cls.superClass.full === "edu/wpi/first/wpilibj2/command/InstantCommand"){
                commands.push(new Command(cls, Command.INSTANT));
            } 
        });

        this.commands = commands;
        this.subsystems = subsystems;
        for(let command of this.commands){
            command.lateLoad(this);
        }
        for(let subsystem of this.subsystems){
            subsystem.lateLoad(this);
        }

        return {subsystems, commands};
    }
}
