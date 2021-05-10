import * as Path from "path";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { JavaBase, Scope } from "../javaParser/common";
import { JavaClass } from "../javaParser/JavaClasses";
import { JavaField, JavaMethod } from "../javaParser/JavaElements";
import { Subsystem } from "./treeType";
import { HardwareType } from "../.types/config";
import * as vscode from "vscode";

export interface Linkable{
    getTarget():{file:string, line:number, column?:vscode.ViewColumn};
}

export abstract class TreeElementBase {
    
    children: TreeElementBase[] = [];
    abstract collapsibleState: TreeItemCollapsibleState;

    constructor(
        public iconName:string,
        public contextValue:string
    ) {

    }

    /**
     * Get the label to be displayed in the menu
     */
    abstract getLabel(): string;

    /**
     * Get the description to show beside the label
     */
    abstract getDescription(): string;

    /**
     * Get the tooltip to show on hover
     */
    abstract getTooltip(): string;

    /**
     * Get the paths to the dark and light icons (preferably .csv)
     */
    getIcon(): {dark:string, light:string} {
        return {
            dark: TreeElement.RES_FOLDER + `/dark/${this.iconName}.png`,
            light: TreeElement.RES_FOLDER + `/light/${this.iconName}.png`
        };
    }
}

export namespace TreeElementBase {
    export const RES_FOLDER = Path.join(__filename, "..", "..", "..", "..", "resources");
    export function getTreeItem(e:TreeElementBase): TreeItem{
        let item = new TreeItem(e.getLabel(), e.collapsibleState);
        item.iconPath = e.getIcon();
        item.description = e.getDescription();
        item.tooltip = e.getTooltip();
        item.contextValue = e.contextValue;
        return item;
    }
}

export abstract class TreeElement<T extends JavaBase> extends TreeElementBase{
        
    constructor(
        public element:T,
        iconName:string,
        contextValue:string
    ) {
        super(iconName, contextValue);
    }

    /**
     * Get the label to be displayed in the menu
     */
    getLabel(): string{
        return this.element.getPrettyName(false);
    };
    /**
     * Get the description to show beside the label
     */
    getDescription(): string{
        return this.element.getSignature();
    };
    /**
     * Get the tooltip to show on hover
     */
    getTooltip(): string{
        if(this.element.javadoc !== ""){
            return this.element.getDeclaration() + this.element.javadoc;
        }
        return this.element.getDeclaration();
    };
    /**
     * Get the paths to the dark and light icons (preferably .csv)
     */
    getIcon(): {dark:string, light:string} {
        return {
            dark: TreeElement.RES_FOLDER + `/dark/${this.iconName}.png`,
            light: TreeElement.RES_FOLDER + `/light/${this.iconName}.png`
        };
    }
}


export class Field extends TreeElement<JavaField> {

    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;

    constructor(element:JavaField){
        super(element, "vscode/field", "field");
    }

    getIcon(): { dark: string; light: string; } {        
        let icon = this.element.isFinal ? (this.element.scope === Scope.PUBLIC && this.element.isStatic ? "publicStaticConstant" : "constant") : "field";
        return {
            dark: TreeElement.RES_FOLDER + `/dark/vscode/${icon}.png`,
            light: TreeElement.RES_FOLDER + `/light/vscode/${icon}.png`
        };
    }
}


export class Method extends TreeElement<JavaMethod> implements Linkable {

    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;
    srcFile:string;

    constructor(element:JavaMethod, parent:JavaClass){
        super(element, "vscode/method", "method");
        this.srcFile = parent.srcFile;
    }

    getTarget(): { file: string; line: number; } {        
        return {
            file: this.srcFile,
            line: this.element.startLine
        };
    }
}


export class EnumItem extends TreeElement<JavaField>{

    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;

    constructor(element:JavaField){
        super(element, "vscode/enumItem", "enumItem");
    }
}

class BasicTreeElement extends TreeElementBase {
 
    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;


    constructor(
        iconName:string,
        contextValue:string,
        private label: string,
        private description: string,
        private tooltip: string
    ){
        super(iconName, contextValue);
    }

    getLabel(): string {
        return this.label;
    }
    getDescription(): string {
        return this.description;
    }
    getTooltip(): string {
        return this.tooltip;
    }
}


export class ReferencedSubsystem extends BasicTreeElement implements Linkable{
    
    private subsystem: Subsystem;

    constructor(subsystem:Subsystem, name:string, required:boolean)  {
        super(required ? "requiredSubsystem" : "subsystem", "subsystem", 
            name, subsystem.element.getSignature(), subsystem.element.getPrettyName(true)+subsystem.element.javadoc);
            this.subsystem = subsystem;
    }

    getTarget(): { file: string; line: number; } {
        return this.subsystem.getTarget();
    }

}

export class ReferencedHardware extends BasicTreeElement {

    hardwareType:HardwareType;

    constructor(name:string, type:HardwareType, category:string) {
        // Regex is to strip plurals to get icon names
        super("hardware/"+category.replace(/s$/g, ""), "hardware", name, type.name, "");
        this.hardwareType = type;
    }
}


// export class DefaultCommand extends CodeElement {
//     constructor(label: string, javadoc: string)  {
//         super(label, javadoc, "../command", TreeItemCollapsibleState.None);
//     }
// }