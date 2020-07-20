import { parse } from '../javaParser/javaParser';
import { JavaInnerClass } from '../javaParser/interfaces';

let cls = parse("C:/Users/Greg/Documents/Workspaces/Robocode/LER2020_Testing/LER2020_ConveyorBot/src/main/java/", "C:/Users/Greg/Documents/Workspaces/Robocode/LER2020_Testing/LER2020_ConveyorBot/build/classes/java/main/ler/robot/RobotMap.class");

console.log(cls);
// console.log(JSON.stringify(cls));