import { TreeItemCollapsibleState } from 'vscode';
import { EnumItem, Field, Linkable, Method, TreeElement, ReferencedSubsystem, ReferencedHardware } from './codeElements';
import { JavaBase, ClassType, Scope, Type, DescriptorTypes } from './javaParser/common';
import { JavaClass, JavaInnerClass } from './javaParser/JavaClasses';
import { JavaMethod } from './javaParser/JavaElements';
import { Loader } from './loader';
import { config } from './config';


export class TreeType extends TreeElement<JavaClass> implements Linkable {

    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.Collapsed;

    constructor(
        cls:JavaClass,
        iconName:string,
        type:string
    ) {
        super(cls, iconName, type);

        let inners = [];
        let enums = [];
        for(let i of this.element.innerClasses){
            if(i.type === ClassType.ENUM){
                enums.push(new Enum(i));
            } else {
                inners.push(new InnerClass(i));
            }
        }
        this.children.push(...inners, ...enums);

        console.log(this.children);
   
        // Order by properties
        let psfinal = [];
        let final = [];
        let fields = [];
        for(let f of this.element.fields){
            if(f.scope === Scope.PUBLIC && f.isStatic && f.isFinal){
                psfinal.push(new Field(f));
            } else if(f.isFinal) {
                final.push(new Field(f));
            } else {
                fields.push(new Field(f));
            }
        }
        // Combine into children
        this.children.push(...psfinal, ...final, ...fields);

        console.log(this.children);
        for(let m of this.element.methods){
            this.children.push(new Method(m, this.element));
        }
    }

    /**
     * Function to be called after all classes have been loaded
     * @param l {@link Loader} instance
     */
    lateLoad(l:Loader):void {};

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
    
    lateLoad(l:Loader){
        let constructor: JavaMethod;
        for(let i=0; i<this.children.length; i++){
            let m = this.children[i];
            if(m instanceof Method && m.element.name === "<init>"){
                constructor = m.element;
                this.children.splice(i,1);
                break;
            }
        }
        for(let p of constructor.params){
            if(p.type.type !== DescriptorTypes.CLASS){
                continue;
            }
            for(let h of [ ...config.hardwareTypes.motorControllers, ...config.hardwareTypes.pneumatics, ...config.hardwareTypes.sensors, ...config.hardwareTypes.other]){
                if(p.type.fullClass === h.descriptor){
                    this.children.unshift(new ReferencedHardware(p.name, h));
                    break;
                }
            }
            
        }
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

    lateLoad(l:Loader){
        let constructor: JavaMethod;
        for(let i=0; i<this.children.length; i++){
            let m = this.children[i];
            if(m instanceof Method && m.element.name === "<init>"){
                constructor = m.element;
                this.children.splice(i,1);
                break;
            }
        }
        for(let p of constructor.params){
            if(p.type.type !== DescriptorTypes.CLASS){
                continue;
            } 
            for(let s of l.subsystems){
                if(s.element.pckg +"/"+ s.element.name === p.type.fullClass){
                    this.children.unshift(new ReferencedSubsystem(s, p.name, false));
                    break;
                }
            }
        }
    }
}

export class InnerClass extends TreeType{
    constructor(innerClass:JavaInnerClass){
        super(innerClass, "vscode/class", "class");
    }
}

export class Enum extends TreeType {
    
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