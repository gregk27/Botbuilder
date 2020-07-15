import * as fs from 'fs';
import {JavaClass, JavaField, Type, Scope} from './interfaces';
import { JavaClassFileReader, ConstantType, Modifier, ClassInfo, JavaClassFile, Utf8Info, ConstantPoolInfo, FieldInfo} from 'java-class-tools';
import { TextDecoder } from 'util';

const reader = new JavaClassFileReader();
const textDecoder = new TextDecoder();



export function parse(path:string, classPath:string){
    let startTime = new Date();
    let file = reader.read(classPath);
    console.log(JSON.stringify(file));
    // let classname = classFile.constant_pool[(<ClassInfo> classFile.constant_pool[classFile.this_class]).name_index];
    let classname = getClassName(file, file.this_class);
    let superclass = getClassName(file, file.super_class)

    console.log(`Parsing ${classname}, extends ${superclass}`);

    for(let field of file.fields){
        console.log(getField(file, field));
    }

    console.log(`Parsed in: ${new Date().getMilliseconds() - startTime.getMilliseconds()}ms`);
}

function getStringFromPool(file:JavaClassFile, index:number): string {
    let info = file.constant_pool[index];
    if(info?.tag === ConstantType.UTF8){
        return textDecoder.decode(new Uint8Array((<Utf8Info> info).bytes));
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
    let scope = Scope.DEFAULT;
    if((field.access_flags & Modifier.PRIVATE) === Modifier.PRIVATE){
        scope = Scope.PRIVATE;
    } else if ((field.access_flags & Modifier.PROTECTED) === Modifier.PROTECTED){
        scope = Scope.PROTECTED;
    } else if((field.access_flags & Modifier.PUBLIC) === Modifier.PUBLIC){
        scope = Scope.PUBLIC;
    }

    return {
        name: <string> getStringFromPool(file, field.name_index),
        type, 
        static:((field.access_flags & Modifier.STATIC) === Modifier.STATIC),
        constant:((field.access_flags & Modifier.FINAL) === Modifier.FINAL),
        scope
    }
}
