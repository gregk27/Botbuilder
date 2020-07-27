import { Subsystem, Command } from "./treeType";
import { parseFolder } from "./javaParser/javaParser";
import { JavaClass } from "./javaParser/JavaClasses";

export async function load(workspaceRoot:string): Promise<{subsystems: Subsystem[], commands: Command[]}> {
    console.log("Loading");
    let subsystems:Subsystem[] = [];
    let commands:Command[] = [];

    await parseFolder(workspaceRoot+"/build/classes/java/main/", workspaceRoot+"/src/main/java/", true, (cls:JavaClass)=>{
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
    console.log("Done");
    return {subsystems, commands};
}