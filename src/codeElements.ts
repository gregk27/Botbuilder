import { TreeItemCollapsibleState, TreeItem} from 'vscode';
import * as Path from 'path';
import { JavaField, JavaMethod, Scope, JavaClass, JavaInnerClass } from './javaParser/interfaces';
import { Subsystem, Command } from './treeType';



export interface TreeElement {
        
    children: TreeElement[];
    iconName: string;
    collapsibleState: TreeItemCollapsibleState;

    /**
     * Get the label to be displayed in the menu
     */
    getLabel(): string;
    /**
     * Get the description to show beside the label
     */
    getDescription(): string;
    /**
     * Get the tooltip to show on hover
     */
    getTooltip(): string;
    /**
     * Get the paths to the dark and light icons (preferably .csv)
     */
    getIcon(): {dark:string, light:string};
}
export namespace TreeElement {
    export const RES_FOLDER = Path.join(__filename, "..", "..", "resources");
    export function getTreeItem(e:TreeElement): TreeItem{
        let item = new TreeItem(e.getLabel(), e.collapsibleState);
        item.iconPath = e.getIcon();
        item.description = e.getDescription();
        item.tooltip = e.getTooltip();
        if(e instanceof Subsystem){
            item.contextValue = "subsystem";
        } else if(e instanceof Command){
            item.contextValue = "command";
        } else if(e instanceof Field){
            item.contextValue = "field";
        } else if(e instanceof Method){
            item.contextValue = "method";
        }
        return item;
    }
}

export class Field extends JavaField implements TreeElement {

    children: TreeElement[] = [];
    iconName: string;
    collapsibleState: TreeItemCollapsibleState;

    /**
     * Create a new Field instance from a JavaField instance.
     * @param field The JavaField instance to clone from 
     */
    constructor(field:JavaField){
        super(field.nameIndex, field.descriptorIndex, field.name, field.descriptor, field.parentClass, 
            field.scope, field.isStatic, field.isFinal, field.type, field.constVal);
    }

    getLabel(): string{
        return this.name;
    }
    getDescription(): string {
        if(this.isStatic && this.isFinal){
            return "S/F "+this.getPrettyName();
        } else if(this.isStatic){
            return "S "+this.getPrettyName();
        } else if(this.isFinal){
            return "F "+this.getPrettyName();
        }
        return this.getPrettyName();
    }
    getTooltip(): string {
        return this.getFullPrettyName(false);
    }
    getIcon(): { dark: string; light: string; } {
        let icon = this.isFinal ? (this.scope === Scope.PUBLIC && this.isStatic ? "publicStaticConstant" : "constant") : "field";
        return {
            dark: TreeElement.RES_FOLDER + `/dark/vscode/${icon}.svg`,
            light: TreeElement.RES_FOLDER + `/light/vscode/${icon}.svg`
        };
    }
}
export class Method extends JavaMethod implements TreeElement {

    children: TreeElement[] = [];
    iconName: string = "method";
    collapsibleState: TreeItemCollapsibleState;

    /**
     * Create a new Method instance from a JavaMethod instance.
     * @param method The JavaMethod instance to clone from 
     */
    constructor(method:JavaMethod){
        super(method.nameIndex, method.descriptorIndex, method.name, method.descriptor, method.parentClass, method.scope, method.isStatic, method.isFinal, method.isAbstract, method.returnType, method.args, method.getPrettyName());
    }

    getLabel(): string{
        return this.name;
    }
    getDescription(): string {
        if(this.isStatic && this.isFinal){
            return "S/F "+this.getPrettyName();
        } else if(this.isStatic){
            return "S "+this.getPrettyName();
        } else if(this.isFinal){
            return "F "+this.getPrettyName();
        }
        return this.getPrettyName();
    }
    getTooltip(): string {
        return this.getFullPrettyName(false);
    }
    getIcon(): { dark: string; light: string; } {
        return {
            dark: TreeElement.RES_FOLDER + `/dark/vscode/${this.iconName}.svg`,
            light: TreeElement.RES_FOLDER + `/light/vscode/${this.iconName}.svg`
        };
    }

}


export class EnumItem extends Field{
    constructor(f: Field){
        super(f);
    }

    getLabel(): string{
        return this.name;
    }
    getDescription(): string {
        return "";
    }
    getTooltip(): string {
        return this.getFullPrettyName(false);
    }

    getIcon(): { dark: string; light: string; } {
        return {
            dark: TreeElement.RES_FOLDER + `/dark/vscode/enumItem.svg`,
            light: TreeElement.RES_FOLDER + `/light/vscode/enumItem.svg`
        };
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