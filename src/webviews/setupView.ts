import { WebviewBase } from "./webView";
import * as vscode from "vscode";

export class SetupView extends WebviewBase {

    constructor(context:vscode.ExtensionContext, private basepath:string){
        super(context, "setupBotbuilder", "Initialize Botbuilder", "setup.html");
    }

    public getHTML():string{
        return this.html;
    }

}