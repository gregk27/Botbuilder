import { InputValidator, EmptyTest, RegexTest } from "./inputValidator";

const dataPattern = new RegExp(/^data-filter-(\w+)-(\w+)/g);

class InputManager {

    /**
     * Create a new input manager, from a `.inputGroup` element
     * 
     * @param {Element} e 
     */
    constructor(e){
        this.noEmpty = false;
        this.validator = new InputValidator(e, null);

        // Get DOM elements
        /**
         * The `.msg` element containing notification text
         */
        this.notif = e.querySelector(".notif .msg");
        /**
         * The input element 
         * @type {HTMLInputElement} 
         */
        this.input = e.querySelector(".input");
        /**
         * The `input[type=checkbox]` for overrideing disabled inputs
         * @type {HTMLInputElement}
         */
        this.override = e.querySelector(".enable input[type=checkbox]");
        /**
         * Button to reset input to inital value 
         * 
         * @type {HTMLButtonElement}
         */
        this.resetButton = e.querySelector("button.reset");


        // Get filters
        /** @type {RegExpExecArray} */
        let match;
        for(let a of Array.from(e.attributes)){
            // If the attribute is a filter attirbute
            dataPattern.lastIndex=0;
            if((match=dataPattern.exec(a.name))!==null){
                console.log(match);
                if(this.validator.tests[match[1]] === undefined){
                    this.validator.tests[match[1]] = new RegexTest(".input", null, null, null);
                }
                if(match[2] === "regex"){
                    this.validator.tests[match[1]].regex = new RegExp(a.value);
                }
                if(match[2] === "message"){
                    this.validator.tests[match[1]].message = a.value;
                }
                if(match[2] === "level"){
                    this.validator.tests[match[1]].level = a.value;
                }
            } else if(a.name === "data-verifier-noempty"){
                this.noEmpty = this.validator.emptyTest = new EmptyTest(".input", "");
            }
        }

        // Map override
        if(this.override !== null){
            if(this.input.disabled){
                this.override.checked = false;
            } else {
                this.override.checked = true;
            }

            this.override.onchange = ()=>{
                this.input.disabled = !this.override.checked;
            };
        }

        /** The inital value of the input */
        this.initialValue = this.input.value;
        this.input.oninput = ()=>{
            this.validate();
        };

        if(this.resetButton !== null){
            this.resetButton.onclick = ()=>{
                this.input.value = this.initialValue;
                this.validate();
            };
        }
    }

    /**
     * Execute all filters and get result
     * Note: Filters with level > 10 will yield true
     * 
     * @param {boolean} checkEmpty If true, will run empty check (if `this.noEmpty` is true)
     * @return Boolean if test passed
     */
    validate(checkEmpty) {
        // Currently validation only works for text inputs
        if(this.input.type !== "text"){ return true;}

        return this.validator.validate(checkEmpty);
    }
}

/**
 * Holding array for argument selectors
 * @type {InputManager[]}
 */
var inputs = [];

console.log("Running ts");
window.addEventListener("load", (event)=>{
    for(let e of document.getElementsByClassName("inputLine")){
        inputs.push(new InputManager(e));
    }
});