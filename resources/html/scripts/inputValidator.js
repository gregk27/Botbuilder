
export class InputValidator {

    /**
     * Create a new input manager, from an element with the following children:
     * 
     *  - `.notif` The error message element, with a `.msg` child
     * 
     * @param {Element} e The base element
     * @param {InputTest} emptyTest Test to execute to check for empty input. If null empty check will be skipped.
     */
    constructor(e, emptyTest){
        this.update(e);
        /** Tests executed on validation
         *  @type {{[name:string]:InputFilter}} */
        this.tests = {};
        /** Test to execute to check for empty input */
        this.emptyTest = emptyTest;
    }

    /**
     * Update element references
     * 
     * @param {Element} e The base element
     */
    update(e){
        /**
         * The root element
         */
        this.root = e;

        /**
         * The `.msg` element containing notification text
         */
        this.notif = e.querySelector(".notif .msg");
    }

    /**
     * Execute all filters and get result
     * Note: Filters with level > 10 will yield true
     * 
     * @param {boolean} checkEmpty If true, will run empty check (if `this.noEmpty` is true)
     * @return Boolean if test passed
     */
    validate(checkEmpty){
        if(checkEmpty && this.emptyTest !== null){
            if(!this.runTest(this.emptyTest)){
                this.setNotif(this.emptyTest.message, this.emptyTest.level);
                return false;
            }
        }

        let result = true;
        let notif = "";
        let level = -1;

        for(let t of this.tests){
            if(!t.exec(val)){
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
     * @param {InputTest} test The test to run 
     * @returns Error message string. If the test passed return value should be `null`
     */
    runTest(test){
        if(test.selector === "root"){
            return test.exec(this.root);
        }
        return test.exec(this.root.querySelector(test.selector));
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

export class InputTest {

    /**
     * Create a new input test
     * @param {string} selector 
     * @param {number} level 
     */
    constructor(selector, message, level){
        /**
         * Selector used to pick test element
         * @remarks `root` will pass the root element 
         */
        this.selector = selector;
        /**
         * The error level of the test
         */
        this.level = level;
        /**
         * The test's error message
         */
        this.message = message;
    }

    /**
     * Execute the test
     * @param {Element} e Element as specified by `this.selector` 
     * @returns Boolean indicating if test passed
     */
    exec(e){
        return true;
    }

}

export class RegexTest extends InputTest {
    
    /**
     * Create a new test build around a regex epression
     * 
     * @param {string} selector 
     * @param {string} message 
     * @param {number} level 
     * @param {RegExp} regex 
     */
    constructor(selector, message, level, regex){
        super(selector, message, level);
        this.regex = regex;
    }

    exec(e){
        this.regex.lastIndex = 0;
        return(this.regex.test(e.value));
    }
}

export class EmptyTest extends InputTest {

    /**
     * Create a new test to check if element is empty
     * 
     * @param {string} selector The selector to get the input element
     * @param {string} empty The empty value
     */
    constructor(selector, empty="", message="Cannot be empty"){
        super(selector, message, 30);
        this.empty = empty;
    }

    exec(e){
        this.regex.lastIndex = 0;
        return(e.value === this.empty);
    }
}