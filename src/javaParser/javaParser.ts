import * as fs from 'fs';
import {JavaClass, JavaField, Type, Scope} from './interfaces';
import { JavaClassFileReader, ConstantType, Modifier, ClassInfo, JavaClassFile, Utf8Info, ConstantPoolInfo, FieldInfo, ConstantValueAttributeInfo, StringInfo, IntegerInfo, FloatInfo} from 'java-class-tools';
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

function getNumberFromPool(file:JavaClassFile, index:number): number{
    let info = file.constant_pool[index];
    switch(info.tag){
        case ConstantType.INTEGER:
            return (<IntegerInfo> info).bytes;
        case ConstantType.FLOAT:
            let bytes = (<FloatInfo> info).bytes;
            let s = ((bytes >> 31) === 0) ? 1 : -1;
            let e = ((bytes >> 23) & 0xff);
            let m = e === 0 ? (bytes & 0x7fffff) << 1 : (bytes & 0x7fffff) | 0x800000;
            return Number.parseFloat((s*m*2**(e-150)).toPrecision(6));


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
