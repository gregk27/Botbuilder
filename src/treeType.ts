import { TreeItemCollapsibleState } from 'vscode';
import { EnumItem, Field, Linkable, Method, TreeElement } from './codeElements';
import { JavaBase } from './javaParser/common';
import { JavaClass, JavaInnerClass } from './javaParser/JavaClasses';


export class TreeType extends TreeElement<JavaClass> implements Linkable {

    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.Collapsed;

    constructor(
        cls:JavaClass,
        iconName:string,
        type:string
    ) {
        super(cls, iconName, [type]);
    }

    getIcon(): { dark: string; light: string; } {
        return {
            dark: TreeElement.RES_FOLDER + `/dark/${this.iconName}.svg`,
            light: TreeElement.RES_FOLDER + `/light/${this.iconName}.svg`
        };
    }

    getTarget(){
        return {
            file: this.element.srcFile,
            line: -1
        };
    }

}

export class Subsystem extends TreeType {
    collapsibleState: TreeItemCollapsibleState;
    constructor(base:JavaClass){
        super(base, "subsystem", "subsystem");
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

        super(base, icon, "command");
    }
}

export class InnerClass extends TreeType{

}

export class Enum extends InnerClass {
    collapsibleState: TreeItemCollapsibleState;
    
    constructor(cls: JavaInnerClass){
        super(cls, "vscode/enum", "enum");
        // Remove elements that are not needed
        let tmpChildren: TreeElement<JavaBase>[] = [];
        for(let c of this.children){
            if(c instanceof Field && c.element.name !== "$VALUES"){
                // Remark elements of the enum
                if(c.element.type.fullClass === this.element.descriptor){
                    c.iconName = "enumItem";
                    tmpChildren.push(new EnumItem(c.element));
                } else {
                    tmpChildren.push(c);
                }
            } else if (c instanceof Method && c.element.name !== "values" && c.element.name !== "valueOf") {
                tmpChildren.push(c);
            }
        }
        this.children = tmpChildren;
    }


}