
export namespace ConfigTypes {
    export interface HardwareType {
        name:string;
        descriptor:string;
        category: HardwareCategory;
    }

    export enum HardwareCategory {
        MOTOR_CONTROLLER = "motorController",
        PNEUMATIC = "pneumatic",
        SENSOR = "sensor",
        OTHER = "other"
    }
    export namespace HardwareCategory {
        /**
         * Get a pretty-print name for a hardware category
         * @param cat The category
         */
        export function getPrettyName(cat: HardwareCategory){
            switch(cat){
                case ConfigTypes.HardwareCategory.MOTOR_CONTROLLER:
                    return "Motor Controller";
                case ConfigTypes.HardwareCategory.PNEUMATIC:
                    return "Pneumatic";
                case ConfigTypes.HardwareCategory.SENSOR:
                    return "Sensor";
                case ConfigTypes.HardwareCategory.OTHER:
                    return "Other";
            }
        }
    }

}

export let config:Config = {
    hardwareTypes: {
        motorControllers: [
            {
                name: "TalonSRX",
                descriptor: "com/ctre/phoenix/motorcontrol/can/TalonSRX",
                category: ConfigTypes.HardwareCategory.MOTOR_CONTROLLER
            },
            {
                name: "VictorSPX",
                descriptor: "com/ctre/phoenix/motorcontrol/can/VictorSPX",
                category: ConfigTypes.HardwareCategory.MOTOR_CONTROLLER
            },
            {
                name: "TalonFX",
                descriptor: "com/ctre/phoenix/motorcontrol/can/TalonFX",
                category: ConfigTypes.HardwareCategory.MOTOR_CONTROLLER
            },
            {
                name: "CANSparkMax",
                descriptor: "com/revrobotics/CANSparkMax",
                category: ConfigTypes.HardwareCategory.MOTOR_CONTROLLER
            }
        ],
        pneumatics: [
            {
                name: "Solenoid",
                descriptor:"edu/wpi/first/wpilibj/Solenoid",
                category: ConfigTypes.HardwareCategory.PNEUMATIC
            },
            {
                name: "DoubleSolenoid",
                descriptor: "edu/wpi/first/wpilibj/DoubleSolenoid",
                category: ConfigTypes.HardwareCategory.PNEUMATIC
            }
        ],
        sensors: [
            {
                name: "ADXRS450 Gyro",
                descriptor: "edu/wpi/first/wpilibj/ADXRS450_Gyro",
                category: ConfigTypes.HardwareCategory.SENSOR
            }
        ],
        other: [

        ]
    }


};

export interface Config {
    hardwareTypes: {
        motorControllers: ConfigTypes.HardwareType[],
        pneumatics: ConfigTypes.HardwareType[],
        sensors: ConfigTypes.HardwareType[],
        other: ConfigTypes.HardwareType[]
    }
}
