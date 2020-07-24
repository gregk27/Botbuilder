import { JavaClassFile, Modifier, FieldRefInfo, SourceFileAttributeInfo, MethodInfo, FieldInfo, ElementValue, AttributeInfo, ConstantValueAttributeInfo, CodeAttributeInfo, LineNumberTableAttributeInfo, LocalVariableTableAttributeInfo } from "java-class-tools";
import { Method, Field } from "../codeElements";
import { getStringFromPool, ClassDetail, getClassDetail, getScope, ClassType, getClassType, getValueFromPool, parseAttributes } from "./parserFunctions";

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
        for(let m of file.methods){
            this.methods.push(new JavaMethod(this, m));
        }

        console.log(JSON.stringify(this.methods));

        this.srcFile = "";
        parseAttributes(file, file.attributes, {
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
    
    public readonly isAbstract: boolean;
    
    private prettySiganture: string;
    public args: MethodArg[];
    public readonly returnType: Type;

    public readonly startLine: number;
    
    // super(nameIndex, descriptorIndex, name, descriptor, parentClass, scope, isStatic, isFinal);
    
    constructor(parent:JavaClass, method:MethodInfo){
        super(parent, method);
        // Get the return type from the end of the descriptor
        this.returnType = new Type(this.descriptor.substr(this.descriptor.lastIndexOf(")")+1));
        let startLine = -1;
    
        // Parse argument types, argument values comes from code attributes
        let idxMap = this.getArgs();
        
        // Create pretty readble signature
        let prettySignature = this.name+"(";
        for(let arg of this.args){
            prettySignature+=arg.type.pretty+", ";
        }
        if(prettySignature.endsWith(", ")){
            prettySignature = prettySignature.substring(0,prettySignature.length-2);
        }
        prettySignature+= ")";
        if(this.returnType.type !== DescriptorTypes.VOID){
            prettySignature += "=>"+this.returnType.pretty;
        }
    
        // Get information from various attributes
        parseAttributes(parent.classFile, method.attributes, {
            "Code": (attr)=>{
                parseAttributes(parent.classFile, (<CodeAttributeInfo> attr).attributes, {
                    "LineNumberTable": (codeAttr)=>{
                        // The first element in the index is the first instruction, so line before is method declaration
                        startLine = (<LineNumberTableAttributeInfo> codeAttr).line_number_table[0].line_number-1;
                    },
                    "LocalVariableTable": (codeAttr)=>{
                        // Parse local variable table to get method parameters
                        for(let v of (<LocalVariableTableAttributeInfo> codeAttr).local_variable_table){
                            let vName = getStringFromPool(parent.classFile, v.name_index);
                            // Ignore "this" or any variables declared during the function (pc > 0)
                            if(vName === "this" || v.start_pc !== 0){
                                continue;
                            }
                            let idx = v.index;
                            // Non-static methods have a "this" argument, so index must be bumped down for args to start at 0 
                            if((method.access_flags & Modifier.STATIC) !== Modifier.STATIC){
                                idx --;
                            }
                            this.args[idxMap.get(idx)].name = vName;
                        }
                    }
                });
            },
        });

    }

    private getArgs(): Map<number, number>{        
        this.args = [];

        // Mapping to track index of arguments for matching with names
        let idxMap = new Map<number, number>();
        let nextIdx = 0;

        // Get the arguments from the descriptor
        let argString = this.descriptor.substring(1, this.descriptor.lastIndexOf(")"));
        
        // Variable to track array values
        let currentArrayStart = -1;
        for(let i = 0; i<argString.length; i++){
            let arg = <MethodArg>{name:"", type:null};
            if(argString[i] === "["){ // Track start of array
                if(currentArrayStart === -1){ 
                    currentArrayStart = i;
                }
                continue;
            } else if (currentArrayStart >= 0){ // If this trips, then we've hit the end of the array count
                if (argString[i] === "L"){
                    arg.type = new Type(argString.substring(currentArrayStart, argString.indexOf(";", i)+1));
                    i = argString.indexOf(";", i);
                } else {
                    arg.type = new Type(argString.substring(currentArrayStart, i+1));
                }
                currentArrayStart = -1;
            } else if (argString[i] === "L"){
                arg.type = new Type(argString.substring(i, argString.indexOf(";", i)+1));
                i = argString.indexOf(";", i);
            } else {
                arg.type = new Type(argString[i]);
            }
    
    
            idxMap.set(nextIdx, this.args.length);
            // Longs/doubles take two spaces, so increment index by 2
            if(arg.type.type === DescriptorTypes.LONG || arg.type.type === DescriptorTypes.DOUBLE){
                nextIdx += 2;
            } else {
                nextIdx ++;
            }
            this.args.push(arg);
        }

        return idxMap;
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
    
    public readonly type: Type;
    public constVal: any;

    constructor(parent: JavaClass, field:FieldInfo){
        super(parent, field);
        this.type = new Type(this.descriptor);
        
        this.constVal = null;
        parseAttributes(parent.classFile, field.attributes, 
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
