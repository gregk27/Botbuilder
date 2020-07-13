import * as vscode from 'vscode';
import { CodeElement,Method,Constant,Enum,EnumItem } from './codeElements';
import * as Path from 'path';


export class TreeType extends vscode.TreeItem {
    
    readonly collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

    constructor(
        public readonly label: string,
        public readonly path: string,
        public readonly javadoc: string,
        public elements: CodeElement[],
        private iconName: string
    )  {
        super(label, vscode.TreeItemCollapsibleState.Collapsed);
    }

    get tooltip(): string {
        return this.javadoc.replace("<br/>", "\n");
    }

    get description(): string {
        return this.path;
    }

    iconPath = {
        dark: Path.join(__filename, "..", "..", "resources", "dark", this.iconName+".svg"),
        light: Path.join(__filename, "..", "..", "resources", "light", this.iconName+".svg")
    };
}

export class Subsystem extends TreeType {
    constructor(label:string, path:string, javadoc:string, elements:CodeElement[]){
        super(label, path, javadoc, elements, "subsystem");
    }
}

export class Command extends TreeType {

    public static readonly AUTO    = 0b01;
    public static readonly INSTANT = 0b10;

    constructor(label:string, path:string, javadoc:string, elements:CodeElement[], type = 0){
        let icon = "";
        if((type & Command.AUTO) === Command.AUTO){
            icon = "auto";
        }
        if((type & Command.INSTANT) === Command.INSTANT){
            // If the icon already has text, then instant needs to be capitalized
            if(icon === ""){
                icon = "instant";
            } else {
                icon += "Instant";
            }
        }
        // If the icon already has text, then command needs to be capitalized
        if(icon === ""){
            icon = "command";
        } else {
            icon += "Command";
        }

        super(label, path, javadoc, elements, icon);
    }
}