import { JavaClassFileReader } from "java-class-tools";
import { JavaClass } from "../javaParser/JavaClasses";

console.log("Running!");

// let cls = parse("C:/Users/Greg/Documents/Workspaces/Robocode/LER2020_Testing/LER2020_ConveyorBot/src/main/java/", "C:/Users/Greg/Documents/Workspaces/Robocode/LER2020_Testing/LER2020_ConveyorBot/build/classes/java/main/ler/robot/subsystems/Drivetrain.class");
let startTime = new Date();

const reader = new JavaClassFileReader();
let file = reader.read("C:/Users/Greg/Documents/Workspaces/Robocode/LER2020_Testing/LER2020_ConveyorBot/build/classes/java/main/ler/robot/subsystems/Drivetrain.class");
let cls = new JavaClass(file, "C:/Users/Greg/Documents/Workspaces/Robocode/LER2020_Testing/LER2020_ConveyorBot/src/main/java/");

console.log(`Parsed in: ${new Date().getMilliseconds() - startTime.getMilliseconds()}ms`);
// console.log(cls);
console.log("N:\t"+cls.innerClasses[1].getName(false));
console.log("NT:\t"+cls.innerClasses[1].getName(true));
console.log("PN:\t"+cls.innerClasses[1].getPrettyName(false));
console.log("PNT:\t"+cls.innerClasses[1].getPrettyName(true));
console.log("FN:\t"+cls.innerClasses[1].getFullName(false));
console.log("FNT:\t"+cls.innerClasses[1].getFullName(true));
console.log("SIG:\t"+cls.innerClasses[1].getSignature());
console.log("DEC:\t"+cls.innerClasses[1].getDeclaration());
// console.log(JSON.stringify(cls));