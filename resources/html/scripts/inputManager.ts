import { InputLine } from "./inputLine";
import { ArgumentSelector } from "./argumentSelector";
import { webview } from "./common";

declare global {
    interface Window {
        /**
         * Holding array for argument selectors
         */
        inputs: InputLine[];
        /**
         * Holding array for argument selectors
         */
        argumentSelectors: ArgumentSelector[];
        /**
         * Function to validate inputs
         */
        validate: ()=>boolean;
        /**
         * Function to get data from inputs
         */
        getData: ()=>webview.InputState[];
        /**
         * Function to send a message to the backend
         */
        sendMessage: (message:webview.Message)=>void;
    }
}

window.inputs = [];
window.argumentSelectors = [];

// Load inputs
window.addEventListener("load", (event)=>{
    for(let e of Array.from(document.getElementsByClassName("inputLine"))){
        window.inputs.push(new InputLine(<HTMLElement> e));
    }
    for(let e of Array.from(document.getElementsByClassName("argumentSelector"))){
        window.argumentSelectors.push(new ArgumentSelector(<HTMLElement> e, window.argumentSelectors.length));
        console.log("Added argument");
        console.log(window.argumentSelectors);
    }
});


// No typings available for frontend api, this is a hack-job spoof for typechecking
declare var acquireVsCodeApi: any;


// This setup is used to keep vscode api private for security
(function(){
    const vscode = acquireVsCodeApi();

    window.sendMessage = (message:webview.Message)=>{
        vscode.postMessage(message);
    };
}());

let saveState = ()=>{
    console.log("Saving state");
    window.sendMessage({
        id:'update',
        payload: window.getData()
    });
};
window.addEventListener("keyup", saveState);
//Put timeout after mouseup so event can register before saving
window.addEventListener("mouseup", ()=>setTimeout(saveState, 50));


window.addEventListener('message', message=>{
    let data = <webview.Message> message.data;
    if(data.id === "setState"){
        console.log("Setting state:");
        let payload = <webview.InputState[]> data.payload;
        console.log(payload);
        for(let p of payload){
            if(p.dataType === webview.InputType.INPUT_LINE){
                for(let i of window.inputs){
                    if(p.id === i.input.id){
                        i.fromState(p);
                        break;
                    }
                }
            } else if (p.dataType === webview.InputType.ARGUMENT_SELECTOR){
                for(let a of window.argumentSelectors){
                    if(p.id === a.root.id){
                        a.fromState(p);
                        break;
                    }
                }
            }
        }
    }
});


window.validate = ()=>{
    let valid = true;
    for(let i of window.inputs){
        valid = i.validate(true) && valid;
    }
    for(let a of window.argumentSelectors){
        valid = a.validate() && valid;
    }
    return valid;
};

// Collect data from inputs into a JSON object
window.getData = ()=>{
    let data = [];
    for(let i of window.inputs){
        data.push(i.getState());
    }
    for(let a of window.argumentSelectors){
        data.push(a.getState());
    }
    return data;
};
