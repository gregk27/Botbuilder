import * as vscode from 'vscode';
import * as fs from 'fs';

export abstract class WebviewBase {

    options: vscode.WebviewPanelOptions & vscode.WebviewOptions = {};
    private html:string;

    constructor(
        context: vscode.ExtensionContext,
        public name:string,
        public title:string,
        htmlFile:string = null
    ) {
        if(htmlFile !== null){
            this.html = fs.readFileSync(context.extensionPath+"/resources/html/"+htmlFile).toString();
            console.log(this.html);
        }
    }

    protected getHTML():string{
        return this.html;
    }

    show(): vscode.WebviewPanel {
		const panel = vscode.window.createWebviewPanel(this.name, this.title, vscode.ViewColumn.Active, this.options);
        panel.webview.html = this.getHTML();

        return panel;
    }

}

export class SubsystemCreator extends WebviewBase {

    constructor(context:vscode.ExtensionContext){
        super(context, "newSubsystem", "New Subsystem", "subsystemCreator.html");
    }

    
}