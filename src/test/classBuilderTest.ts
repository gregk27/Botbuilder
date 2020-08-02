import { ClassBuilder } from "../classBuilder/classBuilder";
import { Scope } from "../javaParser/common";

console.log(new ClassBuilder("ca/ler/robot/subsystems", "Drivetrain", Scope.PUBLIC, { type: "SubsystemBase", import: "com/wpilibj/SubsystemBase" },
    [{ type: "ActionListener", import: "java.swing.ActionListener" }],
    [
        new ClassBuilder.Field(
            { type: "TalonSRX", import: "com.ctre.TalonSRX", isArray: false },
            "leftTalon", Scope.PUBLIC, "The left drive talon<br/>\n@note Not right side", true, true, "new TalonSRX(1)"),
            new ClassBuilder.Field(
                { type: "TalonSRX", import: "com.ctre.TalonSRX", isArray: false },
                "leftTalon", Scope.PUBLIC, "The left drive talon<br/>\n@note Not right side", true, true, "new TalonSRX(1)")
    ], 
    [
        new ClassBuilder.Method(
            null, null, 
            [
                {
                   type:"TalonSRX",
                   import:"com.ctre.TalonSRX",
                   name:"leftTalon",
                   doc:"The left drive talon<br/>\n@note ",
                   isArray:false 
                },
                {
                    type:"TalonSRX",
                    import:"com.ctre.TalonSRX",
                    name:"rightTalon",
                    doc:"The right drive talon<br/>\n@note ",
                    isArray:false 
                 }
            ], Scope.DEFAULT, "Create a new drivetrain", false, false, `addRequirement(leftTalon);\naddRequirement(rightTalon);\nthis.leftTalon=leftTalon;\nthis.rightTalon=rightTalon;`
        ),
        new ClassBuilder.Method(
            null, null, 
            [
                {
                   type:"TalonSRX",
                   import:"com.ctre.TalonSRX",
                   name:"leftTalon",
                   doc:"The left drive talon<br/>\n@note ",
                   isArray:false 
                },
                {
                    type:"TalonSRX",
                    import:"com.ctre.TalonSRX",
                    name:"rightTalon",
                    doc:"The right drive talon<br/>\n@note ",
                    isArray:false 
                 }
            ], Scope.DEFAULT, "Create a new drivetrain", false, false, `addRequirement(leftTalon);\naddRequirement(rightTalon);\nthis.leftTalon=leftTalon;\nthis.rightTalon=rightTalon;`
        )
    ],
    "Basic drivetrain subsystem").getCode());