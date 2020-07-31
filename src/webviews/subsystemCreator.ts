import { WebviewBase } from "./webView";
import * as vscode from "vscode";
import { config } from "../config";

export class SubsystemCreator extends WebviewBase {

    constructor(context:vscode.ExtensionContext){
        super(context, "newSubsystem", "New Subsystem", "subsystemCreator.html");
    }

    public getHTML():string{
        return this.html
            .replace(/\${PACKAGE}/g, "ca.ler.robot.subsystems")
            .replace(/\${HARDWARE_TYPES}/g, JSON.stringify(config.hardwareTypes));
    }

    
}