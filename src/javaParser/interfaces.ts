import { JavaClassFile, Modifier } from "java-class-tools";
import { Method } from "../codeElements";

export abstract class JavaBase{
    constructor (
        public name: string,
        public descriptor: string,
        public scope: string,
        public isFinal: boolean
    ){

    }

    public abstract getPrettyName(): string;
    public abstract getFullPrettyName(includeClass:boolean): string;
}

export class JavaClass extends JavaBase{

    constructor (
        public name: string,
        public pckg: string,
        public scope: string,
        public isFinal: boolean,
        public type: ClassType,
        public superClass: string,
        public classFile: JavaClassFile,
        public srcFile: string,
        public fields: JavaField[],
        public methods: JavaMethod[],
        public innerClasses: JavaInnerClass[]
    ){
        super(name, pckg+"/"+name, scope, isFinal);
        if(type === ClassType.FINAL){
            this.isFinal = true;
        }
        if(type === ClassType.ENUM){
            if((classFile.access_flags & Modifier.ENUM) === Modifier.ENUM){
                this.isFinal = true;
            }
        }
    }

    public getPrettyName(): string{
        return this.pckg.replace(/\//g, ".")+"."+this.name;
    }
    public getFullPrettyName(includeClass:boolean=false): string{
        if(this.superClass === "java/lang/Object"){
            return this.getPrettyName();
        }
        if(includeClass){
            return this.getPrettyName() + " extends " + this.superClass.replace(/\//g, "."); 
        } else {
            return this.getPrettyName() + " extends " + this.superClass.substr(this.superClass.lastIndexOf("/")+1);
        }
    }
    public getDeclarationString(): string{
        let out = "";
        if(this.scope !== Scope.DEFAULT){out += this.scope;}
        if(this.isFinal){
            out += " final";
        }
        if(this.type === ClassType.INTERFACE){
            out += " interface";
        } else if(this.type === ClassType.ENUM){
            out += " enum";
        } else if(this.type === ClassType.ABSTRACT){
            out += " abstract class";
        } else {
            out += " class";
        }
        out += " "+this.name;
        // Show extensions, except for enum default
        if(this.superClass !== "java/lang/Object" && !(this.superClass === "java/lang/Enum" && this.type === ClassType.ENUM)){
            out+= " extends "+this.superClass.replace(/\//g, ".");
        }
        return out.trim();
    }
}

export class JavaInnerClass extends JavaClass {
    public parentClass: string;
    constructor (
        name: string,
        pckg: string,
        scope: string,
        isFinal: boolean,
        type: ClassType,
        superClass: string,
        classFile: JavaClassFile,
        srcFile: string,
        fields: JavaField[],
        methods: JavaMethod[],
        innerClasses: JavaInnerClass[]
    ){
        super(name, pckg, scope, isFinal, type, superClass, classFile, srcFile, fields, methods, innerClasses);
        this.parentClass = this.descriptor.substring(0,this.descriptor.lastIndexOf("$"));
        this.name = name.substring(name.lastIndexOf("$")+1);
    }

    public static fromClass(cls:JavaClass): JavaInnerClass{
        console.log(cls);
        return new JavaInnerClass(cls.descriptor.substring(cls.descriptor.lastIndexOf("/")+1), cls.pckg, cls.scope, cls.isFinal, cls.type, cls.superClass, cls.classFile, cls.srcFile, cls.fields, cls.methods, cls.innerClasses);
    }
    
    public getPrettyName(): string{
        return this.parentClass.replace(/\//g, ".")+"$"+this.name;
    }
    public getFullPrettyName(includeClass:boolean): string{
        // Don't show extension if it's the default for enum
        if(this.superClass === "java/lang/Object" || (this.superClass === "java/lang/Enum" && this.type === ClassType.ENUM)){
            return this.getPrettyName();
        }
        if(includeClass){
            return this.getPrettyName() + " extends " + this.superClass.replace(/\//g, "."); 
        } else {
            return this.getPrettyName() + " extends " + this.superClass.substr(this.superClass.lastIndexOf("/")+1);
        }
    }
}

export abstract class JavaElement extends JavaBase{
    constructor(
        public nameIndex: number,
        public descriptorIndex: number,
        public name: string,
        public descriptor: string,
        public parentClass: string,
        public scope: Scope,
        public isStatic: boolean,
        public isFinal: boolean,
    ){
        super(name, descriptor, scope, isFinal);
    }

    public equals(e:JavaElement): boolean{
        return e.parentClass === this.parentClass
            && e.name === this.name
            && e.descriptor === this.descriptor;
    }

    public toString(): string{
        return this.parentClass.replace(/\//g, ".")+"."+this.name+this.descriptor;
    }

    /**
     *  Internal function used to get the pretty name.
     *  This is used by prettyName(boolean), and is appended to the class name as required
     */
    public abstract getPrettyName(): string;
    public getFullPrettyName(includeClass:boolean): string{
        return this.getModifiers(includeClass)+this.getPrettyName();
    };
    protected getModifiers(includeClass:boolean): string {
        let out = includeClass ? this.parentClass.replace(/\//g, ".")+"/" : ""; 
        if(this.scope !== Scope.DEFAULT){out += this.scope+" ";}
        if(this.isStatic){out += "static ";}
        if(this.isFinal){out += "final ";}
        return out;
    }

    public is(signature:string): boolean{
        return this.parentClass+this.name+this.descriptor === signature;
    }
}

export class JavaMethod extends JavaElement{       
    
    constructor(
        public nameIndex: number,
        public descriptorIndex: number,
        public name: string,
        public descriptor: string,
        public parentClass: string,
        public scope: Scope,
        public isStatic: boolean,
        public isFinal: boolean,
        public isAbstract: boolean,
        public startLine: number,
        public returnType: Type,
        public args: MethodArg[],
        private prettySiganture: string,
    ) {
        super(nameIndex, descriptorIndex, name, descriptor, parentClass, scope, isStatic, isFinal);
    }

    public getPrettyName(): string{
        return this.prettySiganture;
    }
}

export interface MethodArg {
    name:string,
    type:Type
}

export class JavaField extends JavaElement{
    constructor(
        public nameIndex: number,
        public descriptorIndex: number,
        public name: string,
        public descriptor: string,
        public parentClass: string,
        public scope: Scope,
        public isStatic: boolean,
        public isFinal: boolean,
        public type: Type,
        public constVal: any
    ){
        super(nameIndex, descriptorIndex, name, descriptor, parentClass, scope, isStatic, isFinal);
    }

    public getPrettyName(): string{
        let out = this.type.pretty+" ";
        out += this.name;
        if(this.isFinal){
            out+= "="+this.constVal;
        }
        return out;
    }
}


export class Type {
    public pretty = "";
    public fullClass = "";
    public type: DescriptorTypes = null;
    public isArray: boolean = false;
    public arrayDimens: number = 0;

    constructor(public raw:string){
        if(raw.startsWith(DescriptorTypes.ARRAY)){
            this.isArray = true;
            this.arrayDimens = raw.split("[").length - 1;
            raw = raw.substr(this.arrayDimens);
        } 
        if(raw.startsWith(DescriptorTypes.CLASS)){
            this.type = DescriptorTypes.CLASS;
            this.fullClass = raw.substring(1, raw.length-1);
            this.pretty = this.fullClass.substring(this.fullClass.lastIndexOf("/")+1);
        } else {
            switch(raw){
                case(DescriptorTypes.BYTE):
                    this.type = DescriptorTypes.BYTE;
                    this.pretty = "byte";
                    break;
                case(DescriptorTypes.CHAR):
                    this.type = DescriptorTypes.CHAR;
                    this.pretty = "char";
                    break;
                case(DescriptorTypes.DOUBLE):
                    this.type = DescriptorTypes.DOUBLE;
                    this.pretty = "double";
                    break;
                case(DescriptorTypes.FLOAT):
                    this.type = DescriptorTypes.FLOAT;
                    this.pretty = "float";
                    break;
                case(DescriptorTypes.INT):
                    this.type = DescriptorTypes.INT;
                    this.pretty = "int";
                    break;
                case(DescriptorTypes.LONG):
                    this.type = DescriptorTypes.LONG;
                    this.pretty = "long";
                    break;
                case(DescriptorTypes.SHORT):
                    this.type = DescriptorTypes.SHORT;
                    this.pretty = "short";
                    break;
                case(DescriptorTypes.BOOLEAN):
                    this.type = DescriptorTypes.BOOLEAN;
                    this.pretty = "boolean";
                    break;
                case(DescriptorTypes.VOID):
                    this.type = DescriptorTypes.VOID;
                    this.pretty = "void";
                    break;
            }
        }
        if(this.isArray){
            raw = "[".repeat(this.arrayDimens)+" "+raw;
            this.pretty += "[]".repeat(this.arrayDimens);
        }
    }

}

export enum DescriptorTypes{
    BYTE = "B",
    CHAR = "C",
    DOUBLE = "D",
    FLOAT = "F",
    INT = "I",
    LONG = "J",
    SHORT = "S",
    BOOLEAN = "Z",
    VOID = "V",
    CLASS = "L",
    ARRAY = "["
}

export enum Scope {
    PRIVATE="private",
    DEFAULT="default",
    PROTECTED="protected",
    PUBLIC="public"
}

export enum ClassType {
    NORMAL="",
    FINAL="Final",
    INTERFACE="Interface",
    ABSTRACT="Abstract",
    ENUM="Enum"
}