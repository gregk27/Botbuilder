import * as fs from 'fs';
import {JavaClass, JavaField, Type, Scope, ClassType, JavaMethod, DescriptorTypes} from './interfaces';
import { JavaClassFileReader, ConstantType, Modifier, ClassInfo, JavaClassFile, Utf8Info, ConstantPoolInfo, FieldInfo, ConstantValueAttributeInfo, StringInfo, IntegerInfo, FloatInfo, DoubleInfo, MethodInfo} from 'java-class-tools';
import { TextDecoder } from 'util';
import Big from 'big.js';
import { METHODS } from 'http';

const reader = new JavaClassFileReader();
const textDecoder = new TextDecoder();

export function parse(path:string, classPath:string) : JavaClass{
    let startTime = new Date();
    let file = reader.read(classPath);
    console.log(JSON.stringify(file));
    // let classname = classFile.constant_pool[(<ClassInfo> classFile.constant_pool[classFile.this_class]).name_index];
    let classname = getClassName(file, file.this_class);
    let superclass = getClassName(file, file.super_class)

    console.log(`Parsing ${classname}, extends ${superclass}`);

    let fields: JavaField[] = [];
    let methods: JavaMethod[] = [];

    for(let field of file.fields){
        fields.push(getField(file, field));
    }

    for(let method of file.methods){
        methods.push(getMethod(file, method));
    }

    console.log(`Parsed in: ${new Date().getMilliseconds() - startTime.getMilliseconds()}ms`);

    return {
        public: ((file.access_flags & Modifier.PUBLIC) === Modifier.PUBLIC),
        type: getClassType(file.access_flags),
        name: classname.substr(classname.lastIndexOf("/")+1),
        signature:classname,
        srcFile:"file.java",
        superclass,
        fields,
        methods
    }
}

function getClassType(access:number){
    if((access & Modifier.ENUM) === Modifier.ENUM){
        return ClassType.ENUM;
    } else if((access & Modifier.FINAL) === Modifier.FINAL){
        return ClassType.FINAL;
    } else if ((access & Modifier.INTERFACE) === Modifier.INTERFACE){
        return ClassType.INTERFACE;
    } else if((access & Modifier.ABSTRACT) === Modifier.ABSTRACT){
        return ClassType.ABSTRACT;
    } else {
        return ClassType.NORMAL;
    }
}

function getScope(access:number):Scope{
    if((access & Modifier.PRIVATE) === Modifier.PRIVATE){
        return Scope.PRIVATE;
    } else if ((access & Modifier.PROTECTED) === Modifier.PROTECTED){
        return Scope.PROTECTED;
    } else if((access & Modifier.PUBLIC) === Modifier.PUBLIC){
        return Scope.PUBLIC;
    } else {
        return Scope.DEFAULT;
    }
}

function getValueFromPool(file:JavaClassFile, index:number): any{
    let val = getStringFromPool(file, index);
    if(val === null){
        return getNumberFromPool(file, index);
    } else {
        return val;
    }
}

function getStringFromPool(file:JavaClassFile, index:number): string {
    let info = file.constant_pool[index];
    if(info?.tag === ConstantType.STRING){
        return getStringFromPool(file, (<StringInfo>info).string_index);
    }
    if(info?.tag === ConstantType.UTF8){
        return textDecoder.decode(new Uint8Array((<Utf8Info> info).bytes));
    }
    return null;
}

