import { webview } from "resources/html/scripts/common";
import * as vscode from "vscode";
import { ClassBuilder } from "../classBuilder/classBuilder";
import getConfig, { getMockDescriptor, getSubsystemPackage } from "../config";
import { Scope } from "../javaParser/common";
import { getClassDetail } from "../javaParser/parserFunctions";
import { WebviewBase } from "./webView";
import { Linkable } from "../treeView/codeElements";
import { buildCode } from "../extension";

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
            panel.dispose();
            vscode.commands.executeCommand("botbuilder.openFile", <Linkable>{
                getTarget(){
                    return{
                        file,
                        line:-1
                    };
                }
            });
            if(message.payload.createTest.data){
                this.buildMock(message.payload);
            }
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

    buildMock(payload: {[key:string]: webview.InputState}){
        let fields:ClassBuilder.Field[] = [];
        let setupBody = "// Create mocks for required hardware\n";

        let className = payload["name"].data;
        let varName = className.charAt(0).toLowerCase() + className.slice(1);
        fields.push(new ClassBuilder.Field({import:null, type:className, isArray:false}, varName, Scope.PRIVATE));

        let args = "(";

        for(let h of payload["hardware"].data){
            let mock = getClassDetail(getMockDescriptor(h.type));
            fields.push(new ClassBuilder.Field({import:mock.full, type:mock.name, isArray:false}, h.name, Scope.PRIVATE, h.doc));
            setupBody += `${h.name} = new ${mock.name}();\n`;
            args += h.name+".getMock(), ";
        }
        args = args.slice(0, -2);
        args += ")";

        setupBody += "\n// Create subsystem instance for testing\n";
        setupBody += `${varName} = new ${className}${args};`;

        let setup = new ClassBuilder.Method(null, "setup", [], Scope.PUBLIC, "Setup hardware before each test.", false, false, setupBody, ["Before"]);

        let builder = new ClassBuilder(payload["package"].data, className+"Test", Scope.PUBLIC, null, [], fields, [setup], `Test class for ${className}`, ["org.junit.Before"]);
        builder.writeFile(getConfig().workspaceRoot + "/" + getConfig().testFolder);
    }
}