import { InputLine } from "./inputLine";

export function initSetup(configSchema:any){
    let baseOptions:InputLine.LineOptions = {
        labelWidth: "2fr",
        resettable: true
    };
    for(let [key, value] of Object.entries(configSchema.properties)){
        if(key === "hardware"){
            continue;
        }
        let p = <Property> value;
        let label = key.replace( /([A-Z])/g, " $1" );
        label = label.charAt(0).toUpperCase() + label.slice(1);

        let opts = <InputLine.LineOptions> JSON.parse(JSON.stringify(baseOptions));

        let type: InputLine.InputType;
        if(p.type === "boolean"){
            debugger;
            opts.resettable = false;
            opts.labelWidth = "10fr";
            type = InputLine.InputType.CHECKBOX;
        } else {
            type = InputLine.InputType.TEXT;
        }
        InputLine.createLine(document.getElementById(p.category), key, label, 
        {desc:p.description, value:p.default, type, ...opts});
    }
}

interface Property {
    "$id": string;
    type: string;
    title: string;
    description: string;
    default: string;
    examples?: string[];
    category:string;
}