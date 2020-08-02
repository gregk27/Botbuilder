import * as vscode from 'vscode';
import * as fs from 'fs';
import { getServers } from 'dns';
import { webview } from 'resources/html/scripts/common';

const cssPattern = /<link\s*rel=['"]stylesheet['"]\s*type="text\/css"\s*href=['"](\w*\.css)['"]\s*>/g;
const scriptPattern = /<script\s*src=['"](\w*\.js)['"]\s*>/g;

export abstract class WebviewBase {

    options: vscode.WebviewPanelOptions & vscode.WebviewOptions = {
        enableScripts:true
    };
    protected html:string;
    protected state:webview.InputState[];

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

    /**
     * Called internally when a message is recieved, calls onMessage
     * @param message 
     */
    private preOnMessage(message:webview.Message, panel:vscode.WebviewPanel){
        if(message.id === "update"){
            console.log(<webview.InputState[]> message.payload);
            this.state = <webview.InputState[]> message.payload;
        }
        this.onMessage(message, panel);
    }

    /**
     * Function called when a message is recieved from the webview
     * @param message 
     */
    onMessage(message:webview.Message, panel:vscode.WebviewPanel):void {};

    /**
     * Send a message to the webview, can only be called after show();
     * @param message Message to send
     * @returns False if the function has not been bound
     */
    public sendMessage(message:webview.Message):boolean{
        return false;
    }

    show(): vscode.WebviewPanel {
		const panel = vscode.window.createWebviewPanel(this.name, this.title, vscode.ViewColumn.Active, this.options);
        
        //Remove Dev css file
        this.html = this.html.replace(/<link\s*rel=['"]stylesheet['"]\s*type="text\/css"\s*href=['"]dev.css['"]\s*>/g, "");
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
        panel.webview.onDidReceiveMessage((message:any)=>{
            this.preOnMessage(message, panel);
        });
        panel.onDidChangeViewState((event)=>{
            this.sendMessage({
                id:"setState",
                payload: this.state
            });
        });
        this.sendMessage = (message:webview.Message)=>{
            panel.webview.postMessage(message);
            return true;
        };
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