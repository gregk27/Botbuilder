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
        this.index = index;
        
        this.addButton = rootElement.getElementsByClassName("addArgument")[0];

        this.arguments = [];

        this.addButton.onclick = () => {
            this.arguments.push(new ArgumentItem("defaultTalon", "TalonSRX", this));
            this.refresh();
        };
        this.arguments = [];
        this.refresh();
    }

    refresh(){
        let html = "";
        for(let i=0; i<this.arguments.length; i++){
            html += this.arguments[i].getHTML(i);
        }
        this.root.getElementsByClassName("args")[0].innerHTML = html;

        this.children = this.root.getElementsByClassName("arg");
        for(let i=0; i<this.children.length; i++){
            this.arguments[i].update(this.children[i]);
        }
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

    onDrag(yPosition, active){
        for(let i=0; i<this.children.length; i++){
            console.log(i, yPosition, this.children[i].offsetTop);
            if(i === 0 && yPosition < this.children[i].offsetTop){
                this.children[i].style.borderTop = "1px solid white";
            } else if (i === this.children.length-1 && yPosition > this.children[i].offsetTop){
                this.children[i].style.borderBottom = "1px solid white";
            } else {
                this.children[i].style.border = "none";
            }
        }
    }


}

class ArgumentItem {
    constructor(name, type, parent){
        this.name = name;
        this.type = type;
        this.parent = parent;
        this.parentIndex = parent.index;
    }

    getHTML(index){
        return `
        <div class="arg">
            <div class="dragger">&#9776;</div>
            <select onChange="argumentSelectors[${this.parentIndex}].setType(${index}, this)">
                <optgroup label="Motor Controller">
                    ${
                        hardwareTypes.motorControllers.map((val)=> {
                            return `<option value="${val.name}" ${this.type === val.name ? "selected" : ""}>${val.prettyName}</option>`;
                        }).join("/n")
                    };
                </optgroup>
                <optgroup label="Pneumatic">
                ${
                    hardwareTypes.pneumatics.map((val)=> {
                        return `<option value="${val.name}" ${this.type === val.name ? "selected" : ""}>${val.prettyName}</option>`;
                    }).join("")
                };
                </optgroup>
                <optgroup label="Sensor">
                ${
                    hardwareTypes.sensors.map((val)=> {
                        return `<option value="${val.name}" ${this.type === val.name ? "selected" : ""}>${val.prettyName}</option>`;
                    }).join("/n")
                };
                </optgroup>
                <optgroup label="Other">
                ${
                    hardwareTypes.other.map((val)=> {
                        return `<option value="${val.name}" ${this.type === val.name ? "selected" : ""}>${val.prettyName}</option>`;
                    }).join("/n")
                };
                </optgroup>
            </select>
            <input class="argName" type="text" value="${this.name}" onChange="argumentSelectors[${this.parentIndex}].setName(${index}, this)" />
            <button type="button" onclick="argumentSelectors[${this.parentIndex}].removeArg(${index})">-</button>
            <div class="err">&#9888; <span class="msg">placeholder</span></div>
        </div>`;
    }

    update(root){
        this.root = root;
        console.log(root);

        this.dragger = root.getElementsByClassName("dragger")[0];
        console.log(this.dragger);
        this.dragger.onmousedown = (event) => {
            console.log("Drag start");
            let handler = (evt)=>{
                this.drag(evt);
            };
            document.body.addEventListener("mousemove",handler);
            document.body.addEventListener("mouseup", ()=>{
                document.body.removeEventListener("mousemove", handler);
                this.root.style.position = "initial";
            });
            
            this.root.style.position = "absolute";
            this.root.style.left = event.clientX;
            this.root.style.top = event.clientY;
        };
    }

    drag(event){
        this.root.style.left = event.clientX;
        this.root.style.top = event.clientY;
        this.parent.onDrag(event.clientY, this.index);

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