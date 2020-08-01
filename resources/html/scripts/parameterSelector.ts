/// <reference lib="dom" />
import { InputValidator, EmptyTest, InputTest, RegexTest } from "./inputValidator";
import { webview } from "./common";

const JAVA_PRIMITIVES:ParameterItem.Type[] = [
    {descriptor:"B",name:"byte"},
    {descriptor:"Z",name:"boolean"},
    {descriptor:"C",name:"char"},
    {descriptor:"S",name:"short"},
    {descriptor:"I",name:"int"},
    {descriptor:"F",name:"float"},
    {descriptor:"L",name:"long"},
    {descriptor:"D",name:"double"},
    {descriptor:"java.lang.String",name:"String"}
];

export class ParameterSelector implements webview.Persistent{
    
    /** The `.parameterSelector` element */
    root: HTMLElement;
   
    /** The index in holding array */
    index: number;
    /** Button used to add new parameter */
    addButton: HTMLButtonElement;
    /** Parameters for construtor, in order */
    parameters: ParameterItem[];
    /** Child HTML elements */
    children: HTMLCollection;

    /** The constructor used to create parameters */
    paramType: new (parent:ParameterSelector) => ParameterItem;

    /**
     * Create a new ParameterSelector from a `.parameterSelector` element
     * 
     * @param rootElement The `.parameterSelector` element
     * @param index The index in holding array
     * @param paramType The type used for parameters
     */
    constructor(rootElement:HTMLElement, index:number, paramType: new (parent:ParameterSelector) => ParameterItem){
        this.root = rootElement;
        this.index = index;
        this.paramType = paramType;
        
        this.addButton = <HTMLButtonElement> rootElement.getElementsByClassName("addParameter")[0];


        this.parameters = [];

        this.addButton.addEventListener("click", () => {
            this.parameters.push(new paramType(this));
            this.refresh();
        });
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
        console.log(html);
        console.log(this.root.innerHTML);

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
     * Set a property of a particular parameter
     * 
     * @param index The index of the parameter 
     * @param id The ID for the property
     * @param value The value for the property
     */
    setProperty(index:number, id:string, value:any){
        this.parameters[index].setProperty(id, value);
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
            this.parameters = [];
            for(let d of data.data){
                let p = new this.paramType(this);
                p.fromState(d);
                this.parameters.push(p);
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
            out.data.push(p.getState());
        }
        return out;
    }

}

abstract class ParameterItem {
    
    parent: ParameterSelector;
    parentIndex: number;
    typeData: ParameterItem.TypeData;

    type: string;
    includePrimitives:boolean = false;

    validator:InputValidator;

    root: HTMLElement;
    dragger: HTMLElement;

    /**
     * Create a new parameter item
     * 
     * @param parent The parent ParameterSelector
     * @param validator The input validator to be used 
     * 
     */
    constructor(parent:ParameterSelector, validator:InputValidator=null, typeData: ParameterItem.TypeData){
        this.parent = parent;
        this.parentIndex = parent.index;
        this.validator = validator;
        this.typeData = typeData;

        let a = Object.keys(this.typeData)[0];
        let b = this.typeData[a][0];
        this.type = b.descriptor;
    }

    /**
     * Get the HTML string for the selector object
     * 
     * @param index The index in the parameters array
     * @param data The data used in constructing the selector, in the format {groupName1:[items2], groupname2:[items2]}. **NOTE:** If a groupName is `""`, that group will be listed at the top-level first.
     * @param addPrimitives If true, java primitives (int, double, char, etc) will be added, as well as `java.lang.String`
     */
    getTypeSelectorHTML(index: number, data: ParameterItem.TypeData, addPrimitives: boolean = false): string {
        if (addPrimitives) {
            data["Primitives"] = JAVA_PRIMITIVES;
        }
        let out = `<select onChange="${this.parentDescriptor}.setType(${index}, this)">\n`;
        if("" in data){
            for (let element of data[""]) {
                out += `<option value="${element.descriptor}" ${this.type === element.descriptor ? "selected" : ""}>${element.name}</option>\n`;
            }
        }
        for (let group of Object.keys(data)) {
            if(group === ""){continue;} // This group has already been handled
            out += `<optgroup label="${group}">\n`;
            for (let element of data[group]) {
                out += `<option value="${element.descriptor}" ${this.type === element.descriptor ? "selected" : ""}>${element.name}</option>\n`;
            }
            out += `</optgroup>\n`;
        }
        out += "</select>";
        return out;
    }

    /**
     * Get the HTML to render
     * 
     * @param index The index in the parameters array
     * @return The string representation of the HTML
     */
    getHTML(index:number): string{
        return `
        <div class="param">
            <div class="dragger">&#9776;</div>
            ${this.getTypeSelectorHTML(index, this.typeData, this.includePrimitives)}
            ${this.getInputHTML(index)}
            <button type="button" onclick="parameterSelectors[${this.parentIndex}].removeParam(${index})">-</button>
            <div class="notif">&#9888; <span class="msg">placeholder</span></div>
        </div>`;
    }

