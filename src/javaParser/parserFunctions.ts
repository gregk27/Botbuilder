import { AttributeInfo, ClassInfo, ConstantType, JavaClassFile, Modifier, StringInfo, Utf8Info } from "java-class-tools";
import { TextDecoder } from "util";
import { ClassDetail, ClassType, Scope } from "./common";


const textDecoder = new TextDecoder();

export function getValueFromPool(file:JavaClassFile, index:number): any{
    let val = getStringFromPool(file, index);
    if(val === null){
        return getNumberFromPool(file, index);
    } else {
        return val;
    }
}

export function getStringFromPool(file:JavaClassFile, index:number): string {
    let info = file.constant_pool[index];
    if(info?.tag === ConstantType.CLASS){
        return getStringFromPool(file, (<ClassInfo>info).name_index);
    } else if(info?.tag === ConstantType.STRING){
        return getStringFromPool(file, (<StringInfo>info).string_index);
    } else if(info?.tag === ConstantType.UTF8){
        return textDecoder.decode(new Uint8Array((<Utf8Info> info).bytes));
    }
    return null;
}

export function getNumberFromPool(file:JavaClassFile, index:number): number | bigint{
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

export function getScope(access:number):Scope{
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

/**
 * Iterate over the attached attributes
 * @param file The `JavaClassFile` with relevant constant pool
 * @param attributes The attributes to parse
 * @param callbacks A hashmap with <Attribute name, Callback> such that an attribute with the given name will call the callback
 */
export function parseAttributes(file:JavaClassFile, attributes: AttributeInfo[], callbacks:{[name:string]: (attr:AttributeInfo)=>void}){
    let clbk:(attr:AttributeInfo)=>void = null;
    for(let attr of attributes){
        if((clbk = callbacks[getStringFromPool(file, attr.attribute_name_index)]) !== undefined){
            clbk(attr);
        }
    }
}

export function getClassType(access:number){
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

export function getClassDetail(fullName: string):ClassDetail {
    if(fullName === null){
        return null;
    }
    if(fullName.includes("$")){

    }
    let splitpoint = fullName.lastIndexOf("/");
    let pckg = fullName.substring(0,splitpoint);
    let name = fullName.substring(splitpoint+1);
    let outer = null;
    if((splitpoint = fullName.lastIndexOf("$")) !== -1){
        outer = fullName.substring(0, splitpoint);
        name = fullName.substring(splitpoint+1);
    }
    return {
        pckg,
        name,
        outer,
        full:fullName
    };
}