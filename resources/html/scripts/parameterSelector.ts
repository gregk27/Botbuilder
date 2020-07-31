/// <reference lib="dom" />
import { InputValidator, EmptyTest, InputTest, RegexTest } from "./inputValidator";
import { webview } from "./common";

export class ParameterSelector implements webview.Persistent{

    root: HTMLElement;
    index: number;
    addButton: HTMLButtonElement;
    parameters: ParameterItem[];
    children: HTMLCollection;

    /**
     * Create a new ParameterSelector from a `.parameterSelector` element
     * 
     * @param rootElement The `.parameterSelector` element
     * @param index The index in holding array
     */
    constructor(rootElement:HTMLElement, index:number){
        /** The `.parameterSelector` element */
        this.root = rootElement;
        /** The index in holding array */
        this.index = index;
        
        /** Button used to add new parameter */
        this.addButton = <HTMLButtonElement> rootElement.getElementsByClassName("addParameter")[0];

        /** 
         * Parameters for construtor, in order
         */
        this.parameters = [];

        this.addButton.onclick = () => {
            this.parameters.push(new ParameterItem("", window.hardwareTypes.motorControllers[0].descriptor, this));
            this.refresh();
        };
        this.refresh();
    }

    /**
     * Update the html
     */
    refresh(){
        let html = "";
        for(let i=0; i<this.parameters.length; i++){
            html += this.parameters[i].getHTML(i);
        }
        this.root.getElementsByClassName("params")[0].innerHTML = html;

        this.children = this.root.getElementsByClassName("param");
        for(let i=0; i<this.children.length; i++){
            this.parameters[i].update(<HTMLElement> this.children.item(i));
            this.parameters[i].validator.validate(false);
        }
    }

    /**
     * Remove an parameter
     * @param index The index of the parameter 
     */
    removeParam(index: number){
        this.parameters.splice(index, 1);
        this.refresh();
    }

    /**
     * Set the type of a particular parameter
     * 
     * @param index The index of the parameter
     * @param selector `select` element with type
     */
    setType(index:number, selector:HTMLInputElement){
        this.parameters[index].type = selector.value;
        console.log(this.parameters);
    }

    /**
     * Set the name of a particular parameter
     * 
     * @param index The index of the parameter 
     * @param input Text input with name
     */
    setName(index:number, input:HTMLInputElement){
        this.parameters[index].name = input.value;
        console.log(this.parameters);
    }

    /**
     * Check that parameters are valid
     */
    validate():boolean{
        let res = true;
        for(let p of this.parameters){
            res = res && p.validator.validate(true);
        }
        return res;
    }

    /**
     * Called while an parameter is being dragged
     * 
     * @param yPosition The current y position of the actively dragged parameter
     * @param active Actively dragged parameter
     * @reutrns The position in the array the dragged parameter would be dropped in
     */
    onDrag(yPosition:number, active:ParameterItem){
        let tmpChildren = <HTMLElement[]> Array.from(this.children);
        let activeIdx = this.parameters.indexOf(active);
        tmpChildren.splice(activeIdx, 1);

        /** Style to be used for active border */
        const borderStyle = "2px solid white";
        /** Value to return, the position in the array the dragged parameter would be dropped in */
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
     * Called when the dragged parameter is dropped
     * This will reorder the parameters to reflect change
     * 
     * @param yPosition The current y position of the actively dragged parameter
     * @param active The actively dragged parameter
     */
    onDrop(yPosition:number, active:ParameterItem){
        let pos = this.onDrag(yPosition, active);
        console.log(pos);

        let a = this.parameters.splice(this.parameters.indexOf(active), 1);
        let b = this.parameters.splice(pos);

        this.parameters = [...this.parameters, ...a, ...b];
        this.refresh();
    }

    
    fromState(data: webview.InputState): void {
        console.log(data);
        if(data.dataType === webview.InputType.PARAMETER_SELECTOR && this.root.id === data.id){
            let payload = <{type:string, name:string}[]>data.data;
            this.parameters = [];
            for(let p of payload){
                this.parameters.push(new ParameterItem(p.name, p.type, this));
            }
            this.refresh();
        }
    }

    getState():webview.InputState {
        let out:webview.InputState = {
            id:this.root.id,
            dataType:webview.InputType.PARAMETER_SELECTOR,
            data:[]
        };
        for(let p of this.parameters){
            out.data.push({
                type:p.type,
                name:p.name
            });
        }
        return out;
    }

}

class ParameterItem {

