import { WebviewBase } from "./webView";
import * as vscode from "vscode";
import * as fs from "fs";
import { webview } from "resources/html/scripts/common";
import { Linkable } from "../treeView/codeElements";
import { activate } from "../extension";

export class SetupView extends WebviewBase {

    constructor(context:vscode.ExtensionContext){
        super(context, "setupBotbuilder", "Initialize Botbuilder", "setup.html");
    }

    onMessage(message:webview.Message, panel:vscode.WebviewPanel){
        if(message.id === "submit"){
            let file = this.createConfig(message.payload);
            panel.dispose();
            vscode.commands.executeCommand("ler-botbuilder.openFile", <Linkable>{
                getTarget(){
                    return {
                        file, 
                        line:-1
                    };
                }
            });
            setTimeout(()=>{vscode.commands.executeCommand("workbench.action.reloadWindow");}, 200);
        }
    }

    public getHTML():string{
        let configSchema = fs.readFileSync(__dirname+"/../../../resources/config.schema.json").toString().replace(/\r?\n|\r/g, "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
        return this.html.replace("${CONFIG_SCHEMA}", configSchema);
    }

    createConfig(payload: {[key:string]: webview.InputState}):string{
        let out:{[key:string]: any} = {};
        for(let [key, input] of Object.entries(payload)){
            out[key] = input.data;
        }

        out.hardware = JSON.parse(fs.readFileSync(__dirname+"/../../../resources/defaultHardware.json").toString().replace(/\r?\n|\r/g, "").replace(/\\/g, "\\\\").replace(/'/g, "\\'")).hardware;
       
        let file = vscode.workspace.rootPath + "/" + vscode.workspace.getConfiguration("ler-botbuilder").get("configPath");
        fs.writeFileSync(file, JSON.stringify(out, null, 4));
        return file;
    }
}