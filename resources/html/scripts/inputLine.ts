import { webview } from "./common";
import { EmptyTest, InputTest, InputValidator, RegexTest } from "./inputValidator";

const dataPattern = new RegExp(/^data-filter-(\w+)-(\w+)/g);

export class InputLine implements webview.Persistent{

    validator:InputValidator;

    /** The `.msg` element containing notification text */
    notif:HTMLElement;
    /** The input element */
    input:HTMLInputElement;
    /** The `input[type=checkbox]` for overrideing disabled inputs */
    override:HTMLInputElement;
    /** Button to reset input to inital value */
    resetButton:HTMLButtonElement;

    /** The inital value of the input */
    initialValue:string;


    /**
     * Create a new input manager, from a `.inputGroup` element
     * 
     * @param e 
     */
    constructor(e:HTMLElement){
        this.validator = new InputValidator(e, null);

        // Get DOM elements
        this.notif = e.querySelector(".notif .msg");
        this.input = e.querySelector(".input");
        this.override = e.querySelector(".enable input[type=checkbox]");
        this.resetButton = e.querySelector("button.reset");

        // Get filters
        let match: RegExpExecArray;
        for(let a of Array.from(e.attributes)){
            // If the attribute is a filter attirbute
            dataPattern.lastIndex=0;
            if((match=dataPattern.exec(a.name))!==null){
                if(this.validator.tests[match[1]] === undefined){
                    this.validator.tests[match[1]] = new RegexTest(match[1], ".input", null, null, null);
                }
                if(match[2] === "regex"){
                    (<RegexTest> this.validator.tests[match[1]]).regex = new RegExp(a.value);
                }
                if(match[2] === "message"){
                    this.validator.tests[match[1]].message = a.value;
                }
                if(match[2] === "level"){
                    this.validator.tests[match[1]].level = Number.parseInt(a.value);
                }
            } else if(a.name === "data-verifier-noempty"){
                this.validator.emptyTest = new EmptyTest(".input", "");
            }
        }

        // Map override
        if(this.override !== null){
            if(this.input.disabled){
                this.override.checked = false;
            } else {
                this.override.checked = true;
            }

            this.override.addEventListener("change", ()=>{
                this.input.disabled = !this.override.checked;
            });
        }

        this.initialValue = this.input.value;
        this.input.addEventListener("input", ()=>{
            this.validate(false);
        });

        if(this.resetButton !== null){
            this.resetButton.onclick = ()=>{
                this.input.value = this.initialValue;
                if(e.hasAttribute("data-onreset")){
                    eval(e.getAttribute("data-onreset"));
                }
                this.validate(false);
            };
        }
    }

    /**
     * Execute all filters and get result
     * Note: Filters with level > 10 will yield true
     * 
     * @param checkEmpty If true, will run empty check (if `this.noEmpty` is true)
     * @return Boolean if test passed
     */
    validate(checkEmpty:boolean) {
        // Currently validation only works for text inputs
        if(this.input.type !== "text"){ return true;}

        return this.validator.validate(checkEmpty);
    }

    fromState(data: webview.InputState): void {
        if(data.dataType === webview.InputType.INPUT_LINE && this.input.id === data.id){
            if(typeof(data.data) === "boolean"){
                this.input.checked = data.data;
            } else {
                this.input.value = data.data;
            }
            if(data.data !== this.initialValue && this.override !== null){
                this.override.checked = true;
                this.input.disabled = false;
            }
        }
    }

    getState():webview.InputState {
        let data:any;
        if(this.input.type === "checkbox"){
            data=this.input.checked;
        } else {
            data = this.input.value;
        }
        return {id:this.input.id, dataType:webview.InputType.INPUT_LINE, data};
    }

}

export namespace InputLine {
    export enum InputType {
        TEXT="TEXT", 
        CHECKBOX="CHECKBOX"
    }    

    /**
     * Options used for creating an {@link InputLine}
     */
    export interface LineOptions {
        /**
         * Description for the input
         * @defaultValue Empty string
         */
        desc?:string,
        /**
         * The default value for the input
         * 
         * Types:
         *  - Text Input: string
         *  - Checkbox: boolean
         * @defaultValue Empty string
         */
        value?:any,
        /**
         * The type of the input
         * @defaultValue `InputType.TEXT`
         */
        type?:InputType, 
        /**
         * The hint to be displayed, not applicable for checkboxes
         * @defaultValue `null`
         */
        hint?:string, 
        /**
         * Flag to indicate if empty checks should be applied
         * @defaultValue `false`
         */
        noempty?:boolean, 
        /**
         * Flag to indicate if a reset button should be included
         * @defaultValue `false`
         */
        resettable?:boolean, 
        /**
         * Flag to indicate that the input should start disabled, this will also create an override checkbox
         * @defaultValue `false`
         */
        disabled?:boolean, 
        /**
         * Tests to be included with the input
         * @defaultValue Empty array
         */
        tests?:RegexTest[],
        /**
         * Override for the label width, should be a css-compatible value (ex `1fr`).
         * @defaultValue `null`
         */
        labelWidth?:string
    }

    export function createLine(parent:HTMLElement, id:string, label:string, options:LineOptions){
        createLineRaw(parent, id, label, 
            options.desc || "",
            options.value || "",
            options.type || InputType.TEXT,
            options.hint || null,
            options.noempty || false,
            options.resettable || false,
            options.disabled || false,
            options.tests || [],
            options.labelWidth || null
            );
    }

    export function createLineRaw(parent:HTMLElement, id:string, label:string, desc:string, value:any, type:InputType, hint:string="", noempty:boolean=false, resettable:boolean=true, disabled:boolean=false, tests:RegexTest[]=[], labelWidth:string=null) {
        let reset = resettable ? `<button class="reset">&circlearrowleft;</button>` : "";
        let override = disabled ? `            
            <div class="enable"><input type="checkbox" id="override${id}"><label
            for="override${id}">Override</label></div>` : "";
        let input = "";
        if(type === InputType.TEXT){
            input = `<input type="text" value="${value}" class="input" id="${id}" hint="${hint}" ${disabled ? "disabled" : ""} />`;
        } else if(type === InputType.CHECKBOX){
            input = `<input type="checkbox" class="input" id="${id}" ${value ? "checked" : ""} />`;
        }

        let html = ` 
            <div class="notif">&#9888; <span class="msg">placeholder</span></div>
            <label for="${id}">${label}</label>
            ${input}
            <span class="desc">${desc}</span>
            ${reset}
            ${override}`;

        let element = document.createElement("div");
        element.classList.add("inputLine");
        if(labelWidth !== null){
            element.style.gridTemplateColumns = `minmax(100px, ${labelWidth}) 3fr 1fr 2em`;
        }
        element.innerHTML = html;
        element.setAttribute("data-verifier-noempty", `${noempty}`);
        for(let t of tests){
            element.setAttribute(`data-validator-${t.name}-regex`, t.regex.toString());
            element.setAttribute(`data-validator-${t.name}-message`, t.message);
            element.setAttribute(`data-validator-${t.name}-leve`, t.level.toString());
        }
        parent.appendChild(element);
        window.inputs.push(new InputLine(element));
    }
}

declare global {
    interface Window {
        createInput: any;
        inputs:InputLine[];
    }
}

window.createInput = InputLine.createLine;
window.testVal = false;