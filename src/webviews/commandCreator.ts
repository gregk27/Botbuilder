import { ParameterItem } from "resources/html/scripts/parameterSelector";
import * as vscode from 'vscode';
import { webview } from "../../resources/html/scripts/common";
import { ClassBuilder } from "../classBuilder/classBuilder";
import getConfig, { getAutoCommandPackage, getCommandPackage, getInstantAutoCommandPackage, getInstantCommandPackage, getSubsystemPackage } from "../config";
import { getSubsystems, buildCode, openFile } from "../extension";
import { Scope } from "../javaParser/common";
import { getClassDetail } from "../javaParser/parserFunctions";
import { generateSubsytemTest } from "./buildMock";
import { WebviewBase } from "./webView";
import { Linkable } from "../treeView/codeElements";

export class CommandCreator extends WebviewBase {
    
    constructor(context:vscode.ExtensionContext, private basepath:string){
        super(context, "newCommand", "New Command", "commandCreator.html");
    }

    public getHTML():string{
        let subsystems:ParameterItem.TypeData = {
        };
        for(let subsystem of getSubsystems()){
            let group = subsystem.element.pckg.replace(getSubsystemPackage().replace(/\./g, "/"), "");
            if(!(group in subsystems)){
                subsystems[group] = [];
            }
            subsystems[group].push({
                descriptor:subsystem.element.descriptor,
                name:subsystem.element.name
            });
        }

        return this.html
            .replace(/\${PACKAGE}/g, getCommandPackage())
            .replace(/\${PACKAGE_AUTO}/g, getAutoCommandPackage())
            .replace(/\${PACKAGE_INSTANT}/g, getInstantCommandPackage())
            .replace(/\${PACKAGE_AUTO_INSTANT}/g, getInstantAutoCommandPackage())
            .replace(/\${SUBSYSTEMS}/g, JSON.stringify(subsystems))
            .replace(/\${MOCKS_WARNING}/g, (!getConfig().hasMocks && !getConfig().suppressMocksWarning)+"");
    }

    onMessage(message:webview.Message, panel:vscode.WebviewPanel):void {
        if(message.id === "submit"){
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
    }

    buildClass(payload: {[key:string]: webview.InputState}):string{
        let fields:ClassBuilder.Field[] = [];
        let constructorParams:ClassBuilder.MethodParam[] = [];
        let constructorBody = "";
        let assignments = "";

        for(let h of payload["hardware"].data){
            let t = getClassDetail(h.type);
            fields.push(new ClassBuilder.Field({import:t.full, type:t.name, isArray:false}, h.name, Scope.DEFAULT, h.doc));
            constructorParams.push({import:t.full, type:t.name, name:h.name, doc:h.doc, isArray:false});
            if(h.required){
                constructorBody += `addRequirements(${h.name});\n`;
            }
            assignments += `this.${h.name} = ${h.name};\n`;
        }

        constructorBody += "\n"+assignments.trim();

        let methods: ClassBuilder.Method[] = [];
        methods.push(new ClassBuilder.Method(null, null, constructorParams, Scope.PUBLIC, `Create a new ${payload["package"].data}.\n`, false, false, constructorBody));

        // Create initialization method
        methods.push(new ClassBuilder.Method(null, "initialize", [], Scope.PUBLIC, "Called when the command is initially scheduled.<br/>\nMay be triggered by a button/command group or as a default command", false, false, "//TODO: Initialize subsystems\n", ["Override"]));

        let superclass:any;
        if(payload["instant"].data){
            superclass = {import:"edu.wpi.first.wpilibj2.command.InstantCommand", type:"InstantCommand"};
        } else {
            superclass = {import:"edu.wpi.first.wpilibj2.command.CommandBase", type:"CommandBase"};
            // Create other command methods
            methods.push(new ClassBuilder.Method(null, "execute", [], Scope.PUBLIC, "Called once every 20ms (nominally)", false, false, null, ["Override"]));
            methods.push(new ClassBuilder.Method(null, "end", [{doc:"Flag indicating if the command was interrupted", import:null, isArray:false, name:"interrupted", type:"boolean"}], Scope.PUBLIC, "Called when the command ends", false, false, "//TODO: Initialize subsystems\n", ["Override"]));
            methods.push(new ClassBuilder.Method({import:null, isArray:false, type:"boolean"}, "isFinished", [], Scope.PUBLIC, "Called to check command status, command will end if this returns true.", false, false, "//TODO: Auto generated method stub\nreturn false;", ["Override"]));
        }

        let builder = new ClassBuilder(payload["package"].data, payload["name"].data, Scope.PUBLIC, superclass, [], fields, methods, payload["doc"].data);
        return builder.writeFile(this.basepath);
    }

    buildTest(payload: {[key:string]: webview.InputState}):string {    
        let className = payload["name"].data;
        let setup:ClassBuilder.Method;
        let fields:ClassBuilder.Field[] = [];
        let varName = className.charAt(0).toLowerCase() + className.slice(1);
        let imports:string[] = [];
        if(getConfig().hasMocks){
            let setupBody = "// Create mocks for subsytems hardware\n";
            let args = "";
            for(let h of payload["hardware"].data){
                for(let subsystem of getSubsystems()){
                    // If the subsytem is the one required
                    if(subsystem.element.descriptor === h.type){
                        let subsystems:{name:string, type:string, doc:string}[] = [];
                        // Get the init method's parameters
                        for(let m of subsystem.element.methods){
                            if(m.name === "<init>"){
                                for(let p of m.params){
                                    subsystems.push({name:p.name, type:p.type.fullClass, doc:""});
                                }
                                break;
                            }
                        }
                        let code = generateSubsytemTest(subsystem.element.name, subsystems);
                        fields = [...fields, ...code.fields];
                        setupBody += code.code.replace("\n\n", "\n")+"\n\n";
                        imports.push(subsystem.element.descriptor);
                        args += code.varName+", ";
                        break;
                    }
                }
            }
            args = args.slice(0, -2);

            setupBody += "// Create command instance\n";
            setupBody += `${varName} = new ${className}(${args});`;

            fields.push(new ClassBuilder.Field({import:null, type:className, isArray:false}, varName, Scope.PRIVATE));

            setup = new ClassBuilder.Method(null, "setup", [], Scope.PUBLIC, "Setup hardware before each test.", false, false, setupBody, ["Before"]);
        } else {
            setup = new ClassBuilder.Method(null, "setup", [], Scope.PUBLIC, "Setup hardware before each test.", false, false, null, ["Before"]);
        }
        let sampleTest = new ClassBuilder.Method(null, "sampleTest", [], Scope.PUBLIC, "Sample test method", false, false, "// Arrange\n\n// Act\n\n// Assert\n", ["Test"]);
        let builder = new ClassBuilder(payload["package"].data, className+"Test", Scope.PUBLIC, null, [], fields, [setup, sampleTest], `Test class for ${className}`, ["org.junit.Before", "org.junit.Test", ...imports]);

        return builder.writeFile(getConfig().workspaceRoot + "/" + getConfig().testFolder);
    }

}