import { JavaClassFileReader } from "java-class-tools";
import { JavaClass } from "../javaParser/JavaClasses";

console.log("Running!");

// let cls = parse("C:/Users/Greg/Documents/Workspaces/Robocode/LER2020_Testing/LER2020_ConveyorBot/src/main/java/", "C:/Users/Greg/Documents/Workspaces/Robocode/LER2020_Testing/LER2020_ConveyorBot/build/classes/java/main/ler/robot/subsystems/Drivetrain.class");
let startTime = new Date();

const reader = new JavaClassFileReader();
let file = reader.read("C:/Users/Greg/Documents/Workspaces/Robocode/LER2020_Testing/LER2020_ConveyorBot/build/classes/java/main/ler/robot/subsystems/Drivetrain.class");
let cls = new JavaClass(file, "C:/Users/Greg/Documents/Workspaces/Robocode/LER2020_Testing/LER2020_ConveyorBot/src/main/java/");

console.log(`Parsed in: ${new Date().getMilliseconds() - startTime.getMilliseconds()}ms`);
console.log(cls);
// console.log(JSON.stringify(cls));