    /**
     * Get the HTML for the variable input section
     * 
     * @param index The index in the parameters array
     * @return The string representation of the HTML
     */
    abstract getInputHTML(index:number):string;
    
    /**
     * Update the various listeners and references used by the parameter
     * 
     * @param root The `.param` element 
     * @remark This function SHOULD NOT be overriden, instead use `onUpdate`, which is called by this function
     */
    update(root:HTMLElement):void {
        this.root = root;
        this.validator.update(root);

        // Setup drag behaviour
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
        this.onUpdate(root);
    }

    /**
     * Set a propery on the parameter, should be called by `onchange`/`oninput` functions
     * @param id The ID of the property
     * @param value 
     */
    abstract setProperty(id:string, value:any):void;

    /**
     * Update the various listeners and references used by the parameter, called by `update`
     * 
     * @param root The `.param` element 
     */
    abstract onUpdate(root:HTMLElement):void;

    /**
     * Get a descriptor for the parent element for the HTML
     */
    protected get parentDescriptor():string {
        return `parameterSelectors[${this.parentIndex}]`;
    }

    abstract fromState(data: any): void;
    abstract getState(): any;
}

export namespace ParameterItem {
    export interface TypeData {
        [group:string]:Type[]
    }
    export interface Type {
        descriptor:string, 
        name:string
    }
}

export class HardwareParameter extends ParameterItem {

    name:string = "";
    
    input: HTMLInputElement;

    constructor(parent:ParameterSelector){
        super(parent, 
            new InputValidator(null, new EmptyTest(".input"))
            .addTest("namechars", new RegexTest(".input", "Variable name can only contain alphanumeric characters", 25, /^[A-Za-z0-9]*$/g))
            .addTest("lowercase", new RegexTest(".input", "Variable name should start with a lowercase", 15, /^[a-z]|^$/g)),
            window.hardwareTypes);
    }

    getInputHTML(index: number): string {
        return `<input class="input" type="text" value="${this.name}" onChange="${this.parentDescriptor}.setProperty(${index}, 'name', this)" />`;
    }

    setProperty(id: string, value: any): void {
        if(id === "name"){
            this.name = (<HTMLInputElement>value).value;
        }
    }

    onUpdate(root: HTMLElement): void {        
        this.input = root.querySelector(".input");
        this.input.oninput = () => {
            this.validator.validate(false);
        };
    }


    fromState(data: {type:string, name:string}): void {
        this.type = data.type;
        this.name = data.name;
    }

    getState(): {type:string, name:string} {
        return {
            type:this.type,
            name:this.name
        };    
    }

}

export class SubsystemParameter extends ParameterItem {

    name:string = "";
    required:boolean = false;

    nameInput:HTMLInputElement;
    requiredCheck:HTMLInputElement;

    constructor(parent:ParameterSelector){
        super(parent, 
            new InputValidator(null, new EmptyTest(".input .paramName", ""))
            .addTest("namechars", new RegexTest(".input .paramName", "Variable name can only contain alphanumeric characters", 25, /^[A-Za-z0-9]*$/g))
            .addTest("lowercase", new RegexTest(".input .paramName", "Variable name should start with a lowercase", 15, /^[a-z]|^$/g)), 
            window.subsystems);
    }

    getInputHTML(index: number): string {
        return `
        <div class="input" style="display:table">
            <input style="display:table-cell;width:100%" class="paramName" type="text" value="${this.name}" onChange="${this.parentDescriptor}.setProperty(${index}, 'name', this)"/>
            <div style="display:table-cell;width:1px;padding-right:0.5em;user-select:none">
                <nobr>
                <input type="checkbox" id="${this.parentDescriptor}[${index}]">
                <label for="${this.parentDescriptor}[${index}]">Required</label>
                </nobr>
            </div>
        </div>`;
    }
    setProperty(id: string, value: any): void {
        if(id === "name"){
            this.name = value.value;
        } else if(id==="requried"){
            this.required = value.checked;
        }
    }
    onUpdate(root: HTMLElement): void {
        this.nameInput = root.querySelector(".input .paramName");
        this.nameInput.oninput = () => {
            this.validator.validate(false);
        };
    }
    fromState(data: {type:string, name:string, required:boolean}): void {
        this.type = data.type;
        this.name = data.name;
        this.required = data.required;
    }
    getState(): {type:string, name:string, required:boolean} {
        return {
            type:this.type,
            name:this.name,
            required:this.required
        };
    }

}

declare global {
    interface Window {
        hardwareTypes:ParameterItem.TypeData;
        HardwareParameter: any;

        subsystems:ParameterItem.TypeData;
        SubsystemParameter: any;
    }
}

// Parameter types need to be added to the window so they can be instantiated at runtime
window.HardwareParameter = HardwareParameter;
window.SubsystemParameter = SubsystemParameter;