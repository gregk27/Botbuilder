import { parse } from '../javaParser/javaParser';

let cls = parse("C:/Users/Greg/Documents/Workspaces/Robocode/LER2020_Testing/LER2020_ConveyorBot/src/main/java/ler/robot/subsystems/Drivetrain.java", "C:/Users/Greg/Documents/Workspaces/Robocode/LER2020_Testing/LER2020_ConveyorBot/build/classes/java/main/ler/robot/subsystems/Drivetrain.class");

console.log(cls);
console.log(JSON.stringify(cls));