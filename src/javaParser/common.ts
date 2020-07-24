export abstract class JavaBase{

    constructor(
        public readonly name: string,
        public readonly descriptor: string,
        public readonly scope: string,
        public readonly isFinal: boolean,     
    ){

    }

    public abstract getPrettyName(): string;
    public abstract getFullPrettyName(includeClass:boolean): string;
}

export interface MethodArg {
    name:string,
    type:Type
}
export interface ClassDetail{
    pckg:string,
    name:string,
    outer:string,
    full:string
}


export enum ClassType {
    NORMAL="",
    FINAL="Final",
    INTERFACE="Interface",
    ABSTRACT="Abstract",
    ENUM="Enum"
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
