import * as Path from "path";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { JavaBase, Scope } from "./javaParser/common";
import { JavaClass } from "./javaParser/JavaClasses";
import { JavaField, JavaMethod } from "./javaParser/JavaElements";

export interface Linkable{
    getTarget():{file:string, line:number};
}

export abstract class TreeElement<T extends JavaBase> {
        
    children: TreeElement<JavaBase>[] = [];
    abstract collapsibleState: TreeItemCollapsibleState;

    constructor(
        public element:T,
        public iconName:string,
        public contextValue:string
    ) {

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
        return this.element.getDeclaration();
    };
    /**
     * Get the paths to the dark and light icons (preferably .csv)
     */
    getIcon(): {dark:string, light:string} {
        return {
            dark: TreeElement.RES_FOLDER + `/dark/${this.iconName}.svg`,
            light: TreeElement.RES_FOLDER + `/light/${this.iconName}.svg`
        };
    }
}

export namespace TreeElement {
    export const RES_FOLDER = Path.join(__filename, "..", "..", "resources");
    export function getTreeItem(e:TreeElement<JavaBase>): TreeItem{
        let item = new TreeItem(e.getLabel(), e.collapsibleState);
        item.iconPath = e.getIcon();
        item.description = e.getDescription();
        item.tooltip = e.getTooltip();
        item.contextValue = e.contextValue;
        return item;
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
            dark: TreeElement.RES_FOLDER + `/dark/vscode/${icon}.svg`,
            light: TreeElement.RES_FOLDER + `/light/vscode/${icon}.svg`
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

// export class ReferencedSubsystem extends CodeElement {
//     constructor(label: string, javadoc: string, required: boolean)  {
//         let icon = "";
//         if(required){
//             icon = "../requiredSubsystem";
//         } else {
//             icon = "../subsystem";
//         }
//         super(label, javadoc, icon, TreeItemCollapsibleState.None);
//     }
// }

// export class DefaultCommand extends CodeElement {
//     constructor(label: string, javadoc: string)  {
//         super(label, javadoc, "../command", TreeItemCollapsibleState.None);
//     }
// }