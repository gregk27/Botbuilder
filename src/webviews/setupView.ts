import { WebviewBase } from "./webView";
import * as vscode from "vscode";
import * as fs from "fs";

export class SetupView extends WebviewBase {

    constructor(context:vscode.ExtensionContext){
        super(context, "setupBotbuilder", "Initialize Botbuilder", "setup.html");
    }

    public getHTML():string{
        let configSchema = fs.readFileSync(__dirname+"/../../../resources/config.schema.json").toString().replace(/\r?\n|\r/g, "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
        return this.html.replace("${CONFIG_SCHEMA}", configSchema);
    }

}