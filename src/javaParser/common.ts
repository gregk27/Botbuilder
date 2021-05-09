/**
 * Base class used as foundation by all Java Parser classes
 */
export abstract class JavaBase{

    public javadoc:string = "";

    constructor(
        /**Name of the element */
        public readonly name: string,
        /**Descriptor used to identify the element, should be unique */
        public readonly descriptor: string,
        /**
         * Scope of the element, one of Public, Private, Protected or Default 
         * @see Scope
         */
        public readonly scope: string,
        /**Flag indicating whether the element is final */
        public readonly isFinal: boolean,     
    ){

    }

    /**
     * Get a simple name to represent the element
     * @param extended Flag to include extra information, varies by implementation
     * 
     * @remark Result may differ from {@link JavaBase#name} depending on implementation. Extended effect will be consistent with {@link JavaBase#getPrettyName()}
     * @see JavaBase#getPrettyName() 
     */
    public abstract getName(extended:boolean): string;

    /**
     * Get a prettier name to represent the element
     * @param extended Flag to include extra information, varies by implementation
     * 
     * @remark Extended effect will be consistent with {@link JavaBase#getName()}
     * @see JavaBase#getName() 
     */
    public abstract getPrettyName(extended:boolean): string;

    /**
     * Get a full name to represent the element
     * @param extended Flag to include extra information, varies by implementation
     * 
     * @remark Extended effect will be consistent with {@link JavaBase#getName()}
     * @see JavaBase#getName() 
     */
    public abstract getFullName(extended:boolean): string;

    /**
     * Get a unique descriptive signature
     */
    public abstract getSignature(): string;

    /**
     * Get a string representing the java delcaration
     */
    public abstract getDeclaration(): string;
}

/**
 * Interface used to represent the parameters of a `JavaMethod`
 */
export interface MethodParam {
    name:string,
    type:Type
}
/**
 * Interface used to represent the components of a class package/name string
 * @example ca/example/TestClass$Enum -> pckg: ca/example, name: Enum, outer: TestClass
 */
export interface ClassDetail{
    pckg:string,
    name:string,
    outer:string,
    full:string
}

/**
 * Enum representing the types of classes
 * @remarks A class may be a Final Enum, but that is not represented here
 */
export enum ClassType {
    NORMAL="",
    FINAL="Final",
    INTERFACE="Interface",
    ABSTRACT="Abstract",
    ENUM="Enum"
}
/**
 * Enum representing the possible scopes within Java
 */
export enum Scope {
    PRIVATE="private",
    DEFAULT="default",
    PROTECTED="protected",
    PUBLIC="public"
}
/**
 * Type shorthands used by java `.class` files.
 * @remarks Classes and arrays are only represented by `L` and `[` respectively
 */
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

/**
 * Class representing and parsing java types
 */
export class Type {
    /**
     * A pretty-printable type name
     */
    public pretty = "";
    /**
     * The full class package/name
     * @remarks This is only used with non-primitive types
     */
    public fullClass = "";
    /**
     * The type, taken from {@link DescriptorTypes}
     * @remarks Non-primitives will have the value `DescriptorTypes.CLASS`, and arrays will have the value of their contents
     */
    public type: DescriptorTypes = null;
    /**
     * Flag indicating wether the type is an array
     */
    public isArray: boolean = false;
    /**
     * The depth of the array, 0 if not an array
     */
    public arrayDimens: number = 0;

    /**
     * Create a new Type from a compiled Java description
     * @param raw The raw description
     */
    constructor(public raw:string){
        // Get array dimensions and remove prefix if applicable
        if(raw.startsWith(DescriptorTypes.ARRAY)){
            this.isArray = true;
            this.arrayDimens = raw.split("[").length - 1;
            raw = raw.substr(this.arrayDimens);
        } 
        // If it's a class instead of a primitive, then parse it accordingly
        if(raw.startsWith(DescriptorTypes.CLASS)){
            this.type = DescriptorTypes.CLASS;
            this.fullClass = raw.substring(1, raw.length-1);
            this.pretty = this.fullClass.substring(this.fullClass.lastIndexOf("/")+1);
        } else { // Otherwise it's a primitive
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
        // Reappend array prefix/suffix
        if(this.isArray){
            raw = "[".repeat(this.arrayDimens)+" "+raw;
            this.pretty += "[]".repeat(this.arrayDimens);
        }
    }

}
