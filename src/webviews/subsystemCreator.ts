import { WebviewBase } from "./webView";
import * as vscode from "vscode";
import { config } from "../config";
import { webview } from "resources/html/scripts/common";
import { ClassBuilder } from "../classBuilder/classBuilder";
import { Scope } from "../javaParser/common";
import { getClassDetail } from "../javaParser/parserFunctions";

export class SubsystemCreator extends WebviewBase {


    constructor(context:vscode.ExtensionContext){
        super(context, "newSubsystem", "New Subsystem", "subsystemCreator.html");
    }

    public getHTML():string{
        return this.html
            .replace(/\${PACKAGE}/g, "ca.ler.robot.subsystems")
            .replace(/\${HARDWARE_TYPES}/g, JSON.stringify(config.hardwareTypes));
    }

    onMessage(message:webview.Message):void {
        if(message.id === "submit"){
            this.buildClass(message.payload);
        }
    }

    buildClass(payload: {[key:string]: webview.InputState}){
        let fields:ClassBuilder.Field[] = [];
        let constructorParams:ClassBuilder.MethodParam[] = [];
        let constructorBody = "";

        for(let h of payload["hardware"].data){
            let t = getClassDetail(h.type);
            fields.push(new ClassBuilder.Field({import:t.full, type:t.name, isArray:false}, h.name, Scope.DEFAULT, "TODO: Add documentation"));
            constructorParams.push({import:t.full, type:t.name, name:h.name, doc:"TODO: Document", isArray:false});
            constructorBody += `this.${h.name} = ${h.name};\n`;
        }

        constructorBody+="\n//TODO: Add hardware initialization\n";
        let constructor = new ClassBuilder.Method(null, null, constructorParams, Scope.PUBLIC, "TODO: Add doc");

        let builder = new ClassBuilder(payload["package"].data, payload["name"].data, Scope.PUBLIC, {import:"edu.wpi.first.wpilibj2.command.SubsystemBase", type:"SubsystemBase"}, [], fields, [constructor], "TODO:Add doc");
        console.log(builder.getCode());
    }

    
}