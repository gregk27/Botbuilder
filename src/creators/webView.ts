import * as vscode from 'vscode';
import * as fs from 'fs';
import { getServers } from 'dns';

const cssPattern = /<link\s*rel=['"]stylesheet['"]\s*type="text\/css"\s*href=['"](\w*\.css)['"]\s*>/g;
const scriptPattern = /<script\s*src=['"](\w*\.js)['"]\s*>/g;

export abstract class WebviewBase {

    options: vscode.WebviewPanelOptions & vscode.WebviewOptions = {
        enableScripts:true
    };
    private html:string;

    constructor(
        context: vscode.ExtensionContext,
        public name:string,
        public title:string,
        private filePath:string
    ) {
        this.filePath = context.extensionPath+"/resources/html/"+filePath;
        this.html = fs.readFileSync(this.filePath).toString();
        console.log(this.html);
        cssPattern.exec(filePath);
        

    }

    protected getHTML():string{
        return this.html;
    }

    show(): vscode.WebviewPanel {
		const panel = vscode.window.createWebviewPanel(this.name, this.title, vscode.ViewColumn.Active, this.options);
        
        //Remove Dev css file
        this.html = this.html.replace(/<link\s*rel=['"]stylesheet['"]\s*type="text\/css"\s*href=['"]dev.css['"]\s*>/g, "")
        this.html = this.html.replace(cssPattern, (substring, filename)=>{
            console.log(substring, filename);
            if(filename !== undefined){
                return substring.replace(filename, this.getResource(filename, panel.webview));
                // return "<style>\n"+fs.readFileSync(this.filePath.substring(0, this.filePath.lastIndexOf('/')+1)+filename)+"\n</style>";
            }
            return substring;
        });
        this.html = this.html.replace(scriptPattern, (substring, filename)=>{
            console.log(substring, filename);
            if(filename !== undefined){
                return substring.replace(filename, this.getResource(filename, panel.webview));
            }
            return substring;
        });

        console.log(this.html);
        panel.webview.html = this.getHTML();

        return panel;
    }
    
    private getResource(path:string, view: vscode.Webview): string{
        let locOnDisk = vscode.Uri.file(this.filePath.substring(0, this.filePath.lastIndexOf('/')+1)+path);
        console.log(this.filePath.substring(0, this.filePath.lastIndexOf('/')+1)+path);
        return view.asWebviewUri(locOnDisk).toString();
        
    }

    private replaceResource(oldPath:string, view: vscode.Webview): void{
        this.html = this.html.replace(oldPath, this.getResource(oldPath, view));
    }

}

export class SubsystemCreator extends WebviewBase {

    constructor(context:vscode.ExtensionContext){
        super(context, "newSubsystem", "New Subsystem", "subsystemCreator.html");
    }

    
}