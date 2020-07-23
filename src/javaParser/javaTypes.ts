import { JavaClassFile, Modifier, FieldRefInfo, SourceFileAttributeInfo, MethodInfo, FieldInfo, ElementValue, AttributeInfo, ConstantValueAttributeInfo } from "java-class-tools";
import { Method, Field } from "../codeElements";
import { getStringFromPool, ClassDetail, getClassDetail, getScope, ClassType, getClassType, getValueFromPool } from "./parserFunctions";

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
    
    /**
     * Iterate over the attached attributes
     * @param file The `JavaClassFile` with relevant constant pool
     * @param attributes The attributes to parse
     * @param callbacks A hashmap with <Attribute name, Callback> such that an attribute with the given name will call the callback
     */
    protected parseAttributes(file:JavaClassFile, attributes: AttributeInfo[], callbacks:{[name:string]: (attr:AttributeInfo)=>void}){
        let clbk:(attr:AttributeInfo)=>void = null;
        for(let attr of attributes){
            if((clbk = callbacks[getStringFromPool(file, attr.attribute_name_index)]) !== undefined){
                clbk(attr);
            }
        }
    }
}

export class JavaClass extends JavaBase{

    public readonly pckg: string;
    public readonly superClass: ClassDetail;
    public readonly type: ClassType;
        
    public readonly classFile: JavaClassFile;
    public srcFile: string;
    
    public readonly fields: JavaField[];
    public readonly methods: JavaMethod[];
    public readonly innerClasses: JavaInnerClass[];

    constructor(file:JavaClassFile, basePath: string){        
        // Get name and package
        let nameDetail = getClassDetail(getStringFromPool(file, file.this_class));
        console.log(getStringFromPool(file, file.this_class));
        console.log(nameDetail);
        super(nameDetail.name, nameDetail.full, getScope(file.access_flags), (file.access_flags & Modifier.FINAL) === Modifier.FINAL);
        this.classFile = file;

        this.pckg = nameDetail.pckg;
        
        // Get class type
        this.type = getClassType(file.access_flags);

        // Get superclass and interfaces
        this.superClass = getClassDetail(getStringFromPool(file, file.super_class));
        // TODO: Add code to get interfaces

        this.fields = []
        // Get fields
        for(let f of file.fields){
            this.fields.push(new JavaField(this, f));
        }

        this.methods = [];
        // Get methods
        for(let f of file.methods){
            // this.methods.push(new JavaMethod());
        }

        this.srcFile = "";
        this.parseAttributes(file, file.attributes, {
            "SourceFile": (attr) => 
                this.srcFile = basePath+"/"+this.pckg+"/"+getStringFromPool(file, (<SourceFileAttributeInfo> attr).sourcefile_index),
        });

        this.innerClasses = [];

    }

    public getPrettyName(): string{
        return this.pckg.replace(/\//g, ".")+"."+this.name;
    }
    public getFullPrettyName(includeClass:boolean=false): string{
        if(this.superClass.full === "java/lang/Object"){
            return this.getPrettyName();
        }
        if(includeClass){
            return this.getPrettyName() + " extends " + this.superClass.full.replace(/\//g, "."); 
        } else {
            return this.getPrettyName() + " extends " + this.superClass.full.substr(this.superClass.full.lastIndexOf("/")+1);
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
        if(this.superClass.full !== "java/lang/Object" && !(this.superClass.full === "java/lang/Enum" && this.type === ClassType.ENUM)){
            out+= " extends "+this.superClass.full.replace(/\//g, ".");
        }
        return out.trim();
    }
}

export class JavaInnerClass extends JavaClass {
    public parentClass: string;
    name: string;
    pckg: string;
    scope: string;
    isFinal: boolean;
    type: ClassType;
    superClass: ClassDetail;
    classFile: JavaClassFile;
    srcFile: string;
    fields: JavaField[];
    methods: JavaMethod[];
    innerClasses: JavaInnerClass[];
    
    oldConst(){
        // super(name, pckg, scope, isFinal, type, superClass, classFile, srcFile, fields, methods, innerClasses);
        this.parentClass = this.descriptor.substring(0,this.descriptor.lastIndexOf("$"));
        this.name = this.name.substring(this.name.lastIndexOf("$")+1);
    }

    public static fromClass(cls:JavaClass): JavaInnerClass{
        console.log(cls);
        // return new JavaInnerClass(cls.descriptor.substring(cls.descriptor.lastIndexOf("/")+1), cls.pckg, cls.scope, cls.isFinal, cls.type, cls.superClass, cls.classFile, cls.srcFile, cls.fields, cls.methods, cls.innerClasses);
        return null;
    }
    
    public getPrettyName(): string{
        return this.parentClass.replace(/\//g, ".")+"$"+this.name;
    }
    public getFullPrettyName(includeClass:boolean): string{
        // Don't show extension if it's the default for enum
        if(this.superClass.full === "java/lang/Object" || (this.superClass.full === "java/lang/Enum" && this.type === ClassType.ENUM)){
            return this.getPrettyName();
        }
        if(includeClass){
            return this.getPrettyName() + " extends " + this.superClass.full.replace(/\//g, "."); 
        } else {
            return this.getPrettyName() + " extends " + this.superClass.full.substr(this.superClass.full.lastIndexOf("/")+1);
        }
    }
}

export abstract class JavaElement extends JavaBase{
    public readonly nameIndex: number;
    public readonly descriptorIndex: number;
    
    public readonly parentClass: ClassDetail;
    
    public readonly isStatic: boolean;

    constructor(parent:JavaClass, element: FieldInfo | MethodInfo){
        let file = parent.classFile;
        super(getStringFromPool(file, element.name_index), getStringFromPool(parent.classFile, 
            element.descriptor_index), getScope(element.access_flags), ((element.access_flags & Modifier.FINAL) === Modifier.FINAL));
        
        this.nameIndex = element.name_index;
        this.descriptorIndex = element.descriptor_index;
        
        this.parentClass = getClassDetail(parent.descriptor);
        this.isStatic = ((element.access_flags & Modifier.STATIC) === Modifier.STATIC);
    }


    public equals(e:JavaElement): boolean{
        return e.parentClass === this.parentClass
            && e.name === this.name
            && e.descriptor === this.descriptor;
    }

    public toString(): string{
        return this.parentClass.full.replace(/\//g, ".")+"."+this.name+this.descriptor;
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
        let out = includeClass ? this.parentClass.full.replace(/\//g, ".")+"/" : ""; 
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
    
    public nameIndex: number;
    public descriptorIndex: number;
    public name: string;
    public descriptor: string;
    public parentClass: ClassDetail;
    public scope: Scope;
    public isStatic: boolean;
    public isFinal: boolean;
    public isAbstract: boolean;
    public startLine: number;
    public returnType: Type;
    public args: MethodArg[];
    private prettySiganture: string;
    // super(nameIndex, descriptorIndex, name, descriptor, parentClass, scope, isStatic, isFinal);

    public getPrettyName(): string{
        return this.prettySiganture;
    }
}

export interface MethodArg {
    name:string,
    type:Type
}

export class JavaField extends JavaElement{
    
    public readonly type: Type;
    public constVal: any;

    constructor(parent: JavaClass, field:FieldInfo){
        super(parent, field);
        this.type = new Type(this.descriptor);
        
        this.constVal = null;
        this.parseAttributes(parent.classFile, field.attributes, 
            {
                "ConstantValue": (attr) => 
                    this.constVal = getValueFromPool(parent.classFile, (<ConstantValueAttributeInfo> attr).constantvalue_index),
            }
        );
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
