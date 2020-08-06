import { InputValidator, RegexTest, EmptyTest } from "./inputValidator";
import { webview } from "./common";
import { rootCertificates } from "tls";

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
                    this.validator.tests[match[1]] = new RegexTest(".input", null, null, null);
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
