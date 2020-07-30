
export class InputValidator {
        
    /** Tests executed on validation */
    tests:{[name:string]:InputTest};
    /** Test to execute to check for empty input */
    emptyTest: InputTest;
    /** The root element */
    root:HTMLElement;
    /** The `.msg` element containing notification text */
    notif:HTMLElement;

    /**
     * Create a new input manager, from an element with the following children:
     * 
     *  - `.notif` The error message element, with a `.msg` child
     * 
     * @param e The base element
     * @param emptyTest Test to execute to check for empty input. If null empty check will be skipped.
     */
    constructor(e:HTMLElement, emptyTest:InputTest){
        this.update(e);

        this.tests = {};
        this.emptyTest = emptyTest;
    }

    /**
     * Update element references
     * 
     * @param e The base element
     */
    update(e: HTMLElement){
  
        this.root = e;
        this.notif = e.querySelector(".notif .msg");
    }

    /**
     * Execute all filters and get result
     * Note: Filters with level > 10 will yield true
     * 
     * @param checkEmpty If true, will run empty check (if `this.noEmpty` is true)
     * @return Boolean if test passed
     */
    validate(checkEmpty:boolean){
        if(checkEmpty && this.emptyTest !== null){
            if(!this.runTest(this.emptyTest)){
                this.setNotif(this.emptyTest.message, this.emptyTest.level);
                return false;
            }
        }

        let result = true;
        let notif = "";
        let level = -1;

        for(let t of Object.values(this.tests)){
            if(!this.runTest(t)){
                if(t.level >= 20){
                    result = false;
                }
                if (t.level === level){
                    notif += "\n" + t.message;
                } else if(t.level > level){
                    notif = t.message;
                    level = t.level;
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
     * Execute a test
     * @param test The test to run 
     * @returns Boolean indicating if test passed
     */
    runTest(test:InputTest):boolean{
        if(test.selector === "root"){
            return test.exec(this.root);
        }
        return test.exec(this.root.querySelector(test.selector));
    }

    /**
     * Set the notification message and level
     */
    setNotif(msg:string, level:number){
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

export abstract class InputTest {

    /**
     * Create a new input test
     * @param selector 
     * @param level 
     */
    constructor(
        /**
         * Selector used to pick test element
         * @remarks `root` will pass the root element 
         */
        public selector: string,
        /**
         * The test's error message
         */
        public message: string,
        /**
         * The error level of the test
         */
        public level: number) {

    }

    /**
     * Execute the test
     * @param e Element as specified by `this.selector` 
     * @returns Boolean indicating if test passed
     */
    abstract exec(e: HTMLElement):boolean;

}

export class RegexTest extends InputTest {
    
    regex:RegExp;

    /**
     * Create a new test build around a regular epression
     * 
     * @param selector Selector used to pick test element, `root` will yeild the root element 
     * @param message The error message on fail
     * @param level The error level
     * @param regex The regular expression to check against
     */
    constructor(selector:string, message:string, level:number, regex:RegExp){
        super(selector, message, level);
        this.regex = regex;
    }

    exec(e:HTMLInputElement){
        this.regex.lastIndex = 0;
        return(this.regex.test(e.value));
    }
}

export class EmptyTest extends InputTest {

    empty:string;

    /**
     * Create a new test to check if element is empty
     * 
     * @param selector The selector to get the input element
     * @param empty The empty value
     * @param message The error message on fail
     */
    constructor(selector:string, empty="", message="Cannot be empty"){
        super(selector, message, 30);
        this.empty = empty;
    }

    exec(e: HTMLInputElement){
        return(e.value !== this.empty);
    }
}