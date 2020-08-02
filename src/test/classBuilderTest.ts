import { ClassBuilder } from "../classBuilder/classBuilder";
import { Scope } from "../javaParser/common";

console.log(new ClassBuilder("ca/ler/robot/subsystems", "Drivetrain", Scope.PUBLIC, { name: "SubsystemBase", import: "com/wpilibj/SubsystemBase" },
    [{ name: "ActionListener", import: "java.swing.ActionListener" }],
    [
        new ClassBuilder.Field(
            { name: "TalonSRX", import: "com.ctre.TalonSRX", isArray: false },
            "leftTalon", Scope.PUBLIC, "The left drive talon<br/>\n@note Not right side", true, true, "new TalonSRX(1)"),
            new ClassBuilder.Field(
                { name: "TalonSRX", import: "com.ctre.TalonSRX", isArray: false },
                "leftTalon", Scope.PUBLIC, "The left drive talon<br/>\n@note Not right side", true, true, "new TalonSRX(1)")
    ], "Basic drivetrain subsystem").getCode());