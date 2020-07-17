import * as vscode from 'vscode';
import * as Path from 'path';
import { TreeElement, Field, Method } from './codeElements';
import { JavaClass, Scope } from './javaParser/interfaces';
import { resolveCliPathFromVSCodeExecutablePath } from 'vscode-test';


export class TreeType extends JavaClass implements TreeElement {
    
    children: TreeElement[] = [];
    collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

    constructor (
        base:JavaClass,
        public iconName:string,
    ){
        super(base.name, base.pckg, base.scope, base.isFinal, base.type, base.superClass, base.classFile, base.srcFile, base.fields, base.methods);
        // Order by properties
        let psfinal = [];
        let final = [];
        let fields = [];
        for(let f of this.fields){
            if(f.scope === Scope.PUBLIC && f.isStatic && f.isFinal){
                psfinal.push(new Field(f));
            } else if(f.isFinal) {
                final.push(new Field(f));
            } else {
                fields.push(new Field(f));
            }
        }
        // Combine into children
        this.children = [...psfinal, ...final, ...fields];

        console.log(this.children);
        for(let m of this.methods){
            this.children.push(new Method(m));
        }
    
    }

    getLabel(): string{
        return this.name;
    }
    getDescription(): string {
        return this.getPrettyName();
    }
    getTooltip(): string {
        return this.getFullPrettyName(false);
    }
    getIcon(): { dark: string; light: string; } {
        return {
            dark: TreeElement.RES_FOLDER + `/dark/${this.iconName}.svg`,
            light: TreeElement.RES_FOLDER + `/light/${this.iconName}.svg`
        };
    }

}

export class Subsystem extends TreeType {
    constructor(base:JavaClass){
        super(base, "subsystem");
    }
}

export class Command extends TreeType {
    public static readonly AUTO    = 0b01;
    public static readonly INSTANT = 0b10;

    constructor(base:JavaClass, type = 0){
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

        super(base, icon);
    }
}