    name: string;
    type: string;
    parent: ParameterSelector;
    parentIndex: number;

    validator:InputValidator;

    root: HTMLElement;
    dragger: HTMLElement;
    input: HTMLInputElement;

    /**
     * Create a new parameter item
     * 
     * @param {string} name 
     * @param {string} type 
     * @param {ParameterSelector} parent 
     */
    constructor(name:string, type:string, parent:ParameterSelector){
        this.name = name;
        this.type = type;
        this.parent = parent;
        this.parentIndex = parent.index;

        this.validator = new InputValidator(null, new EmptyTest(".paramName"));
        this.validator.addTest("namechars", new RegexTest(".paramName", "Variable name can only contain alphanumeric characters", 25, /^[A-Za-z0-9]*$/g))
            .addTest("lowercase", new RegexTest(".paramName", "Variable name should start with a lowercase", 15, /^[a-z]|^$/g));
    }

    /**
     * Get the HTML to render
     * 
     * @param index The index in the parameters array
     * @return The string representation of the HTML
     */
    getHTML(index:number){
        return `
        <div class="param">
            <div class="dragger">&#9776;</div>
            <select onChange="parameterSelectors[${this.parentIndex}].setType(${index}, this)">
                <optgroup label="Motor Controller">
                    ${
                        window.hardwareTypes.motorControllers.map((val)=> {
                            return `<option value="${val.descriptor}" ${this.type === val.descriptor ? "selected" : ""}>${val.prettyName}</option>`;
                        }).join("/n")
                    };
                </optgroup>
                <optgroup label="Pneumatic">
                ${
                    window.hardwareTypes.pneumatics.map((val)=> {
                        return `<option value="${val.descriptor}" ${this.type === val.descriptor ? "selected" : ""}>${val.prettyName}</option>`;
                    }).join("")
                };
                </optgroup>
                <optgroup label="Sensor">
                ${
                    window.hardwareTypes.sensors.map((val)=> {
                        return `<option value="${val.descriptor}" ${this.type === val.descriptor ? "selected" : ""}>${val.prettyName}</option>`;
                    }).join("/n")
                };
                </optgroup>
                <optgroup label="Other">
                ${
                    window.hardwareTypes.other.map((val)=> {
                        return `<option value="${val.descriptor}" ${this.type === val.descriptor ? "selected" : ""}>${val.prettyName}</option>`;
                    }).join("/n")
                };
                </optgroup>
            </select>
            <input class="paramName" type="text" value="${this.name}" onChange="parameterSelectors[${this.parentIndex}].setName(${index}, this)" />
            <button type="button" onclick="parameterSelectors[${this.parentIndex}].removeParam(${index})">-</button>
            <div class="notif">&#9888; <span class="msg">placeholder</span></div>
        </div>`;
    }

    /**
     * Update the various listeners and references used by the parameter
     * 
     * @param root The `.param` element 
     */
    update(root:HTMLElement){
        this.root = root;
        this.validator.update(root);

        this.dragger = root.querySelector(".dragger");
        console.log(this.dragger);
        this.dragger.onmousedown = (event) => {
            console.log("Drag start");
            let movehandler = (event:MouseEvent)=>{
                this.root.style.left = event.pageX.toString()+"px";
                this.root.style.top = "calc("+event.pageY.toString()+"px - 2em)";
                this.parent.onDrag(event.pageY, this);
            };
            let upHandler = (event:MouseEvent)=>{
                document.body.removeEventListener("mousemove", movehandler);
                document.body.removeEventListener("mouseup", upHandler);
                this.parent.onDrop(event.pageY, this);
                this.root.style.position = "initial";
                console.log("mouse up");
            };
            document.body.addEventListener("mousemove",movehandler);
            document.body.addEventListener("mouseup", upHandler);
            
            this.root.style.position = "absolute";
            this.root.style.left = event.pageX.toString()+"px";
            this.root.style.top = "calc("+event.pageY.toString()+"px - 2em)";
        };
        
        this.input = root.querySelector(".paramName");
        this.input.oninput = ()=>{
            this.validator.validate(false);
        };
    }
}

declare global {
    interface Window {
        hardwareTypes:{
            motorControllers: {name:string;prettyName:string;descriptor:string;}[],
            pneumatics: {name:string;prettyName:string;descriptor:string;}[],
            sensors: {name:string;prettyName:string;descriptor:string;}[],
            other: {name:string;prettyName:string;descriptor:string;}[]
        };
    }
}
