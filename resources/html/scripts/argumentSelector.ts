/// <reference lib="dom" />

import { EphemeralKeyInfo } from "tls";


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

    root: HTMLElement;
    index: number;
    addButton: HTMLButtonElement;
    arguments: ArgumentItem[];
    children: HTMLCollection;

    /**
     * Create a new ArgumentSelector from a `.argumentSelector` element
     * 
     * @param rootElement The `.argumentSelector` element
     * @param index The index in holding array
     */
    constructor(rootElement:HTMLElement, index:number){
        /** The `.argumentSelector` element */
        this.root = rootElement;
        /** The index in holding array */
        this.index = index;
        
        /** Button used to add new argument */
        this.addButton = <HTMLButtonElement> rootElement.getElementsByClassName("addArgument")[0];

        /** 
         * Arguments for construtor, in order
         */
        this.arguments = [new ArgumentItem("Talon 1", "TalonSRX", this), new ArgumentItem("Talon 2", "TalonSRX", this), new ArgumentItem("Talon 3", "TalonSRX", this), new ArgumentItem("Talon 4", "TalonSRX", this)];

        this.addButton.onclick = () => {
            this.arguments.push(new ArgumentItem("defaultTalon", "TalonSRX", this));
            this.refresh();
        };
        this.refresh();
    }

    /**
     * Update the html
     */
    refresh(){
        let html = "";
        for(let i=0; i<this.arguments.length; i++){
            html += this.arguments[i].getHTML(i);
        }
        this.root.getElementsByClassName("args")[0].innerHTML = html;

        this.children = this.root.getElementsByClassName("arg");
        for(let i=0; i<this.children.length; i++){
            this.arguments[i].update(<HTMLElement> this.children.item(i));
        }
    }

    /**
     * Remove an argument
     * @param index The index of the argument 
     */
    removeArg(index: number){
        this.arguments.splice(index, 1);
        this.refresh();
    }

    /**
     * Set the type of a particular argument
     * 
     * @param index The index of the argument
     * @param selector `select` element with type
     */
    setType(index:number, selector:HTMLInputElement){
        this.arguments[index].type = selector.value;
        console.log(this.arguments);
    }

    /**
     * Set the name of a particular argument
     * 
     * @param index The index of the argument 
     * @param input Text input with name
     */
    setName(index:number, input:HTMLInputElement){
        this.arguments[index].name = input.value;
        console.log(this.arguments);
    }

    /**
     * Called while an argument is being dragged
     * 
     * @param yPosition The current y position of the actively dragged argument
     * @param active Actively dragged argument
     * @reutrns The position in the array the dragged argument would be dropped in
     */
    onDrag(yPosition:number, active:ArgumentItem){
        let tmpChildren = <HTMLElement[]> Array.from(this.children);
        let activeIdx = this.arguments.indexOf(active);
        tmpChildren.splice(activeIdx, 1);

        /** Style to be used for active border */
        const borderStyle = "2px solid white";
        /** Value to return, the position in the array the dragged argument would be dropped in */
        let retVal = -1;
        for(let i=0; i<tmpChildren.length; i++){
            let c = tmpChildren[i];
            c.style.border = "none";
            if(i === 0 && yPosition < c.offsetTop) {
                c.style.borderTop = borderStyle;
                retVal = 0;
            } else if (i === tmpChildren.length-1 && yPosition > c.offsetTop){
                c.style.borderBottom = borderStyle;
                // Return the insert index, if this is after the removed item, the increment by one
                retVal = i + 1;
            } else if (yPosition > c.offsetTop && yPosition < tmpChildren[i+1].offsetTop){
                c.style.borderBottom = borderStyle;
                // Return the insert index, if this is after the removed item, the increment by one
                retVal = i+1;// + (i>=activeIdx ? 1:0);
            }
        }
        return retVal;
    }

    /**
     * Called when the dragged argument is dropped
     * This will reorder the arguments to reflect change
     * 
     * @param yPosition The current y position of the actively dragged argument
     * @param active The actively dragged argument
     */
    onDrop(yPosition:number, active:ArgumentItem){
        let pos = this.onDrag(yPosition, active);
        console.log(pos);

        let a = this.arguments.splice(this.arguments.indexOf(active), 1);
        let b = this.arguments.splice(pos);

        this.arguments = [...this.arguments, ...a, ...b];
        this.refresh();
    }


}

class ArgumentItem {

    name: string;
    type: string;
    parent: ArgumentSelector;
    parentIndex: number;
    root: HTMLElement;
    dragger: HTMLElement;
    input: HTMLInputElement;

    /**
     * Create a new argument item
     * 
     * @param {string} name 
     * @param {string} type 
     * @param {ArgumentSelector} parent 
     */
    constructor(name:string, type:string, parent:ArgumentSelector){
        this.name = name;
        this.type = type;
        this.parent = parent;
        this.parentIndex = parent.index;
    }

    /**
     * Get the HTML to render
     * 
     * @param index The index in the arguments array
     * @return The string representation of the HTML
     */
    getHTML(index:number){
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

    /**
     * Update the various listeners and references used by the argument
     * 
     * @param root The `.arg` element 
     */
    update(root:HTMLElement){
        this.root = root;
        console.log(root);

        this.dragger = root.querySelector(".dragger");
        console.log(this.dragger);
        this.dragger.onmousedown = (event) => {
            console.log("Drag start");
            let movehandler = (event:MouseEvent)=>{
                this.root.style.left = event.clientX.toString();
                this.root.style.top = event.clientY.toString();
                this.parent.onDrag(event.clientY, this);
            };
            let upHandler = (event:MouseEvent)=>{
                document.body.removeEventListener("mousemove", movehandler);
                document.body.removeEventListener("mouseup", upHandler);
                this.parent.onDrop(event.clientY, this);
                this.root.style.position = "initial";
                console.log("mouse up");
            };
            document.body.addEventListener("mousemove",movehandler);
            document.body.addEventListener("mouseup", upHandler);
            
            this.root.style.position = "absolute";
            this.root.style.left = event.clientX.toString();
            this.root.style.top = event.clientY.toString();
        };
        
        this.input = root.querySelector(".argname");
        this.input.oninput = ()=>{
            
        };
    }
}

declare global {
    interface Window {
        argumentSelectors: ArgumentSelector[];
    }
}

/**
 * Holding array for argument selectors
 */
window.argumentSelectors = [];

window.addEventListener("load", (event)=>{
    for(let e of Array.from(document.getElementsByClassName("argumentSelector"))){
        window.argumentSelectors.push(new ArgumentSelector(<HTMLElement> e, window.argumentSelectors.length));
    }
});