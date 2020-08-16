import { WebviewBase } from "./webView";
import * as vscode from "vscode";
import * as fs from "fs";
import { webview } from "resources/html/scripts/common";

export class SetupView extends WebviewBase {

    constructor(context:vscode.ExtensionContext){
        super(context, "setupBotbuilder", "Initialize Botbuilder", "setup.html");
    }

    onMessage(message:webview.Message, panel:vscode.WebviewPanel){
        if(message.id === "submit"){
            this.createConfig(message.payload);
        }
    }

    public getHTML():string{
        let configSchema = fs.readFileSync(__dirname+"/../../../resources/config.schema.json").toString().replace(/\r?\n|\r/g, "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
        return this.html.replace("${CONFIG_SCHEMA}", configSchema);
    }

    createConfig(payload: {[key:string]: webview.InputState}){
        let out:{[key:string]: any} = {};
        for(let [key, input] of Object.entries(payload)){
            out[key] = input.data;
        }
        console.log(JSON.stringify(out, null, 4));
        fs.writeFileSync(vscode.workspace.rootPath + "/" + vscode.workspace.getConfiguration("ler-botbuilder").get("configPath"), 
            JSON.stringify(out, null, 4));
    }
}