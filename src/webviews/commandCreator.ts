import { WebviewBase } from "./webView";
import * as vscode from 'vscode';
import { ParameterItem } from "resources/html/scripts/parameterSelector";
import { getSubsystems } from "../extension";

export class CommandCreator extends WebviewBase {
    
    constructor(context:vscode.ExtensionContext){
        super(context, "newCommand", "New Command", "commandCreator.html");
    }

    public getHTML():string{
        let subsystems:ParameterItem.TypeData = {
        };
        for(let subsystem of getSubsystems()){
            let group = subsystem.element.pckg.replace("ler/robot/subsystems", "");
            if(!(group in subsystems)){
                subsystems[group] = [];
            }
            subsystems[group].push({
                descriptor:subsystem.element.descriptor,
                name:subsystem.element.name
            });
        }

        return this.html
            .replace(/\${PACKAGE}/g, "ca.ler.robot.commands")
            .replace(/\${PACKAGE_AUTO}/g, "ca.ler.robot.commands.autonomous")
            .replace(/\${PACKAGE_INSTANT}/g, "ca.ler.robot.commands.instant")
            .replace(/\${PACKAGE_AUTO_INSTANT}/g, "ca.ler.robot.commands.autonomous")
            .replace(/\${SUBSYSTEMS}/g, JSON.stringify(subsystems));
    }

}