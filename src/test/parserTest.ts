import { JavaClassFileReader, ConstantPoolInfo } from "java-class-tools";
import { JavaClass } from "../javaParser/JavaClasses";

console.log("Running!");

// let cls = parse("C:/Users/Greg/Documents/Workspaces/Robocode/LER2020_Testing/LER2020_ConveyorBot/src/main/java/", "C:/Users/Greg/Documents/Workspaces/Robocode/LER2020_Testing/LER2020_ConveyorBot/build/classes/java/main/ler/robot/subsystems/Drivetrain.class");
let startTime = new Date();

const reader = new JavaClassFileReader();
let file = reader.read("C:/Users/Greg/Documents/Workspaces/Robocode/LER2020_Testing/LER2020_ConveyorBot/build/classes/java/main/ler/robot/subsystems/Drivetrain.class");
let cls = new JavaClass(file, "C:/Users/Greg/Documents/Workspaces/Robocode/LER2020_Testing/LER2020_ConveyorBot/src/main/java/");

console.log(`Parsed in: ${new Date().getMilliseconds() - startTime.getMilliseconds()}ms`);
console.log(cls);

for(let field of cls.fields){
    console.log("N:\t"+field.getName(false));
    console.log("NT:\t"+field.getName(true));
    console.log("PN:\t"+field.getPrettyName(false));
    console.log("PNT:\t"+field.getPrettyName(true));
    console.log("FN:\t"+field.getFullName(false));
    console.log("FNT:\t"+field.getFullName(true));
    console.log("SIG:\t"+field.getSignature());
    console.log("DEC:\t"+field.getDeclaration());
    console.log();
}// console.log(JSON.stringify(cls));