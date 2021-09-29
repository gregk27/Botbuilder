import { JavaClassFileReader, ConstantPoolInfo } from "java-class-tools";
import { JavaClass } from "../javaParser/JavaClasses";
import { parseFile, parseFolder } from "../javaParser/javaParser";
import * as fs from 'fs';

console.log("Running!");

async function test(){
    // let cls = parse("C:/Users/Greg/Documents/Workspaces/Robocode/LER2020_Testing/LER2020_ConveyorBot/src/main/java/", "C:/Users/Greg/Documents/Workspaces/Robocode/LER2020_Testing/LER2020_ConveyorBot/build/classes/java/main/ler/robot/subsystems/Drivetrain.class");
    let startTime = new Date();

    const reader = new JavaClassFileReader();
    let cls = parseFile("C:/Users/Greg/Documents/Workspaces/Robocode/LER2020_Testing/LER2020_ConveyorBot/build/classes/java/main/ler/robot/subsystems/Drivetrain.class", "C:/Users/Greg/Documents/Workspaces/Robocode/LER2020_Testing/LER2020_ConveyorBot/src/main/java/", false);

    console.log(JSON.stringify(cls));
    await cls.srcText;
    console.log(`Parsed in: ${new Date().getUTCMilliseconds() - startTime.getUTCMilliseconds()}ms`);
}
test();
// for(let method of cls.methods){
//     console.log("N:\t"+method.getName(false));
//     console.log("NT:\t"+method.getName(true));
//     console.log("PN:\t"+method.getPrettyName(false));
//     console.log("PNT:\t"+method.getPrettyName(true));
//     console.log("FN:\t"+method.getFullName(false));
//     console.log("FNT:\t"+method.getFullName(true));
//     console.log("SIG:\t"+method.getSignature());
//     console.log("DEC:\t"+method.getDeclaration());
//     console.log();
// }// console.log(JSON.stringify(cls));