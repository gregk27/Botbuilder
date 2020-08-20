import { webview } from "resources/html/scripts/common";
import * as vscode from "vscode";
import { ClassBuilder } from "../classBuilder/classBuilder";
import getConfig, { getMockDescriptor, getSubsystemPackage } from "../config";
import { buildCode, openFile } from "../extension";
import { Scope } from "../javaParser/common";
import { getClassDetail } from "../javaParser/parserFunctions";
import { WebviewBase } from "./webView";
import { generateSubsytemTest } from "./buildTest";

export class SubsystemCreator extends WebviewBase {

    constructor(context:vscode.ExtensionContext, private basepath:string){
        super(context, "newSubsystem", "New Subsystem", "subsystemCreator.html");
    }

    public getHTML():string{
        return this.html
            .replace(/\${PACKAGE}/g, getSubsystemPackage())
            .replace(/\${HARDWARE_TYPES}/g, JSON.stringify(getConfig().hardware))
            .replace(/\${MOCKS_WARNING}/g, (!getConfig().hasMocks && !getConfig().suppressMocksWarning)+"");
    }

    onMessage(message:webview.Message, panel:vscode.WebviewPanel):void {
        if(message.id === "submit"){
            console.clear();
            let file = this.buildClass(message.payload);
            openFile(file, -1, vscode.ViewColumn.One);
            if(message.payload.createTest.data){
                file = this.buildTest(message.payload);
                openFile(file, -1, vscode.ViewColumn.Two);
            }
            panel.dispose();
            buildCode();
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

    buildTest(payload: {[key:string]: webview.InputState}){
        let className = payload["name"].data;
        let setup:ClassBuilder.Method;
        let fields:ClassBuilder.Field[] = [];
        if(getConfig().hasMocks){
            let code = generateSubsytemTest(className, payload["hardware"].data);
            let setupBody = "// Create mocks for required hardware\n"+code.code;
            fields = code.fields;
    
            setup = new ClassBuilder.Method(null, "setup", [], Scope.PUBLIC, "Setup hardware before each test.", false, false, setupBody, ["Before"]);
        } else {
            setup = new ClassBuilder.Method(null, "setup", [], Scope.PUBLIC, "Setup hardware before each test.", false, false, null, ["Before"]);
        }
        let sampleTest = new ClassBuilder.Method(null, "sampleTest", [], Scope.PUBLIC, "Sample test method", false, false, "// Arrange\n\n// Act\n\n// Assert\n", ["Test"]);
        let builder = new ClassBuilder(payload["package"].data, className+"Test", Scope.PUBLIC, null, [], fields, [setup, sampleTest], `Test class for ${className}`, ["org.junit.Before", "org.junit.Test"]);
        return builder.writeFile(getConfig().workspaceRoot + "/" + getConfig().testFolder);
    }
}