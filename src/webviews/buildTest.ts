import { ClassBuilder } from "../classBuilder/classBuilder";
import { Scope } from "../javaParser/common";
import { getClassDetail } from "../javaParser/parserFunctions";
import { getMockDescriptor } from "../config";

export function generateSubsytemTest(className:string, hardware:{name:string, type:string, doc:string}[]): {fields:ClassBuilder.Field[], code:string, varName:string}{
    let fields:ClassBuilder.Field[] = [];
    let code = "";
    let varName = className.charAt(0).toLowerCase() + className.slice(1);

    let args = "";
    for(let h of hardware){
        let mock = getClassDetail(getMockDescriptor(h.type));
        fields.push(new ClassBuilder.Field({import:mock.full, type:mock.name, isArray:false}, h.name, Scope.PRIVATE, h.doc));
        code += `${h.name} = new ${mock.name}();\n`;
        args += h.name+".getMock(), ";
    }
    args = args.slice(0, -2);

    code += "\n// Create subsytem instance\n";
    code += `${varName} = new ${className}(${args});`;

    fields.push(new ClassBuilder.Field({import:null, type:className, isArray:false}, varName, Scope.PRIVATE));

    return {fields, code, varName};
}