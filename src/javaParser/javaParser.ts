import * as fs from 'fs';
import {JavaClass, JavaField, Type, Scope, ClassType, JavaMethod, DescriptorTypes, JavaInnerClass, MethodArg} from './interfaces';
import { JavaClassFileReader, ConstantType, Modifier, ClassInfo, JavaClassFile, Utf8Info, ConstantPoolInfo, FieldInfo, ConstantValueAttributeInfo, StringInfo, IntegerInfo, FloatInfo, DoubleInfo, MethodInfo, AttributeInfo, SourceFileAttributeInfo, InnerClassesAttributeInfo, LineNumberTableAttributeInfo, CodeAttributeInfo, LocalVariableTypeTableAttributeInfo, LocalVariableTableAttributeInfo} from 'java-class-tools';
import { TextDecoder } from 'util';
import Big from 'big.js';
import { METHODS } from 'http';
import { exit, mainModule } from 'process';
import { Method } from '../codeElements';

const reader = new JavaClassFileReader();
const textDecoder = new TextDecoder();

export function parse(basePath:string, classPath:string) : JavaClass{
    let startTime = new Date();
    let file = reader.read(classPath);
    console.log(JSON.stringify(file));
    // let classname = classFile.constant_pool[(<ClassInfo> classFile.constant_pool[classFile.this_class]).name_index];
    let classname = getClassName(file, file.this_class);
    let superclass = getClassName(file, file.super_class);

    console.log(`\n\nParsing ${classname}, extends ${superclass}`);

    let fields: JavaField[] = [];
    let methods: JavaMethod[] = [];
    let innerClasses:JavaInnerClass[] = [];

    for(let field of file.fields){
        fields.push(getField(file, field));
        // console.log(fields[fields.length-1].toString());
        // console.log(fields[fields.length-1].getPrettyName());
        // console.log(fields[fields.length-1].getFullPrettyName(true));
        // console.log();
    }

    for(let method of file.methods){
        methods.push(getMethod(file, method));
        // console.log(methods[methods.length-1].toString());
        // console.log(methods[methods.length-1].getPrettyName());
        // console.log(methods[methods.length-1].getFullPrettyName(true));
        // console.log();
    }

    console.log(`Parsed in: ${new Date().getMilliseconds() - startTime.getMilliseconds()}ms`);

    let pckg = classname.substring(0, classname.lastIndexOf("/"));
    let srcFile = "null";
    for(let attr of file.attributes){
        let attrName = getStringFromPool(file, attr.attribute_name_index);
        if(attrName === "SourceFile"){
            srcFile = basePath+"/"+pckg+"/"+getStringFromPool(file, (<SourceFileAttributeInfo> attr).sourcefile_index);
        } else if (attrName === "InnerClasses"){
            innerClasses = getInnerClases(file, <InnerClassesAttributeInfo> attr, classPath.replace(classname+".class", ""), basePath);
        }
    }

    return new JavaClass(classname.substr(classname.lastIndexOf("/")+1), pckg,
        getScope(file.access_flags), false, getClassType(file.access_flags), superclass, file, srcFile, fields, methods, innerClasses);
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

    return new JavaField(field.name_index, field.descriptor_index,
        getStringFromPool(file, field.name_index), getStringFromPool(file, field.descriptor_index), getClassName(file, file.this_class),
        scope, ((field.access_flags & Modifier.STATIC) === Modifier.STATIC), ((field.access_flags & Modifier.FINAL) === Modifier.FINAL),
        type, constVal);

}

function getMethod(file:JavaClassFile, method:MethodInfo): JavaMethod{
    let name = getStringFromPool(file, method.name_index);
    let descriptor = getStringFromPool(file, method.descriptor_index);
    let returnType = new Type(descriptor.substr(descriptor.lastIndexOf(")")+1));
    let argString = descriptor.substring(1, descriptor.lastIndexOf(")"));
    let args: MethodArg[] = [];
    let idxMap = new Map<number, number>();
    let nextIdx = 0;
    let startLine = -1;

    // Parse argument types, argument values comes from code attributes
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


        idxMap.set(nextIdx, args.length);
        // Longs/doubles take two spaces, so increment index by 2
        if(arg.type.type === DescriptorTypes.LONG || arg.type.type === DescriptorTypes.DOUBLE){
            nextIdx += 2;
        } else {
            nextIdx ++;
        }
        args.push(arg);
    }

    // Create pretty readble signature
    let prettySignature = name+"(";
    for(let arg of args){
        prettySignature+=arg.type.pretty+", ";
    }
    if(prettySignature.endsWith(", ")){
        prettySignature = prettySignature.substring(0,prettySignature.length-2);
    }
    prettySignature+= ")";
    if(returnType.type !== DescriptorTypes.VOID){
        prettySignature += "=>"+returnType.pretty;
    }

    console.log(name);
    // Get information from various attributes
    for(let attr of method.attributes){
        if(getStringFromPool(file, attr.attribute_name_index) === "Code"){
            // Get start line from line number table
            for(let codeAttr of (<CodeAttributeInfo> attr).attributes){
                if(getStringFromPool(file, codeAttr.attribute_name_index) === "LineNumberTable"){
                    // The first element in the index is the first instruction, so line before is method declaration
                    startLine = (<LineNumberTableAttributeInfo> codeAttr).line_number_table[0].line_number-1;
                } else if(getStringFromPool(file, codeAttr.attribute_name_index) === "LocalVariableTable"){
                    // The first element in the index is the first instruction, so line before is method declaration
                    for(let v of (<LocalVariableTableAttributeInfo> codeAttr).local_variable_table){
                        let vName = getStringFromPool(file, v.name_index);
                        // Ignore "this" or any variables declared during the function (pc > 0)
                        if(vName === "this" || v.start_pc !== 0){
                            continue;
                        }
                        let idx = v.index;
                        // Non-static methods have a "this" argument, so index must be bumped down for args to start at 0 
                        if((method.access_flags & Modifier.STATIC) !== Modifier.STATIC){
                            idx --;
                        }
                        console.log(idx);
                        console.log(vName);
                        args[idxMap.get(idx)].name = vName;
                        console.log(args);
                    }
                }
            }
        }

    }

    return new JavaMethod(method.name_index, method.descriptor_index, 
        name, descriptor, getClassName(file, file.this_class), 
        getScope(method.access_flags), (method.access_flags & Modifier.STATIC) === Modifier.STATIC, (method.access_flags & Modifier.FINAL) === Modifier.FINAL, (method.access_flags & Modifier.ABSTRACT) === Modifier.ABSTRACT,
        startLine, returnType, args, prettySignature);
}

function getInnerClases(file:JavaClassFile, info:InnerClassesAttributeInfo, buildPath:string, basePath:string): JavaInnerClass[] {
    let classes:JavaInnerClass[] = [];
    for(let cls of info.classes){
        if(file.this_class !==  cls.inner_class_info_index){ // If the inner class is also the outer class
            let path = buildPath+getClassName(file, cls.inner_class_info_index)+".class";
            if(!fs.existsSync(path)){ // Catch files that are from external libraries
                console.warn(`File does not exist ${path}`);
            } else {
                let newCls = parse(basePath, path);
                newCls.name = newCls.name.substr(newCls.name.lastIndexOf("$")+1);
                classes.push(JavaInnerClass.fromClass(newCls));
            }
        }
    }
    return classes;
}
