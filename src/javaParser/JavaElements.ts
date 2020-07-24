import { CodeAttributeInfo, ConstantValueAttributeInfo, FieldInfo, LineNumberTableAttributeInfo, LocalVariableTableAttributeInfo, MethodInfo, Modifier } from "java-class-tools";
import { ClassDetail, DescriptorTypes, JavaBase, MethodParam, Scope, Type } from "./common";
import { JavaClass } from "./JavaClasses";
import { getClassDetail, getScope, getStringFromPool, getValueFromPool, parseAttributes } from "./parserFunctions";

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

export class JavaMethod extends JavaElement{       
    
    public readonly isAbstract: boolean;
    
    private prettySiganture: string;
    public args: MethodParam[];
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
            let arg = <MethodParam>{name:"", type:null};
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
