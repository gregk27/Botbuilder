import { parse } from '../javaParser/javaParser';
import { JavaInnerClass } from '../javaParser/interfaces';

console.log("Running!");

let cls = parse("C:/Users/Greg/Documents/Workspaces/Robocode/LER2020_Testing/LER2020_ConveyorBot/src/main/java/", "C:/Users/Greg/Documents/Workspaces/Robocode/LER2020_Testing/LER2020_ConveyorBot/build/classes/java/main/ler/robot/subsystems/Drivetrain.class");

console.log(cls);
console.log(cls.innerClasses[3]);
// console.log(JSON.stringify(cls));