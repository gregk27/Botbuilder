const dataPattern = new RegExp(/^data-filter-(\w+)-(\w+)/g);

class InputManager {

    /**
     * Create a new input manager, from a `.inputGroup` element
     * 
     * @param {Element} e 
     */
    constructor(e){
        /** @type {{[name:string]:InputFilter}} */
        this.filters = {};
        
        this.noEmpty = false;

        // Get filters
        /** @type {RegExpExecArray} */
        let match;
        for(let a of Array.from(e.attributes)){
            // If the attribute is a filter attirbute
            dataPattern.lastIndex=0;
            if((match=dataPattern.exec(a.name))!==null){
                console.log(match);
                if(this.filters[match[1]] === undefined){
                    this.filters[match[1]] = new InputFilter(match[1]);
                }
                if(match[2] === "regex"){
                    this.filters[match[1]].regex = new RegExp(a.value);
                }
                if(match[2] === "message"){
                    this.filters[match[1]].message = a.value;
                }
                if(match[2] === "level"){
                    this.filters[match[1]].level = a.value;
                }
            } else if(a.name === "data-verifier-noempty"){
                this.noEmpty = true;
            }
        }

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
        let val = this.input.value;
        if(checkEmpty && this.noEmpty && val.trim() === ""){
            this.setNotif("Cannot be empty", 20);
            return false;
        }

        let result = true;
        let notif = "";
        let level = -1;

        for(let f of Object.values(this.filters)){
            if(!f.exec(val)){
                if(f.level >= 20){
                    result = false;
                }
                if (f.level === level){
                    notif += "\n" + f.message;
                } else if(f.level > level){
                    notif = f.message;
                    level = f.level;
                }
            }
        }
        if(!result){
            this.setNotif(notif, level);
        } else {
            this.clearNotif();
        }
        return result;
    }

    /**
     * Set the notification message and level
     * @param {string} msg 
     * @param {number} level 
     */
    setNotif(msg, level){
        this.notif.innerText = msg;
        if(level >= 20){
            this.notif.parentElement.className = "notif err";
        } else if (level >= 10 && level < 20){
            this.notif.parentElement.className = "notif warn";
        } else {
            this.notif.parentElement.className = "notif";
        }
        this.notif.parentElement.style.display = "initial";
    }

    /**
     * Clear the notification
     */
    clearNotif(){
        this.notif.parentElement.style.display = "none";
    }


}

class InputFilter {

    /**
     * Create a new input filter with the given name
     * @param {string} name 
     */
    constructor(name){
        this.name = name;
        /** @type {RegExp} */
        this.regex = null;
        this.message = `Message not set for ${name}`;

        //Levels are processed as:
        // 1st dig type (0:info, 1:warn, 2:error)
        // 2nd dig priority
        // equal priorities will be combined
        // Only error will block submission
        this.level = 0;
    }

    /**
     * Apply the filter to a string
     * 
     * @param {string} val 
     */
    exec(val){
        this.regex.lastIndex = 0;
        return(this.regex.test(val));
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