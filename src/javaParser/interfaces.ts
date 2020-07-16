import { PRIORITY_HIGHEST } from "constants";
import { DocumentSemanticTokensProvider } from "vscode";

export interface JavaClass {
    public: boolean,
    type: ClassType,
    name: string,
    signature: string,
    srcFile: string,
    superclass: string,
    fields: JavaField[],
    methods: JavaMethod[]
}

abstract class JavaElement {
    constructor(
        public nameIndex: number,
        public descriptorIndex: number,
        public name: string,
        public descriptor: string,
        public parentClass: string,
        public scope: Scope,
        public isStatic: boolean
    ){

    }

    public equals(e:JavaElement): boolean{
        return e.parentClass === this.parentClass
            && e.name === this.name
            && e.descriptor === this.descriptor;
    }

    public toString(): string{
        return this.parentClass.replace(/\//g, ".")+"."+this.name+this.descriptor;
    }

    public abstract prettyName(includeClass:boolean): string;

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
        public isAbstract: boolean,
        public returnType: Type,
        public args: Type[],
        private prettySiganture: string,
    ) {
        super(nameIndex, descriptorIndex, name, descriptor, parentClass, scope, isStatic);
    }

    public prettyName(includeClass:boolean): string{
        let out = includeClass ? this.parentClass.replace(/\//g, ".")+" " : ""; 
        out += this.scope+" ";
        if(this.isStatic) out += "static ";
        if(this.isAbstract) out += "abstract ";
        out += this.returnType.pretty+" ";
        out += this.prettySiganture;
        return out;
    }
}

export interface JavaField {
    name: string,
    type: Type;
    static: boolean,
    constant: boolean,
    scope: Scope,
    constVal: any
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
    DEFAULT="",
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