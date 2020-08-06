import { WebviewBase } from "./webView";
import * as vscode from "vscode";
import { config } from "../config";
import { webview } from "resources/html/scripts/common";
import { ClassBuilder } from "../classBuilder/classBuilder";
import { Scope } from "../javaParser/common";
import { getClassDetail } from "../javaParser/parserFunctions";
import { Linkable } from "../treeView/codeElements";

export class SubsystemCreator extends WebviewBase {

    constructor(context:vscode.ExtensionContext, private basepath:string){
        super(context, "newSubsystem", "New Subsystem", "subsystemCreator.html");
    }

    public getHTML():string{
        return this.html
            .replace(/\${PACKAGE}/g, "ler.robot.subsystems")
            .replace(/\${HARDWARE_TYPES}/g, JSON.stringify(config.hardwareTypes));
    }

    onMessage(message:webview.Message, panel:vscode.WebviewPanel):void {
        if(message.id === "submit"){
            let file = this.buildClass(message.payload);
            panel.dispose();
            vscode.commands.executeCommand("ler-botbuilder.openFile", <Linkable>{
                getTarget(){
                    return{
                        file,
                        line:-1
                    };
                }
            });
        }
    }

    buildClass(payload: {[key:string]: webview.InputState}):string{
        let fields:ClassBuilder.Field[] = [];
        let constructorParams:ClassBuilder.MethodParam[] = [];
        let constructorBody = "";

        for(let h of payload["hardware"].data){
            let t = getClassDetail(h.type);
            fields.push(new ClassBuilder.Field({import:t.full, type:t.name, isArray:false}, h.name, Scope.DEFAULT, h.doc));
            constructorParams.push({import:t.full, type:t.name, name:h.name, doc:h.doc, isArray:false});
            constructorBody += `this.${h.name} = ${h.name};\n`;
        }

        constructorBody+="\n//TODO: Add hardware initialization";
        let constructor = new ClassBuilder.Method(null, null, constructorParams, Scope.PUBLIC, `Create a new ${payload["name"].data}.\n`, false, false, constructorBody);

        let builder = new ClassBuilder(payload["package"].data, payload["name"].data, Scope.PUBLIC, {import:"edu.wpi.first.wpilibj2.command.SubsystemBase", type:"SubsystemBase"}, [], fields, [constructor], payload["doc"].data);
        return builder.writeFile(this.basepath);
    }

    
}