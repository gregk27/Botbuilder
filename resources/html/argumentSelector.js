let hardwareTypes = {
    motorControllers: [
        {
            name: "TalonSRX",
            prettyName: "Talon SRX",
            descriptor: "com/ctre/phoenix/motorcontrol/can/TalonSRX",
        },
        {
            name: "VictorSPX",
            prettyName: "Victor SPX",
            descriptor: "com/ctre/phoenix/motorcontrol/can/VictorSPX",
        },
        {
            name: "TalonFX",
            prettyName: "Talon FX",
            descriptor: "com/ctre/phoenix/motorcontrol/can/TalonFX",
        },
        {
            name: "CANSparkMax",
            prettyName: "SparkMax (CAN)",
            descriptor: "com/revrobotics/CANSparkMax",
        }
    ],
    pneumatics: [
        {
            name: "Solenoid",
            prettyName: "Solenoid",
            descriptor:"edu/wpi/first/wpilibj/Solenoid",
        },
        {
            name: "DoubleSolenoid",
            prettyName: "Double Solenoid",
            descriptor: "edu/wpi/first/wpilibj/DoubleSolenoid",
        }
    ],
    sensors: [
        {
            name: "ADXRS450_Gyro",
            prettyName: "ADXRS450 Gyro",
            descriptor: "edu/wpi/first/wpilibj/ADXRS450_Gyro",
        }
    ],
    other: [
        {
            name: "DIO",
            prettyName: "DIO",
            descriptor: "DIO",
        }
    ]
};

class ArgumentSelector{
    
    constructor(rootElement, index){
        this.root = rootElement;
        this.addButton = rootElement.getElementsByClassName("addArgument")[0];
        let _self = this;
        this.addButton.onclick = function(){
            _self.arguments.push({type:"TalonSRX", name:"defaultTalon"});
            _self.refresh();
        };
        this.arguments = [];
        this.index = index;
        this.refresh();

        this.dragger = rootElement.getElementsByClassName("dragger")[0];
        this.dragger.onmousedown = function() {
            console.log("Drag start");
            // this.root.style.display = "absolute";
        };
        this.dragger.ondrag = (event)=>{
            console.log("Dragging");
            console.log(event);
        }
    }

    refresh(){
        let html = "";
        for(let i=0; i<this.arguments.length; i++){
            let a = this.arguments[i];
            html+=`
            <div class="arg">
                <div class="dragger">&#9776;</div>
                <select onChange="argumentSelectors[${this.index}].setType(${i}, this)">
                    <optgroup label="Motor Controller">
                        ${
                            hardwareTypes.motorControllers.map((val)=> {
                                return `<option value="${val.name}" ${a.type === val.name ? "selected" : ""}>${val.prettyName}</option>`;
                            }).join("/n")
                        };
                    </optgroup>
                    <optgroup label="Pneumatic">
                    ${
                        hardwareTypes.pneumatics.map((val)=> {
                            return `<option value="${val.name}" ${a.type === val.name ? "selected" : ""}>${val.prettyName}</option>`;
                        }).join("")
                    };
                    </optgroup>
                    <optgroup label="Sensor">
                    ${
                        hardwareTypes.sensors.map((val)=> {
                            return `<option value="${val.name}" ${a.type === val.name ? "selected" : ""}>${val.prettyName}</option>`;
                        }).join("/n")
                    };
                    </optgroup>
                    <optgroup label="Other">
                    ${
                        hardwareTypes.other.map((val)=> {
                            return `<option value="${val.name}" ${a.type === val.name ? "selected" : ""}>${val.prettyName}</option>`;
                        }).join("/n")
                    };
                    </optgroup>
                </select>
                <input class="argName" type="text" value="${a.name}" onChange="argumentSelectors[${this.index}].setName(${i}, this)" />
                <button type="button" onclick="argumentSelectors[${this.index}].removeArg(${i})">-</button>
                <div class="err">&#9888; <span class="msg">placeholder</span></div>
            </div>`;
        }
        this.root.getElementsByClassName("args")[0].innerHTML = html;
    }

    removeArg(index){
        this.arguments.splice(index, 1);
        this.refresh();
    }

    setType(index, selector){
        this.arguments[index].type = selector.value;
        console.log(this.arguments);
    }

    setName(index, input){
        this.arguments[index].name = input.value;
        console.log(this.arguments);
    }


}


var argumentSelectors = [];

console.log("Added listener");
window.addEventListener("load", (event)=>{
    console.log("Hello world!");
    for(let e of document.getElementsByClassName("argumentSelector")){
        argumentSelectors.push(new ArgumentSelector(e, argumentSelectors.length));
    }
});