function getNumberFromPool(file:JavaClassFile, index:number): number | bigint{
    let info = <any> file.constant_pool[index];
    let bytes = null;
    if(info?.bytes !== undefined){
        bytes = info.bytes;
    } else if (info?.low_bytes !== undefined){
        bytes = (BigInt(info.high_bytes) << BigInt(32)) + BigInt(info.low_bytes);
    } else {
        return null;
    }

    switch(info.tag){
        case ConstantType.INTEGER:
        case ConstantType.LONG:
            return bytes;
        case ConstantType.FLOAT:
            let sf = ((bytes >> 31) === 0) ? 1 : -1;
            let ef = ((bytes >> 23) & 0xff);
            let mf = ef === 0 ? (bytes & 0x7fffff) << 1 : (bytes & 0x7fffff) | 0x800000;
            return Number.parseFloat((sf*mf*2**(ef-150)).toPrecision(6));
        case ConstantType.DOUBLE:
            let sd = bytes >> BigInt(63) === BigInt(0) ? BigInt(1) : BigInt(-1);
            let ed = (bytes >> BigInt(52)) & BigInt(0x7ff);
            let md = ed === BigInt(0) ?
                bytes & BigInt(0xfffffffffffff) >> BigInt(1):
                (bytes & BigInt(0xfffffffffffff)) | BigInt(0x10000000000000);
            return Number(sd)*Number(md)*Math.pow(2, Number(ed)-1075);
    }
    return null;

}

function getClassName(file:JavaClassFile, index:number): string{
    let info = file.constant_pool[index];
    if(info?.tag === ConstantType.CLASS) {
        return getStringFromPool(file, (<ClassInfo> info).name_index);
    }
    return null;
}

function getField(file:JavaClassFile, field:FieldInfo): JavaField{
    let descriptor = getStringFromPool(file, field.descriptor_index);
    if(descriptor === null){
        return null;
    }
    let type = new Type(descriptor);
    let scope = getScope(field.access_flags);

    let constVal = null;
    for(let attr of field.attributes){
        if(getStringFromPool(file, attr.attribute_name_index) === "ConstantValue"){
            constVal = getValueFromPool(file, (<ConstantValueAttributeInfo> attr).constantvalue_index);
        }
    }

    return {
        name: <string> getStringFromPool(file, field.name_index),
        type, 
        static:((field.access_flags & Modifier.STATIC) === Modifier.STATIC),
        constant: ((field.access_flags & Modifier.FINAL) === Modifier.FINAL),
        scope,
        constVal
    }
}

function getMethod(file:JavaClassFile, method:MethodInfo): JavaMethod{
    let name = getStringFromPool(file, method.name_index);
    let descriptor = getStringFromPool(file, method.descriptor_index);
    let returnType = new Type(descriptor.substr(descriptor.lastIndexOf(")")+1));
    let argString = descriptor.substring(1, descriptor.lastIndexOf(")"));
    let args: Type[] = [];
    let currentArrayStart = -1;
    for(let i = 0; i<argString.length; i++){
        if(argString[i] === "["){ // Track start of array
            if(currentArrayStart === -1){ 
                currentArrayStart = i;
            }
            continue;
        } else if (currentArrayStart >= 0){ // If this trips, then we've hit the end of the array count
            if (argString[i] === "L"){
                args.push(new Type(argString.substring(currentArrayStart, argString.indexOf(";", i)+1)));
                i = argString.indexOf(";", i);
            } else {
                args.push(new Type(argString.substring(currentArrayStart, i+1)));
            }
            currentArrayStart = -1;
        } else if (argString[i] === "L"){
            args.push(new Type(argString.substring(i, argString.indexOf(";", i)+1)));
            i = argString.indexOf(";", i);
        } else {
            args.push(new Type(argString[i]));
        }
    }

    let prettySignature = name+"(";
    for(let arg of args){
        prettySignature+=arg.pretty+", ";
    }
    if(prettySignature.endsWith(", ")){
        prettySignature = prettySignature.substring(0,prettySignature.length-2);
    }
    prettySignature+= ")";
    if(returnType.type !== DescriptorTypes.VOID){
        prettySignature += "=>"+returnType.pretty;
    }

    return {
        scope:getScope(method.access_flags),
        static: (method.access_flags & Modifier.STATIC) === Modifier.STATIC,
        abstract: (method.access_flags & Modifier.ABSTRACT) === Modifier.ABSTRACT,
        name,
        signatrue: name+descriptor,
        prettySignature,
        returnType,
        args
    };
}